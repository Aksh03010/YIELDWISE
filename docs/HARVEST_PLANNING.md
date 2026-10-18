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
