# HARVEST — Field & Crop Intelligence

A research prototype for farmers and agricultural companies across Canada, the United States and Mexico. HARVEST brings field profiles, weather, harvest outlooks and regional supply scenarios into one workspace.

**Status:** The interface and live weather adapter work. Yield, crop comparisons, historical yields, ranges and price sensitivities are illustrative fixtures. No trained yield or quality model, NASA feed, actual commodity quote or trading execution is connected.

## Run locally

Use a current Node.js LTS release compatible with Vite 8 (Node 22.12+ or Node 24).

```sh
npm ci
npm run dev
```

Open the local address printed by Vite (normally `http://localhost:5173`).

```sh
npm test       # calculations, validation, weather adapter and route rendering
npm run build # production assets in dist/
npm run preview
```

Production hosting must serve `index.html` for client routes such as `/results`, `/predict` and `/market`.

## The workspace

- **Overview:** field illustration, harvest metrics, sample yield history, crop comparison and current weather status.
- **Yield outlook:** 1-, 6- and 12-month planning horizons, with dry, typical and wetter-season scenarios. Values are in metric tonnes/hectare; total production uses the field area. Acres convert using `1 acre = 0.40468564224 hectares`.
- **Field setup:** browser geolocation on user request, manual coordinates, crop and variety, area, irrigation, planting date and soil texture. Three sample farms provide starting points. Field profiles persist in browser local storage.
- **Field conditions:** current modeled air temperature, humidity and wind, modeled surface soil moisture (0–1 cm), grid elevation, and a seven-day weather forecast from Open-Meteo. Provider failures show clearly marked sample data. Missing live values show a dash.
- **Supply & markets:** editable opening inventories, production, imports, domestic use, exports, growth assumptions, a reference price and a sensitivity factor. Volumes are hypothetical million metric tonnes, for one marketing year. Region selection labels the scenario; it does not fetch official statistics.
- **Data & methodology:** available and planned sources, model limitations, units and location handling.
- **Export:** a CSV field outlook labeled illustrative, with coordinates, area, horizon, yield range, production and generation time.

## What the numbers mean

Yield is **mass per land area at harvest**. It does not measure protein, grade or other crop quality. Quality remains unassessed until a separate validated model and suitable measurements are connected.

A horizon is an outlook date, not accumulated crop production over that period. Demo yield is repeatable for a field and scenario. The horizon widens the illustrative spread; it does not run a seasonal weather model. Sample historical points are not official historical observations, and ranges have no statistical confidence interpretation. Real weather does not currently affect demo yield.

The supply lab uses:

```text
scenario production = baseline production × (1 + production change / 100)
scenario domestic use = baseline domestic use × (1 + population/use growth / 100)
available supply = opening stocks + scenario production + external imports
total use = scenario domestic use + external exports
ending stocks = available supply − total use
stocks-to-use = ending stocks / total use
```

Keep imports and exports external to the chosen region to avoid counting internal trade twice. A negative ending inventory means unmet demand. Population growth is only a simplified demand proxy; real food, feed, industrial, seed and loss components require separate estimation.

The example price sensitivity changes the reference price linearly with the change in stocks-to-use, using a user-specified coefficient. It is not an econometric forecast or a long/short signal. The price display is withheld for negative stocks. A single farm is never automatically scaled to continental production.

## Sources and privacy

Device location uses the [browser Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API), with permission; it does not use IP geolocation. HTTPS or localhost is required. Users must verify that the device coordinates match their field.

The profile stays in local storage on the device. Coordinates are sent to [Open-Meteo](https://open-meteo.com/en/docs) after field selection/save to retrieve weather. Refresh is manual; changing field coordinates triggers another request. Requests time out after 15 seconds and superseded requests are canceled. Weather represents a model grid near the location, rather than an on-field sensor. Review provider usage plans and attribution before a commercial launch. The location link shares coordinates with OpenStreetMap only when opened. Google Fonts supplies typography with system-font fallbacks.

[NASA POWER](https://power.larc.nasa.gov/docs/services/api/), vegetation imagery, detailed terrain/soil surveys and official production/trade records remain planned. A NASA API is not needed to find device coordinates. Parcel artwork is illustrative SVG, not satellite imagery or a surveyed boundary.

## Connecting the research model

See [the integration notes](docs/MODEL_INTEGRATION.md). The current application is frontend-only: there is no deployed inference backend, user account service, scheduled data pipeline or model training system.

Keep trained-model credentials and provider secrets on a server. Validate inference outputs and attach model version, units, observation dates and interval definitions before presenting them as forecasts. Evaluate spatial and time-based holdouts, crop-specific performance and horizon-specific calibration before operational use.

## Source layout

```text
src/
  App.jsx                      Routes, field state and saved profile
  app.css                      Responsive workspace styles
  components/
    Workspace.jsx              Navigation and active field selector
    FieldIllustration.jsx      Labeled parcel artwork
    ForecastChart.jsx          Lazy-loaded yield chart
  data/agriculture.js          Crops, samples, units and validation
  hooks/useWeather.js          Fetch lifecycle, timeout and cancellation
  pages/
    Dashboard.jsx              Overview and yield outlook
    FieldEditor.jsx            Field setup and device geolocation
    ConditionsPage.jsx         Weather and measurement availability
    SupplyPage.jsx             Regional balance and sensitivity lab
    DataPage.jsx               Sources and methodology
  services/
    outlookService.js          Demo yields and supply equations
    weatherService.js          Open-Meteo adapter
tests/
  agriculture.test.js          Calculation and service checks
  render.test.js               Six-route rendering smoke test
```

Built with React, Vite, React Router, Recharts and Lucide icons. The unused prototype pages and randomized prediction service were replaced by the workspace above.
