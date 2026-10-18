# Harvest planning calculations

The planner uses only user-entered assumptions. It does not predict how a date,
rainfall or irrigation changes yield, quality, losses or prices.

```text
saleable quantity = harvest quantity (metric tonnes) × saleable fraction / 100
gross revenue (USD) = saleable quantity × sale price (USD per tonne)
net operating return (USD) = gross revenue − total operating expenses (USD)
comparison = Scenario B net return − Scenario A net return
```

Empty or invalid inputs produce no result. Quantities, prices and expenses
must be finite and nonnegative; saleable fraction must be between 0 and 100.
Zero output and negative net returns remain visible. Dates label scenarios;
they do not silently alter assumptions. Currency counts start when scrolled
into view, without a bounce, and honor reduced-motion preferences.

Measured grain checks compare one observed moisture, protein, oil or test-weight
value against a user-supplied buyer threshold, using an inclusive minimum or
maximum. Missing observations produce no pass/fail result. Passing one factor
does not imply an official grade, future marketability or a probability.

## Calendar timing in Yield outlook

The maize timing output is translated to a calendar date using the displayed
planting date plus the rounded predicted days after planting. A planning range
extends by the target's held-out mean absolute error, rounded upward to whole
days. This is an error-based illustration, not a calibrated confidence interval
or an optimized weather/quality/profit window. The lower duration is bounded at
zero. Calendar arithmetic uses UTC days to avoid daylight-saving shifts.

The maize example's May 22, 2021 planting date was checked against COH1_2021 in
the audited prepared dataset. Changing the calendar anchor does not replace
its environmental inputs. Soybean uses the example planting day 145 in 2013;
date/day edits stay synchronized and require a new model run when inputs change.
Its dates describe R8 maturity, not harvest readiness. No dry-down gap is invented.

The field-location workflow uses the actual planting date to retrieve its early
environmental window. Editing this date triggers a new request automatically
when automatic updates are on. Estimates are rechecked every minute while the
page is visible; a recheck of an unchanged historical window may return the same
date. Current weather is displayed separately and does not shift the date using
an untrained adjustment rule.
