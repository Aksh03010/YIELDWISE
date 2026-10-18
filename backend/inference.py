"""Portable JSON inference. No pickle, executable model imports or sample fallback."""
from pathlib import Path
import hashlib
import json
import math
import re
import numpy as np

ARTIFACT_NAMES = {
    "corn": "maize_research_artifact.json",
    "soybeans": "soybean_research_artifact.json",
}
TARGET_NAMES = {
    "corn": {"Yield_Mg_ha", "Grain_Moisture", "Twt_kg_m3", "Silk_DAP_days", "Harvest_DAP_days"},
    "soybeans": {"yield_t_ha", "protein_percent", "oil_percent", "R8_maturity_DAP"},
}


def numeric(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f"{name} must be a finite number")
    return value


def predict_target(crop, target, inputs, site_id=None):
    features = target["features"]
    if set(inputs) != set(features):
        missing, extra = sorted(set(features) - set(inputs)), sorted(set(inputs) - set(features))
        raise ValueError(f"Input schema mismatch. Missing: {missing}; unexpected: {extra}")
    if crop == "corn":
        raw = [numeric(inputs[f], f) if inputs[f] is not None else target["scaler"]["median"][f] for f in features]
        scale = target["scaler"]
        x = np.asarray([[(v - scale["mean"][f]) / scale["std"][f] for f, v in zip(features, raw)]], dtype=np.float32)
    elif crop == "soybeans":
        for field in ("strain", "family", "site"):
            if not isinstance(inputs[field], str) or not inputs[field]:
                raise ValueError(f"{field} must be a nonempty experimental identifier")
        if inputs["strain"] not in target["vocabularies"]["strain"]:
            raise ValueError("This strain is outside the experimental SoyNAM domain")
        doy = numeric(inputs["planting_doy"], "planting_doy")
        raw = [float(inputs[f] == v) for f in ("strain", "family", "site") for v in target["vocabularies"][f]] + [doy]
        scale = target["scaler"]
        x = (np.asarray([raw], dtype=np.float32) - np.asarray(scale["mean"], dtype=np.float32)) / np.asarray(scale["std"], dtype=np.float32)
    else:
        raise ValueError("No artifact is installed for this crop")
    model = target["model"]
    kind = model["type"]
    if kind == "mean":
        if "group_key" in model:
            value = model["group_means"].get(inputs[model["group_key"]], model["global_mean"])
        else:
            value = model.get("constant", model.get("global_mean"))
    elif kind == "shrunk_site_history":
        if not isinstance(site_id, str) or not site_id:
            raise ValueError("The site-history baseline requires its original trial site_id")
        value = model["site_values"].get(site_id, model["global_mean"])
    elif kind == "ridge":
        value = (x @ np.asarray(model["coef"], dtype=np.float32) + np.float32(model["intercept"]))[0]
    elif kind == "mlp":
        if crop == "corn":
            weights, layers = model["inline_dense_weights"], (("0", True), ("3", True), ("5", False))
        else:
            weights, layers = model["state_dict"], (("net.0", True), ("net.2", False))
        for layer, relu in layers:
            x = x @ np.asarray(weights[f"{layer}.weight"], dtype=np.float32).T + np.asarray(weights[f"{layer}.bias"], dtype=np.float32)
            if relu:
                x = np.maximum(x, 0)
        value = x.reshape(-1)[0]
        if crop == "corn":
            value = value * np.float32(model["target_std"]) + np.float32(model["target_mean"])
    else:
        raise ValueError(f"Unsupported artifact model type: {kind}")
    return float(numeric(float(value), "model prediction"))


class ModelRegistry:
    def __init__(self, root):
        self.models, self.errors = {}, {}
        for crop, filename in ARTIFACT_NAMES.items():
            path = Path(root) / filename
            if not path.is_file():
                continue
            try:
                raw = path.read_bytes()
                artifact = json.loads(raw)
                if not isinstance(artifact, dict):
                    raise ValueError("Artifact must be a JSON object")
                if artifact.get("research_only") is not True or not re.fullmatch(r'[0-9a-f]{64}', artifact.get("prepared_sha256", "")):
                    raise ValueError("Missing research scope or source-data hash")
                expected_protocol = "g2f-early-season-v1" if crop == "corn" else "soybean-preseason-v1"
                if artifact.get("protocol") != expected_protocol:
                    raise ValueError("Unexpected training protocol")
                if not artifact.get("targets"):
                    raise ValueError("Artifact has no trained targets")
                for name, target in artifact["targets"].items():
                    if not isinstance(target.get("selected_candidate"), str) or not target["selected_candidate"] or not isinstance(target.get("warning"), str) or not target["warning"]:
                        raise ValueError(f"{name}: missing selection or scope information")
                    if name not in TARGET_NAMES[crop] or target["unit"] != artifact["manifest"]["targets"][name]["unit"]:
                        raise ValueError(f"{name}: unsupported target or mismatched units")
                    if target["features"] != artifact["manifest"]["feature_columns"] or not target.get("unit") or not target.get("test_metrics"):
                        raise ValueError(f"{name}: incomplete feature, unit or evaluation schema")
                    cases = target.get("replay_cases")
                    if not cases:
                        raise ValueError(f"{name}: no inference replay cases")
                    for case in cases:
                        actual = predict_target(crop, target, case["input"], case.get("site_id"))
                        expected = case["expected_prediction"]
                        if not math.isclose(actual, expected, rel_tol=1e-6, abs_tol=1e-5):
                            raise ValueError(f"{name}: saved inference replay failed")
                self.models[crop] = {"artifact": artifact, "version": hashlib.sha256(raw).hexdigest()}
            except (AttributeError, KeyError, ValueError, TypeError, IndexError, OSError) as error:
                self.errors[crop] = str(error)

    def catalog(self):
        crops = []
        for crop in ("wheat", "corn", "soybeans", "rice", "canola", "barley"):
            registered = self.models.get(crop)
            entry = {"crop": crop, "status": "unavailable", "targets": []}
            if registered:
                artifact = registered["artifact"]
                entry.update(status="research_only", version=registered["version"],
                             scope=artifact["manifest"].get("scope", artifact["manifest"].get("geography")),
                             unavailable_targets=artifact.get("unavailable_targets", {}),
                             targets=[{"id": name, "unit": target["unit"], "features": target["features"],
                                       "test_metrics": target["test_metrics"], "candidate": target["selected_candidate"],
                                       "warning": target["warning"]} for name, target in artifact["targets"].items()])
            else:
                entry["reason"] = "No replay-verified artifact is installed for this crop."
                if crop in self.errors:
                    entry["reason"] = "Artifact failed validation; inference is disabled."
            crops.append(entry)
        return {"crops": crops, "farm_forecasting_available": False,
                "unsupported": ["premium-grade probabilities", "optimal harvest windows", "causal weather or irrigation simulation", "crop prices and trading signals"],
                "notice": "Experimental trial results do not establish a forecast for an arbitrary farm or future season."}

    def predict(self, crop, target_name, inputs, site_id=None):
        registered = self.models.get(crop)
        if not registered:
            raise LookupError("No verified artifact is installed for this crop")
        artifact = registered["artifact"]
        if target_name not in artifact["targets"]:
            raise LookupError("No validated artifact exists for this target")
        # Maize includes calendar year as a predictor. Current/future years have
        # not been tested. This endpoint is an explicitly historical trial replay.
        if crop == "corn":
            year = numeric(inputs.get("Year"), "Year")
            if year != int(year) or not 2014 <= year <= 2021:
                raise ValueError("Maize research is limited to trial years 2014–2021")
            if inputs.get("weather_window_complete_31_days") != 1 or inputs.get("weather_days_observed") != 31:
                raise ValueError("Maize requires the complete planting-to-30-DAP weather window")
            for field, low, high in (("latitude", 14, 75), ("longitude", -170, -50)):
                if not low <= numeric(inputs.get(field), field) <= high:
                    raise ValueError("Coordinates are outside the prepared trial geography")
        target = artifact["targets"][target_name]
        warnings = [target["warning"], "This is research inference, with no calibrated prediction interval."]
        if target["model"]["type"] == "shrunk_site_history" and site_id not in target["model"]["site_values"]:
            warnings.append("Unknown trial site; the site-history baseline uses its training global mean.")
        if crop == "soybeans":
            doy = numeric(inputs.get("planting_doy"), "planting_doy")
            bounds = target["training_bounds"]["planting_doy"]
            if not bounds["min"] <= doy <= bounds["max"]:
                raise ValueError("Planting day is outside the fitted domain")
            for field in ("family", "site"):
                if inputs.get(field) not in target["vocabularies"][field]:
                    warnings.append(f"Unknown experimental {field}; encoded as zero indicators per the training protocol.")
        return {"crop": crop, "target": target_name, "value": predict_target(crop, target, inputs, site_id),
                "unit": target["unit"], "research_only": True, "model_version": registered["version"],
                "test_metrics": target["test_metrics"], "warnings": warnings}
