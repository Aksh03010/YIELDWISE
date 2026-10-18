# Verified model integration

Source: the existing Colab notebook, inspected and edited on October 18, 2026.
The recovered packet SHA256 is
`90384ad3d66349bea7c7aaeb141490399bfa822f570a07e9757c102b1296e412`.
The completed JSON export SHA256 is
`9e8fd8320d82e3c168e4a1f8a29c1e301aa37b36789064d565a9dc3686bc1d31`.

## Recovery

- The original NumPy/GPU check rejected a 0.000061 kg/m3 float32 test-weight
  difference. Export parity now uses `atol=1e-5, rtol=1e-6` across every MLP
  test row and records its observed maximum error. Material or nonfinite
  discrepancies still fail. These tolerances are numerical, not uncertainty.
- Soybean protein/oil training is unavailable when a frozen split has no labels.
  Their 2013 test counts are zero; no validated artifact was manufactured.
- A duplicate Year column broke a maize replay sidecar after all five artifacts
  had been saved. The sidecar was regenerated with unique columns, with no
  retraining or model-selection changes. The source is repaired for future runs.
- A100 allocation was unavailable. The user explicitly authorized T4. CUDA-only
  training remained in force; the run report records Tesla T4 and PyTorch
  2.11.0+cu130. Historical candidate names containing A100 are unchanged labels,
  not a claim about the device used for the recovery.
- The existing notebook now includes eight ordered hash-checked packet cells,
  the recovery runner and the JSON export cell. Earlier experiments remain.

## Held-out results

| Target | Selected model MAE | Best simple baseline MAE | Test environments |
| --- | ---: | ---: | ---: |
| Maize yield (t/ha) | 2.2722 | 2.1434 | 69 |
| Maize moisture (percentage points) | 3.2478 | 3.2478 | 69 |
| Maize test weight (kg/m3) | 39.9376 | 39.9508 | 63 |
| Maize silking (days after planting) | 2.4036 | 6.2743 | 60 |
| Maize recorded harvest operation (days after planting) | 10.5667 | 12.9143 | 69 |
| Soybean yield (t/ha) | 0.8667 | 0.8771 | 7 |
| Soybean R8 maturity (days after planting) | 8.0197 | 7.7371 | 7 |

Maize metrics compute absolute error on site-season means. Soybean metrics
average per-plot absolute errors within each environment, then average
environments. Compare within a target, not across these averaging rules.
Validation selected each candidate before test scoring. The selected maize
moisture model is itself a site-history baseline. Ontario was separate from
maize fitting and selection; those errors are retained in the exported scores.

These results do not establish future forecasts for arbitrary North American
farms. No post-test model reselection, calibration or broad geographic
validation was performed. Missing weather/soil features, commercial soybean
genotypes and new seasons are not fabricated.

## Serving contract

`GET /api/models` reports crop/target availability, units, required features,
test errors, research scope and the SHA256 model version. Missing or corrupt
artifacts remain unavailable. Every registered target must pass its saved
inference replays. The current exports contain 25 maize and 10 soybean cases.

The verified JSON exports and run provenance are committed in
`backend/artifacts/`. Raw prepared datasets and training checkpoints are not.
`POST /api/weather` accepts validated North American coordinates and retrieves
modeled Open-Meteo weather through the backend. Results carry model/retrieval
timestamps and cache status; the cache expires after ten minutes. Provider
failures return 503 and missing measurements remain null. The service does
not pass weather values into a trial model without its required input contract.

`POST /api/predict` requires `{crop, target, inputs, research_only: true}` and a
trial `site_id` for the maize site-history baseline. Extra/missing input keys,
nonfinite numbers and unsupported targets are rejected. Maize serving is
restricted to the 2014–2021 research years, complete 31-day early weather
windows and prepared geographic bounds. Soybean rejects unknown strains and
out-of-bounds planting days; unknown family/site encodings are flagged.

Saved test replays can include a planting date outside fitted serving bounds.
Their numeric parity is verified internally; the public endpoint still rejects
that input. No endpoint substitutes a demo yield, sample weather or price.

The frontend does not infer yield automatically from a field profile. Its
research form exposes the exact input requirement and shows outputs with scope
and error information. There is no calibrated grade probability, economically
optimal harvest date or causal rainfall/irrigation response model. The
input-based economics calculator is independent of model predictions.
