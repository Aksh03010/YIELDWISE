# Measured-target research training

These runners were recovered from the existing Colab cell on October 18, 2026.
They retain the original candidate models, random seeds, split definitions,
feature cutoffs. No new model performance is claimed here. On October 18 the
user explicitly authorized the available T4 after Colab could not allocate
A100. The recovery cell passes `--allowed-gpu T4` and records that amendment;
standalone runners still default to A100. Both refuse CPU neural training.

The failed maize run rejected an export difference of 0.00006103515625 kg/m3
for test weight. Portable inference now checks every test row with a stored
absolute tolerance of 1e-5 and relative tolerance of 1e-6. Invalid predictions
or material mismatches still fail. These tolerances measure numerical parity;
they do not describe agronomic uncertainty.

SoyNAM's frozen 2013 test split has zero measured protein or oil labels. Those
two targets are recorded as unavailable and omitted from validated artifacts.
The existing yield and R8 maturity experiments can continue. R8 maturity is
not an optimal harvest date, and composition measurements do not establish
grade probabilities. Each crop runs independently so one failure does not
prevent the other from starting. The export records partial failures.

## Prepare a recovery packet

Use Python with NumPy for the numerical regression test:

```powershell
python -m unittest discover -s model_training -p 'test_*.py'
python model_training/build_packet.py PATH_TO_ORIGINAL_PACKET.zip OUTPUT_DIRECTORY
```

The original packet is the ZIP embedded in the notebook's final training cell;
its SHA256 must match the value in `build_packet.py`. Data is intentionally
kept outside this repository. The builder preserves the prepared datasets
byte for byte and writes a receipt with all member hashes.

In the user-authorized T4 Colab runtime, add the generated
`colab_recovery_cell.py` as one code cell, run it and select
`HARVEST_training_fixed.zip` when prompted. Run this cell by itself. Exported
artifacts still need inference replay, domain checks and held-out baseline
review before product use. A completed run is not farm validation.
