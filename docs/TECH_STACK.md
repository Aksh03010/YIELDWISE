# HARVEST technology stack

## Implemented in this branch

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19, Vite 8, JavaScript, CSS, React Router | Field setup, weather, research inputs and planning tools |
| Backend | Python, FastAPI, Pydantic, Uvicorn | Validated API requests, model registry and weather retrieval |
| Training | PyTorch on Colab CUDA | Reproduce the existing measured-data research experiments |
| Inference | NumPy and verified JSON artifacts | Serve selected models without a GPU or executable pickle |
| Weather | Open-Meteo through httpx | Coordinate-based seven-day weather; bounded ten-minute server cache |
| Field persistence | Browser localStorage | Device-local field profiles without account infrastructure |
| Packaging | Docker, one origin | Serve built React routes and `/api` from the same container |
| Checks | Node test runner, ESLint, Python unittest | Calculations, API contracts, cache behavior and inference replay |

No GPU is needed to run the app. The committed model exports remain research-only.
Location and area do not replace the exact trial features required by these
models. Weather retrieval does not automatically make a future-yield forecast.

## Next additions when the product needs them

- **PostgreSQL + PostGIS:** accounts' shared field records, field boundary
  polygons, spatial queries and versioned predictions. Add authentication and
  database migrations together before exposing private user records.
- **MapLibre GL JS:** a field-boundary editor when polygon-based inputs exist.
- **Object storage:** model versions and larger environmental datasets.
- **Scheduled Python jobs:** refresh environmental inputs and model versions
  outside interactive requests. Add a worker queue when jobs outgrow a scheduler.
- **TypeScript:** migrate frontend API contracts gradually rather than replacing
  the working application in one rewrite.

Managed PostgreSQL/PostGIS and authentication can be supplied by Supabase; no
Supabase account, database or credentials are required by the current branch.
NASA POWER historical weather, satellite imagery, laboratory quality data,
buyer discounts and market-price feeds still require separate integration and
validation. They are not represented as connected services in the UI.

## Deployment

Build from the repository root:

```powershell
docker build -t harvest .
docker run --rm -p 8000:8000 harvest
```

Open `http://localhost:8000`. React deep links and the API share the same origin.
The development workflow remains two processes: `python backend/serve.py` and
`npm run dev`. Production requires HTTPS and an appropriate service agreement
for the weather provider; the public Open-Meteo endpoint is intended for
non-commercial use. A commercial key can be supplied as `OPEN_METEO_API_KEY`.

Environment variables are described in `.env.example`. The Python launcher does
not automatically read `.env`; export variables in the shell or pass Docker
`--env-file .env`. Keep credentials outside Git. Weather coordinates travel in
the request body to HARVEST, then to the provider. The in-process cache is
bounded to 128 coordinate entries and resets when the service restarts.

Official references: [FastAPI containers](https://fastapi.tiangolo.com/deployment/docker/),
[Open-Meteo API](https://open-meteo.com/en/docs),
[PostGIS](https://postgis.net/documentation/getting_started/),
[MapLibre](https://maplibre.org/maplibre-gl-js/docs/),
[Supabase authentication](https://supabase.com/docs/guides/auth).
