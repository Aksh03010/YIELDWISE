# HARVEST

Field records, modeled weather, experimental location-based maize inference,
explicit harvest economics and measured-target trial inference. The React
frontend connects to Python FastAPI. Accuracy for arbitrary farms and future
seasons has not been validated.

## Run locally

Use Node compatible with Vite 8 and Python 3.11 or newer. From the repository:

```powershell
npm ci
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements.txt
.venv\Scripts\python backend/serve.py
```

In a second terminal, run `npm run dev`. Vite proxies `/api` to
`http://127.0.0.1:8000`. The backend binds only to the loopback address. For
local development the Python launcher reloads backend source changes. Restart
an older running launcher once to load this behavior and the new API route. For
production, the included Docker image serves the built frontend and API on
one origin, including client-route fallbacks. See [the stack and deployment
guide](docs/TECH_STACK.md). No cloud deployment has been provisioned.

## Install model artifacts

The verified research exports are included in `backend/artifacts/` so a clone
can run immediately. Models are JSON, never executable pickle files. To update
them, download a verified export from the existing Colab notebook and use the
SHA256 printed beside it:

```powershell
python -m backend.import_artifacts PATH_TO_EXPORT.zip --sha256 SHA256_FROM_COLAB
```

The importer verifies the ZIP hash, completed run report, source hashes,
protocol, input schema and saved inference cases before installing models in
`backend/artifacts/`. Restart the backend after importing and review the model
changes before committing. Raw prepared datasets and checkpoints are excluded.

## Current workspace

- Overview: field identity, actual weather availability and model readiness.
- Yield outlook: defaults to Your field location. Enter coordinates, actual
  planting date and area; the backend fetches the first 31 days of NASA POWER
  environmental data and runs the maize models. Results echo the actual
  coordinates, window, model version and source hash. New seasons/fields are
  explicitly experimental. Trial examples are a separate, deliberate mode.
  SoyNAM requires experimental strain/family/site inputs and is not converted
  into a coordinate-only model.
  Automatic updates are on by default: completed input edits trigger an estimate
  after a short pause, and the model is checked every minute while visible.
  Current weather for the entered coordinates loads without a planting date and
  refreshes every minute, including on return to the page. Pause/resume controls,
  last-check times, provider retrieval times and cache status
  distinguish current conditions from the model's observed planting window.
  Harvest timing shows a calendar date and an error-based planning range from
  the displayed planting date. Soybean R8 dates remain maturity estimates.
- Harvest planning: input-based quantity, saleable fraction, price and cost
  comparisons; measured grain-factor checks against buyer thresholds.
- Field setup: coordinates, crop, variety, area and management records saved in
  browser storage. Device lookup has its own 12-second deadline and cancellation;
  latitude and longitude can be entered manually. Rice may be recorded
  even though no rice model is installed.
- Field conditions: seven-day Open-Meteo weather and transparent freezing,
  heat and rainfall threshold checks. These are not crop-damage probabilities.
- Data & methodology: research scope and product limitations.

The previous synthetic yield history, 1/6/12-month fixtures, grade probabilities,
automatic optimal harvest windows, weather/irrigation yield sliders, supply
price sensitivity and trading features have been removed. `/market` redirects
to methodology. Failed weather requests remain unavailable.

## Research status

The October 18, 2026 Colab recovery used the user-authorized Tesla T4 after A100
was unavailable. The measured datasets, chronological splits, candidates and
hyperparameters were retained. Five maize targets and two SoyNAM targets were
exported; all 35 selected-model replay cases pass locally. Protein and oil
cannot be validated because the frozen soybean test year has no labels.

The selected maize yield model did not beat the simple held-out baselines.
Soybean yield's improvement was small and based on seven test environments;
R8 maturity did not beat its strongest baseline. Registered models remain
research-only. See [the run review](docs/MODEL_INTEGRATION.md).

## Checks

```powershell
npm test
npm run lint
npm run build
python -m unittest backend.test_inference backend.test_api backend.test_real_artifacts backend.test_weather backend.test_field_forecast
python -m unittest discover -s model_training -p 'test_*.py'
```

The real-artifact tests skip if the included artifacts are removed. Core registry
and API tests use isolated test fixtures. The Colab training sources and recovery
packet builder are in `model_training/`; prepared data stays outside the repo.

Field profiles stay in browser storage. Coordinates are posted to the HARVEST
backend, which retrieves Open-Meteo weather and caches results for one minute.
Coordinates and planting dates are also sent to NASA POWER when a field estimate
is requested. They are sent to OpenStreetMap when its link is opened. Research inputs
are sent to the model service only when the research form is submitted.
NASA imagery, NDVI and soil/terrain data services are not connected.
Device location requires browser permission. Latitude and longitude can also be entered manually.
