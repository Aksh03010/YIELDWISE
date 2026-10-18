# Verified research exports

These two JSON artifacts are included so the backend can run after cloning.
They contain numeric model parameters, fitted encodings, metrics and 35 saved
inference checks. No executable pickle files or raw training datasets are included.
The service checks the contract and replays each target before registering it.

The exports were produced from the project's existing Colab notebook on
October 18, 2026 using the user-authorized Tesla T4. `provenance.json` records
the completed run and export ZIP SHA256. Source dataset hashes, protocol IDs,
feature lists, split metrics and research scope are retained inside each export.

Maize inputs originate from the measured Genomes to Fields trial preparation;
soybean inputs originate from the measured SoyNAM trial preparation in the
existing research packet. These exports do not establish endorsement by the
dataset authors or validation for arbitrary farms. See
[the run review](../../docs/MODEL_INTEGRATION.md) for scope and limitations.

To replace the exports, use `python -m backend.import_artifacts EXPORT.zip
--sha256 EXPECTED_SHA256` and restart the backend. Review the resulting model
changes before committing. Prepared datasets and training checkpoints remain
excluded from Git.
