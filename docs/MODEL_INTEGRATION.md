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
timestamps and cache status; the cache expires after one minute. Provider
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

The field workflow automatically runs the maize model when coordinates, actual
planting date and area are complete, after an 800 ms pause in editing. It checks
again every minute while visible and when the tab returns to the foreground.
Polling can be paused; refresh failures retain the previous result only for
exactly matching field inputs. Current weather loads from coordinates even before
a planting date is entered. Source retrieval times are distinct from check times:
rechecking historical planting weather can leave the estimate unchanged.

Installed models are selectable even if the saved field uses an unsupported crop.
In the separate Trial examples mode, example inputs run through the real backend
automatically; no example prediction values are stored in frontend code.
Maize uses a recorded COH1 trial input;
the soybean example uses a known strain/site and planting day 145 inside fitted
bounds. Example inputs are separate from the saved field. Editable research
inputs and model-performance details remain available. There is no calibrated grade probability, economically
optimal harvest date or causal rainfall/irrigation response model. The
input-based economics calculator is independent of model predictions.

## Experimental location inference

`POST /api/field-forecast` accepts maize, coordinates, planting date, hectares
and `research_only: true`. This path retrieves actual NASA POWER AG/LST daily
data for planting through day 30, requires all 31 days for every required
variable, validates units, and computes the same mean/min/max/sum feature schema.
Future or incomplete weather windows return an error. It does not borrow trial
inputs or fill missing days from training medians. Results show coordinates,
environment summaries, source/version/hash, conversions and model version.

Current NASA AG PAR totals arrive as MJ/m²/day. The frozen G2F features use
average W/m², consistent with the
[G2F publication's variable definitions](https://www.genomes2fields.org/docs/publications/2024.02.08.579534v1.full.pdf).
The adapter converts by 1,000,000/86,400 before aggregation; other unexpected
units fail. A live COH1 2021 source comparison exposed this mismatch before
serving. NASA revisions differ slightly from the frozen research snapshot.

This path allows current seasons as explicitly experimental extrapolation and
reports inputs outside fitted ranges. It does not change `/api/predict`'s strict
historical trial guards, reselect models, or claim validation on new farms.
The site-history moisture baseline is excluded from new-field outputs because
it cannot infer a new field's moisture from coordinates. Yield, test weight,
silking and recorded harvest timing use their selected environmental models.
Area multiplies yield into tonnes; it is not a yield predictor. SoyNAM has no
coordinate/weather predictors and remains in the separate trial-input workflow.

NASA responses are cached for 24 hours in a bounded 128-entry cache keyed by
coordinates and planting window. Nearby fields can share coarse environmental
grid data; a point request is not a soil test or satellite field delineation.
