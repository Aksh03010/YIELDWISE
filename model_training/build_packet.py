"""Repackage the exact audited dataset with repaired runners; never redownload data."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ORIGINAL_SHA256 = "90384ad3d66349bea7c7aaeb141490399bfa822f570a07e9757c102b1296e412"
ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("original_packet", type=Path)
    parser.add_argument("output_directory", type=Path)
    args = parser.parse_args()
    raw = args.original_packet.read_bytes()
    if hashlib.sha256(raw).hexdigest() != ORIGINAL_SHA256:
        raise ValueError("The source packet differs from the notebook's audited snapshot")
    args.output_directory.mkdir(parents=True, exist_ok=True)
    output = args.output_directory / "HARVEST_training_fixed.zip"
    source_hashes = {}
    with zipfile.ZipFile(args.original_packet) as source, zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
        for name in source.namelist():
            content = (ROOT / name).read_bytes() if name in {"train_maize_gpu.py", "train_soybean_gpu.py"} else source.read(name)
            source_hashes[name] = hashlib.sha256(content).hexdigest()
            target.writestr(name, content)
        helper = (ROOT / "portable_validation.py").read_bytes()
        target.writestr("portable_validation.py", helper)
        source_hashes["portable_validation.py"] = hashlib.sha256(helper).hexdigest()
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    runner = (ROOT / "colab_runner.py").read_text(encoding="utf-8").replace("__PACKET_SHA256__", digest)
    (args.output_directory / "colab_recovery_cell.py").write_text(runner, encoding="utf-8")
    receipt = {"original_packet_sha256": ORIGINAL_SHA256, "fixed_packet_sha256": digest, "member_sha256": source_hashes}
    (args.output_directory / "training_packet_receipt.json").write_text(json.dumps(receipt, indent=2), encoding="utf-8")
    print(json.dumps({"packet": str(output), "sha256": digest}, indent=2))


if __name__ == "__main__":
    main()
