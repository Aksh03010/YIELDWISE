# YIELDWISE
THE COLAB IS : https://colab.research.google.com/drive/1RNsokNnPXZLm_buU1pM3klDmY2-IqQmY?usp=sharing
YIELDWISE is a field-planning workspace that brings a grower’s field record,
seven-day weather, transparent operating assumptions, and measured research
models into one interface. It is built to make the source and limits of every
result clear.

> **For judges:** start on the Overview, open **Yield outlook**, then use
> **Harvest planning** and **Field conditions**. The **Data & methodology**
> page explains exactly which results come from research models and which are
> user-entered calculations.

## What it demonstrates

- **Field-first workflow:** save a location, crop, variety, area, and field
  management details directly in the browser.
- **Live weather context:** retrieve seven-day Open-Meteo weather for the
  saved coordinates, with clear availability and cache status.
- **Research-model access:** inspect registered maize and SoyNAM targets,
  their held-out errors, and their supported research scope before submitting
  a research input form.
- **Transparent planning:** compare harvest-date operating returns from the
  quantity, saleable fraction, price, and cost assumptions entered by the
  user; check measured grain factors against buyer thresholds.
- **Responsible product design:** unavailable data stays unavailable. The app
  does not replace it with synthetic forecasts or present research-only models
  as validated farm predictions.

## Quick start

YIELDWISE uses a React/Vite frontend and a local FastAPI service. You need
Node compatible with Vite 8 and Python 3.11 or newer.

```powershell
npm ci
python -m venv .venv
.venv\Scripts\python -m pip install -r backend/requirements.txt
.venv\Scripts\python backend/serve.py
```

In a second terminal:

```powershell
npm run dev
```

Open the local URL printed by Vite. The frontend sends `/api` requests to
`http://127.0.0.1:8000`; the backend binds only to your machine’s loopback
address.

## Judging guide

| Area | What to look for |
| --- | --- |
| Overview | Saved field identity, weather status, and model-service readiness in one place. |
| Yield outlook | Target availability, held-out error, research scope, and input validation before a prediction is requested. |
| Harvest planning | Explicit, editable return calculations; changing a date does not invent a yield, grade, or price change. |
| Field conditions | Weather-based freezing, heat, and rainfall threshold checks that are labeled as checks, not crop-damage probabilities. |
| Data & methodology | Model coverage, scope, limitations, and data-handling details. |

## Technical approach

| Layer | Implementation |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, and custom CSS |
| API | FastAPI with Pydantic request validation |
| Model serving | Verified JSON artifacts loaded through a registry; no executable pickle files |
| Weather | Open-Meteo retrieved server-side with a bounded ten-minute cache |
| Field persistence | Browser localStorage; no account or cloud database required |
| Deployment | Docker can serve the built frontend and API on one origin |

The included model artifacts are already available in `backend/artifacts/`.
The importer validates an export’s SHA256, protocol, schema, source hashes,
and saved inference cases before installing an update:

```powershell
python -m backend.import_artifacts PATH_TO_EXPORT.zip --sha256 SHA256_FROM_COLAB
```

See [the technology stack](docs/TECH_STACK.md) for Docker instructions and
[the model review](docs/MODEL_INTEGRATION.md) for the training and evaluation
record.

## Research status and limits

The current registry includes five maize targets and two SoyNAM targets from
measured trial data. The verified research artifacts replay 35 selected cases
locally. These results are research-only: the selected maize yield model did
not beat simple held-out baselines, soybean yield improved only slightly over
its baselines across seven test environments, and the selected soybean R8
maturity model did not beat its strongest baseline.

YIELDWISE does not claim validated next-season yield forecasts for arbitrary
farms. It also does not calculate premium-grade probabilities, optimal harvest
windows, causal weather or irrigation effects, crop prices, or trading signals.
See [the full integration notes](docs/MODEL_INTEGRATION.md) for the evidence
and remaining validation requirements.

Field profiles stay in browser storage. Coordinates are sent to the YIELDWISE
backend to retrieve weather and, when selected by the user, to OpenStreetMap.
NASA imagery, NDVI, surveyed terrain, and laboratory soil data are not
connected.

## Checks

```powershell
npm test
npm run lint
npm run build
python -m unittest backend.test_inference backend.test_api backend.test_real_artifacts backend.test_weather
python -m unittest discover -s model_training -p 'test_*.py'
```

The real-artifact tests skip when artifacts are intentionally removed. Training
sources and the recovery-packet builder live in `model_training/`; prepared
datasets and checkpoints are excluded from the repository.
