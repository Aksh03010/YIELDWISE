# Harvest planning frontend

The `/planning` worksheet implements five connected features. It uses deterministic example response curves, not trained models. Forecast weather, grading evidence, scenario assumptions and unavailable values are identified separately. Prices and costs are user assumptions in USD, not market quotes.

## Harvest window

The user supplies a crop-ready date, baseline yield and moisture at readiness. The planner evaluates up to 15 candidate dates, starting five days before readiness or today, whichever is later, and ending no later than 365 days from today. Readiness response, weather exposure, grade chance and costs affect each date's net operating result.

Dates at or above 90% of the example readiness response are eligible. Fully weather-covered candidates are used whenever any eligible ones are available. The window is a contiguous range of up to four dates within 3% of the highest net result. This also works when all results are losses. With no covered eligible dates, it is explicitly provisional. Unknown weather is never presented as a forecast of safe conditions.

The weather completeness check requires every calendar day from today through harvest, with finite daily minimum, maximum and precipitation values. Gaps and duplicate dates do not qualify. A later-harvest comparison shows modeled changes and missing coverage.

## Grade target and marketability

Wheat, corn, soybeans, canola and barley each have three example grading measurements and editable minimum/maximum criteria. All default targets are custom research examples, not official grades, complete buyer standards or certified specifications. Only entered criteria are checked.

Sample records are labeled illustrative. Local CSV import accepts 1–200 records, at most 200 KB, with the selected crop and its required numeric columns. Download the crop's example CSV to see the format. Records for another crop, duplicate/missing headers, invalid measurements and malformed rows are rejected. Invalid imports keep the prior data.

The observed pass rate counts records satisfying every criterion. The example probability starts from `(passes + 1) / (record count + 2)` and subtracts demo readiness, weather, delay and moisture penalties, bounded to 0–1. This is not a calibrated probability, including when real records are imported. With no valid grading records the probability is unavailable and no premium-price revenue is assumed.

## Early warnings

Editable triggers cover daily minimum temperature, maximum temperature, rainfall, seven-day water supply and days after readiness. Each signal displays its date, lead time, threshold and whether it precedes the planned harvest. No-trigger messages refer only to the available data. Missing measurements remain unknown.

Low-water screening requires seven consecutive daily precipitation values and adds the scenario's irrigation amount. It is not a drought diagnosis or root-zone soil-water model. Alerts run in the page only; no email, phone, background monitoring or external messages are sent.

## What-if simulation

Rainfall adjustment, temperature adjustment, added irrigation and harvest-date changes update all results immediately. Weather values are copied, not mutated. Adjusted forecast values are labeled as scenario inputs, rather than unaltered live weather.

The baseline comparison uses readiness day, or today if readiness is past, and no weather/irrigation adjustments. Grade criteria and economic assumptions are shared. The demo growth response caps added irrigation's relief at the dry-scenario water penalty, so unnecessary irrigation does not create free additional yield. It still incurs cost.

## Profit and loss

```text
tonnes = retained yield (t/ha) × field hectares
expected sale price = P(target) × target price + (1 − P(target)) × standard price
gross revenue = tonnes × expected sale price
net operating result = gross revenue − growing expenses − harvesting
                       − added irrigation − drying − holding
```

With unavailable probability, standard price alone is used. Drying cost uses retained tonnes, estimated moisture points above the entered moisture target and cost per tonne per point. Added irrigation uses millimetres × hectares × unit cost. Holding applies only to days after readiness. Expenses are itemized, negative results are preserved, and break-even price is total cost divided by retained tonnes. Area conversion uses the shared hectare/acre conversion.

Growing expenses must exclude costs entered separately. Taxes, finance and other costs are included only if added to that expense input. No actual commodity price or company/stock model is connected. Comparisons with incomplete weather are provisional.

## State and backend integration

Field/crop-specific scenarios and local grading records use `harvest:planner:v1:<field id>:<crop>` in browser local storage. Invalid or outdated saved scenarios recover to defaults. Reset clears the active draft to defaults; imported records are local and are not sent to Open-Meteo. Exports include provenance, targets, cost components and assumptions.

`src/services/harvestPlanningService.js` is the pure planning-calculation boundary; `src/data/harvestProfiles.js` supplies editable research fixtures. A production model should replace the demo response curves and return crop/stage-specific readiness, calibrated grade probabilities and uncertainty, loss/risk estimates, observation timestamps and supported-date coverage. Keep real forecast outputs separate from user-adjusted scenarios and retain missing-data states. Existing UI build and render checks do not constitute agronomic, probability or visual-browser validation.
