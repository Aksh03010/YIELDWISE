"""Paste this cell into Colab. Upload the packet produced by build_packet.py."""
from pathlib import Path
import hashlib
import json
import os
import runpy
import sys
import traceback
import zipfile
from datetime import datetime, timezone
import torch
from google.colab import files

EXPECTED_PACKET_SHA256 = "__PACKET_SHA256__"
PACKET_NAME = "HARVEST_training_fixed.zip"

if not torch.cuda.is_available() or "T4" not in torch.cuda.get_device_name().upper():
    raise RuntimeError("Select the user-authorized T4 runtime before running this cell. No CPU training fallback.")
packet = Path("/content") / PACKET_NAME
if not packet.exists():
    print(f"Select {PACKET_NAME}. This contains the original measured data and repaired scripts.", flush=True)
    uploaded = files.upload()
    if PACKET_NAME not in uploaded:
        raise ValueError(f"Expected {PACKET_NAME}")
    packet.write_bytes(uploaded[PACKET_NAME])
digest = hashlib.sha256(packet.read_bytes()).hexdigest()
if digest != EXPECTED_PACKET_SHA256:
    raise ValueError("Training packet hash mismatch; refusing to run.")

root = Path("/content/HARVEST_training_fixed")
root.mkdir(exist_ok=True)
with zipfile.ZipFile(packet) as archive:
    for name in archive.namelist():
        if not (root / name).resolve().is_relative_to(root.resolve()):
            raise ValueError("Unsafe archive path")
    archive.extractall(root)
os.chdir(root)
sys.path.insert(0, str(root))
# Always reload the local precision helper when repeating this cell.
sys.modules.pop("portable_validation", None)
report = {"started_at": datetime.now(timezone.utc).isoformat(), "packet_sha256": digest,
          "device": torch.cuda.get_device_name(), "pytorch": torch.__version__, "runs": {},
          "hardware_amendment": "User authorized the available T4 on 2026-10-18 after Colab could not allocate A100. Data, splits, candidates and hyperparameters unchanged."}
for script in ("train_maize_gpu.py", "train_soybean_gpu.py"):
    print(f"\nRunning {script}", flush=True)
    sys.argv = [script, "--allowed-gpu", "T4"]
    try:
        runpy.run_path(str(root / script), run_name="__main__")
        report["runs"][script] = {"status": "complete"}
    except Exception as error:
        traceback.print_exc()
        report["runs"][script] = {"status": "failed", "error": str(error)}
report["finished_at"] = datetime.now(timezone.utc).isoformat()
(root / "run_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
export = Path("/content/HARVEST_model_artifacts.zip")
with zipfile.ZipFile(export, "w", zipfile.ZIP_DEFLATED) as archive:
    archive.write(root / "run_report.json", "run_report.json")
    for folder in ("maize_artifacts", "soybean_artifacts"):
        for path in (root / folder).glob("*"):
            if path.is_file():
                archive.write(path, str(path.relative_to(root)))
print(json.dumps(report, indent=2), flush=True)
print("Artifact export:", export, "SHA256", hashlib.sha256(export.read_bytes()).hexdigest(), flush=True)
files.download(str(export))
if any(run["status"] != "complete" for run in report["runs"].values()):
    raise RuntimeError("Some training failed. The exported run report identifies failures; successful artifacts are retained.")
