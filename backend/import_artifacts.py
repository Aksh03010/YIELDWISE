"""Validate the Colab JSON export before installing any inference artifacts."""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import zipfile
from .inference import ARTIFACT_NAMES, ModelRegistry


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--out', type=Path, default=Path(__file__).parent / 'artifacts')
    args = parser.parse_args()
    digest = hashlib.sha256(args.archive.read_bytes()).hexdigest()
    if digest != args.sha256:
        raise ValueError('The artifact archive does not match the notebook export hash')
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=args.out.parent) as scratch:
        scratch = Path(scratch)
        with zipfile.ZipFile(args.archive) as archive:
            report = json.loads(archive.read('run_report.json'))
            if any(run['status'] != 'complete' for run in report['runs'].values()):
                raise ValueError('Training report contains incomplete runs')
            for crop, filename in ARTIFACT_NAMES.items():
                folder = 'maize_artifacts' if crop == 'corn' else 'soybean_artifacts'
                (scratch / filename).write_bytes(archive.read(f'{folder}/{filename}'))
        registry = ModelRegistry(scratch)
        if registry.errors or set(registry.models) != set(ARTIFACT_NAMES):
            raise ValueError(f'Artifact replay failed: {registry.errors}')
        args.out.mkdir(parents=True, exist_ok=True)
        for filename in ARTIFACT_NAMES.values():
            (args.out / filename).write_bytes((scratch / filename).read_bytes())
        (args.out / 'provenance.json').write_text(json.dumps({'export_sha256': digest, 'run_report': report}, indent=2), encoding='utf-8')
        print(json.dumps({'registered': sorted(registry.models), 'replay_cases': {crop: sum(len(t['replay_cases']) for t in model['artifact']['targets'].values()) for crop, model in registry.models.items()}}, indent=2))


if __name__ == '__main__':
    main()
