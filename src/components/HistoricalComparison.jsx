import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

export default function HistoricalComparison({
  historicalYields,
  currentYield,
  crop = 'Crop',
  result,
}) {
  const cropName = crop !== 'Crop' ? crop : (result?.crop || 'Crop');
  const estimate = currentYield ?? result?.estimatedYield ?? 0;

  const chartData = useMemo(() => {
    const rawYields = historicalYields || result?.historicalYields || [];
    const historical = rawYields.map((entry) => ({
      year: String(entry.year),
      yield: entry.yield,
      type: 'historical',
    }));

    if (estimate) {
      historical.push({
        year: 'Current Estimate',
        yield: estimate,
        type: 'current',
      });
    }

    return historical;
  }, [historicalYields, result?.historicalYields, estimate]);

  return (
    <section className="historical-section">
      <div className="chart-panel-header">
        <h2 className="chart-panel-title">Historical &amp; Scenario Comparison ({cropName})</h2>
        <span className="chart-panel-badge">Illustrative data</span>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: 'Yield (t/ha)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(2)} t/ha`, `${cropName} Yield`]}
            />
            {estimate > 0 && (
              <ReferenceLine
                y={estimate}
                stroke="#1B4332"
                strokeDasharray="6 4"
                strokeWidth={2}
                label={{
                  value: `Prediction: ${estimate.toFixed(2)}`,
                  position: 'right',
                  fill: '#1B4332',
                  fontSize: 12,
                }}
              />
            )}
            <Bar
              dataKey="yield"
              radius={[4, 4, 0, 0]}
              fill="#95A88C"
              barSize={40}
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                const fill =
                  payload.type === 'current' ? '#1B4332' : '#95A88C';
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    rx={4}
                    ry={4}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="yield-card-note">
        Historical yields shown are regional demonstration values. Scenario
        comparison features will be available when validated models and
        historical datasets are connected.
      </p>
    </section>
  );
}
