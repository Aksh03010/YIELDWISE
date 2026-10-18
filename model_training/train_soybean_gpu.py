"""Train SoyNAM baselines, Ridge, and a compact CUDA-only MLP.

Run on an existing CUDA A100: ``python train_soybean_gpu.py --epochs 160``.
The saved JSON has portable coefficients/state for non-neural selected models;
an MLP selection stores its layer weights as JSON but is never evaluated through
a CPU neural fallback.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from portable_validation import validate_replay
try:
    import torch
except ModuleNotFoundError as error:
    raise SystemExit("PyTorch with CUDA is required; use the designated A100 environment.") from error

ROOT = Path(__file__).resolve().parent
PREPARED = ROOT / "soybean_prepared"
ARTIFACTS = ROOT / "soybean_artifacts"
FEATURES = ["strain", "family", "site", "planting_doy"]
CAT_FEATURES = ["strain", "family", "site"]
TARGETS = ["yield_t_ha", "protein_percent", "oil_percent", "R8_maturity_DAP"]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for part in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(part)
    return digest.hexdigest()


def environment_macro_mae(frame: pd.DataFrame, actual: np.ndarray, predicted: np.ndarray) -> float:
    score = pd.DataFrame({"environment": frame["environment"].to_numpy(), "absolute_error": np.abs(actual - predicted)})
    return float(score.groupby("environment", sort=False).absolute_error.mean().mean())


def build_design(frame: pd.DataFrame, state: dict) -> np.ndarray:
    columns = []
    for name in CAT_FEATURES:
        values = frame[name].astype(str).to_numpy()
        vocab = state["vocabularies"][name]
        columns.append(np.column_stack([(values == value).astype(np.float32) for value in vocab]))
    x = np.column_stack(columns + [frame["planting_doy"].astype(float).to_numpy().reshape(-1, 1)]).astype(np.float32)
    return (x - np.asarray(state["feature_mean"], dtype=np.float32)) / np.asarray(state["feature_scale"], dtype=np.float32)


def make_state(train: pd.DataFrame) -> dict:
    raw_parts, labels = [], []
    vocabs = {}
    for name in CAT_FEATURES:
        vocab = sorted(train[name].astype(str).unique().tolist())
        vocabs[name] = vocab
        values = train[name].astype(str).to_numpy()
        raw_parts.append(np.column_stack([(values == value).astype(np.float32) for value in vocab]))
        labels.extend([f"{name}={value}" for value in vocab])
    raw_parts.append(train["planting_doy"].astype(float).to_numpy().reshape(-1, 1))
    labels.append("planting_doy")
    raw = np.column_stack(raw_parts).astype(np.float32)
    scale = raw.std(axis=0); scale[scale < 1e-8] = 1.0
    return {"vocabularies": vocabs, "design_columns": labels, "feature_mean": raw.mean(axis=0).tolist(), "feature_scale": scale.tolist()}


def baseline_predict(train: pd.DataFrame, apply: pd.DataFrame, target: str, kind: str) -> tuple[np.ndarray, dict]:
    global_mean = float(train[target].mean())
    if kind == "training_mean":
        return np.full(len(apply), global_mean), {"global_mean": global_mean}
    grouped = train.groupby("site")[target].mean().to_dict() if kind == "training_site_mean_with_global_fallback" else train.groupby("family")[target].mean().to_dict()
    key = "site" if kind == "training_site_mean_with_global_fallback" else "family"
    return apply[key].map(grouped).fillna(global_mean).to_numpy(), {"global_mean": global_mean, "group_key": key, "group_means": {str(k): float(v) for k, v in grouped.items()}}


class SmallMLP(torch.nn.Module):
    def __init__(self, width: int):
        super().__init__()
        self.net = torch.nn.Sequential(torch.nn.LazyLinear(width), torch.nn.ReLU(), torch.nn.Linear(width, 1))
    def forward(self, value): return self.net(value).squeeze(-1)


def fit_mlp(x: np.ndarray, y: np.ndarray, xv: np.ndarray, epochs: int, seed: int) -> tuple[np.ndarray, dict]:
    torch.manual_seed(seed)
    model = SmallMLP(32).cuda()
    x_t, y_t, xv_t = torch.tensor(x, device="cuda"), torch.tensor(y, device="cuda"), torch.tensor(xv, device="cuda")
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-3, weight_decay=1e-4)
    for _ in range(epochs):
        optimizer.zero_grad(); loss = torch.nn.functional.l1_loss(model(x_t), y_t); loss.backward(); optimizer.step()
    with torch.no_grad(): prediction = model(xv_t).float().cpu().numpy()
    state = {name: tensor.detach().float().cpu().tolist() for name, tensor in model.state_dict().items()}
    return prediction, state


def train_target(all_data: pd.DataFrame, target: str, epochs: int, seed: int) -> dict:
    labeled = all_data[all_data[target].notna()].copy()
    train, val, test = (labeled[labeled.split == split].copy() for split in ("train", "validation", "test"))
    state = make_state(train); x_train, x_val = build_design(train, state), build_design(val, state)
    y_train, y_val = train[target].to_numpy(dtype=np.float32), val[target].to_numpy(dtype=np.float32)
    candidates, payloads = {}, {}
    for kind in ("training_mean", "training_site_mean_with_global_fallback", "training_family_mean"):
        pred, payload = baseline_predict(train, val, target, kind)
        candidates[kind] = environment_macro_mae(val, y_val, pred); payloads[kind] = payload
    ridge = Ridge(alpha=10.0, solver="lsqr", tol=1e-5).fit(x_train, y_train)
    ridge_pred = ridge.predict(x_val)
    candidates["ridge"] = environment_macro_mae(val, y_val, ridge_pred)
    payloads["ridge"] = {"alpha": 10.0}
    mlp_pred, mlp_state = fit_mlp(x_train, y_train, x_val, epochs, seed)
    candidates["small_MLP_on_existing_A100"] = environment_macro_mae(val, y_val, mlp_pred)
    payloads["small_MLP_on_existing_A100"] = {"width": 32, "epochs": epochs, "validation_state": mlp_state}
    selected = min(candidates, key=candidates.get)

    # Refit only after the validation decision, using train + validation. Test is read once here.
    fit = pd.concat([train, val], ignore_index=True); final_state = make_state(fit)
    x_fit, x_test = build_design(fit, final_state), build_design(test, final_state)
    y_fit, y_test = fit[target].to_numpy(dtype=np.float32), test[target].to_numpy(dtype=np.float32)
    if selected in {"training_mean", "training_site_mean_with_global_fallback", "training_family_mean"}:
        test_pred, final_payload = baseline_predict(fit, test, target, selected)
        model_type = "baseline"
    elif selected == "ridge":
        final_ridge = Ridge(alpha=10.0, solver="lsqr", tol=1e-5).fit(x_fit, y_fit); test_pred = final_ridge.predict(x_test)
        final_payload = {"alpha": 10.0, "coef": final_ridge.coef_.tolist(), "intercept": float(final_ridge.intercept_)}; model_type = "ridge"
    else:
        test_pred, mlp_final = fit_mlp(x_fit, y_fit, x_test, epochs, seed + 1)
        final_payload = {"width": 32, "epochs": epochs, "state_dict": mlp_final}; model_type = "MLP"
        portable = x_test
        for layer, relu in (("net.0", True), ("net.2", False)):
            portable = portable @ np.asarray(mlp_final[f"{layer}.weight"], dtype=np.float32).T + np.asarray(mlp_final[f"{layer}.bias"], dtype=np.float32)
            if relu:
                portable = np.maximum(portable, 0)
        final_payload["portable_replay"] = validate_replay(test_pred, portable.squeeze(-1))
    bounds = {name: {"min": float(fit[name].astype(float).min()), "max": float(fit[name].astype(float).max())} for name in ["planting_doy"]}
    units = {"yield_t_ha": "t/ha", "protein_percent": "percent", "oil_percent": "percent", "R8_maturity_DAP": "days after planting"}
    main = {
        "selected_candidate": selected, "modeltype": model_type, "unit": units[target], "features": FEATURES,
        "vocabularies": final_state["vocabularies"],
        "scaler": {"mean": final_state["feature_mean"], "std": final_state["feature_scale"], "design_columns": final_state["design_columns"]},
        "training_bounds": bounds,
        "test_metrics": {"environment_macro_mae": environment_macro_mae(test, y_test, test_pred), "rows": len(test), "environments": int(test.environment.nunique())},
        "warning": "Research-only experimental SoyNAM scope; no matched weather. R8 is physiological maturity, not an optimal harvest day.",
        "domain_guards": {"unknown_strain": "reject", "unknown_family": "flag_and_encode_all_zero", "unknown_site": "flag_and_encode_all_zero", "planting_doy_out_of_bounds": "reject"},
        "model": {"type": "mean" if model_type == "baseline" else model_type.lower(), **final_payload},
    }
    environment_test = pd.DataFrame({"environment": test.environment.to_numpy(), "actual": y_test, "prediction": test_pred}).groupby("environment", sort=False).mean().reset_index()
    sidecar = {
        "target": target, "candidate_validation_environment_macro_mae": candidates,
        "test_environment_mean_predictions": [{"environment": str(row.environment), "actual": float(row.actual), "prediction": float(row.prediction)} for _, row in environment_test.iterrows()],
        "replay_cases": [{"input": {name: (int(row[name]) if name == "planting_doy" else str(row[name])) for name in FEATURES}, "expected_prediction": float(pred), "split": "test"} for (_, row), pred in zip(test.head(5).iterrows(), test_pred[:5])],
    }
    main["replay_cases"] = sidecar["replay_cases"]
    main["test_baselines"] = {kind: {"environment_macro_mae": environment_macro_mae(test, y_test, baseline_predict(fit, test, target, kind)[0])} for kind in ("training_mean", "training_site_mean_with_global_fallback", "training_family_mean")}
    print(f"  selected {selected}; test MAE {main['test_metrics']['environment_macro_mae']:.4f} {units[target]}", flush=True)
    return main, sidecar


def main() -> None:
    parser = argparse.ArgumentParser(); parser.add_argument("--epochs", type=int, default=160); parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--allowed-gpu", choices=["A100", "T4"], default="A100")
    args = parser.parse_args()
    if not torch.cuda.is_available():
        raise RuntimeError("CUDA GPU is required: refusing CPU neural fallback.")
    if args.allowed_gpu not in torch.cuda.get_device_name().upper():
        raise RuntimeError(f"Requested {args.allowed_gpu} GPU; no automatic alternate-device fallback.")
    random.seed(args.seed); np.random.seed(args.seed); torch.cuda.manual_seed_all(args.seed)
    data_file, manifest_file = PREPARED / "soynam_preseason.csv.gz", PREPARED / "manifest.json"
    if not data_file.exists() or not manifest_file.exists(): raise SystemExit("Run prepare_soybean.py first.")
    data, manifest = pd.read_csv(data_file), json.loads(manifest_file.read_text(encoding="utf-8"))
    if manifest["prepared_sha256"] != sha256(data_file): raise SystemExit("Prepared data hash does not match manifest.")
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    trained, unavailable = {}, {}
    for index, target in enumerate(TARGETS):
        counts = {split: int(data.loc[data.split == split, target].notna().sum()) for split in ("train", "validation", "test")}
        if not all(counts.values()):
            unavailable[target] = {"status": "unavailable", "reason": "Measured labels are absent in a required frozen split; no validated artifact was trained.", "labeled_rows": counts}
            print(f"Soybean: {target} unavailable; labeled rows {counts}", flush=True)
            continue
        print(f"Soybean: {target}", flush=True)
        trained[target] = train_target(data, target, args.epochs, args.seed + index)
    models = {target: result[0] for target, result in trained.items()}
    sidecar = {target: result[1] for target, result in trained.items()}
    artifact = {"protocol": manifest["protocol"], "research_only": True, "gpu": {"required": True, "device": torch.cuda.get_device_name()}, "prepared_sha256": sha256(data_file), "manifest": manifest, "no_matched_weather": True, "targets": models, "unavailable_targets": unavailable}
    output = ARTIFACTS / "soybean_research_artifact.json"; output.write_text(json.dumps(artifact, indent=2), encoding="utf-8")
    (ARTIFACTS / "soybean_research_sidecar.json").write_text(json.dumps(sidecar, indent=2), encoding="utf-8")
    print(output); print(json.dumps({key: value["test_metrics"] for key, value in models.items()}, indent=2))


if __name__ == "__main__":
    main()
