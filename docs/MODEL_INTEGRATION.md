# Research-model integration notes

These are proposed integration requirements, not an API currently implemented by HARVEST.

The harvest-planning frontend now implements date-window selection, target-grade scenarios with local CSV evidence, threshold warnings, what-if controls and itemized date-based operating-return comparisons. Its readiness, quality and crop-loss responses remain deterministic examples. See [the harvest-planning calculation notes](HARVEST_PLANNING.md) before replacing these with inference outputs.

## Yield and quality inference

`src/services/outlookService.js:createOutlook` currently generates deterministic illustrative fixtures. Replace this fixture boundary with an asynchronous server inference adapter and an explicit loading/error state when the trained endpoint is available. Do not relabel fixtures as trained-model results or silently substitute fixtures when live inference fails.

The request should carry verified field coordinates or a surveyed polygon, supported country, crop, cultivar where known, hectares, irrigation, soil information, planting/harvest season, requested outlook horizon and a feature cutoff timestamp. The planting date and soil texture collected by the UI are profile metadata; the demo calculation does not currently use them. Inference should use independently collected, validated features rather than relying on the browser to supply training features.

A response should identify:

- Model version, crop, field, target harvest season and inference timestamp.
- Expected yield in metric tonnes/hectare and field area in hectares.
- Low/high prediction interval, its intended coverage and calibration status.
- Forecast horizon, feature cutoff, source timestamps and missing-data flags.
- Quality targets with crop-specific units and availability, separately from yield.
- Supported geography, warnings for out-of-domain inputs and validation metrics.

Check field identity, crop, horizon and timestamps before replacing the active outlook. Cancel stale requests on field changes. Validate finite non-negative yield, consistent intervals, correct units and coverage. Store secrets server-side, define CORS deliberately, and include provider freshness and provenance. Do not extrapolate a seven-day weather forecast into a year of weather.

## Environmental features

Current weather uses the documented Open-Meteo forecast endpoint. NASA POWER, actual vegetation indices, soil surveys, slope and terrain are not yet integrated. Align provider grids, spatial resolution, aggregation periods and observation times with the training process. Surface soil moisture is not root-zone moisture. Crop quality may require laboratory labels that cannot be inferred reliably from weather alone.

## Regional aggregation and markets

Regional production needs crop-specific harvested area and representative yields, with overlap control and uncertainty aggregation. One user's field is not representative of all North America.

Maintain a marketing-year balance by region and crop: opening stocks + production + external imports − domestic use − external exports = ending stocks. Separate food, feed, seed, industrial use and losses; account for inventory revisions and avoid double counting intra-region trade. Population adjustment alone does not constitute a demand model.

The current price coefficient is a scenario control. It must be replaced by a validated economic model with actual price history, inventories, trade, currency, policy and other relevant drivers. Long/short strategy evaluation, transaction costs, futures contract handling, company exposure and stock-price impact are separate research tasks. No trade or investment execution exists in the app.

## Validation before release

Use crop-, region- and horizon-specific evaluation with temporal and spatial holdouts, target leakage checks, documented yield error and interval coverage, quality-target validation and out-of-distribution handling. Record provenance and license terms for each feed. Add inference-contract and stale-response integration tests when the backend is connected. Extend browser interaction and mobile checks; this session's browser preview inspection was blocked by the app's URL security policy, so only build, service/calculation tests and route-rendering checks were completed here.
