import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const COLORS = {
  forest: '#1B4332',
  sage: '#95A88C',
  sageMuted: '#D8E2D4',
};

export default function ClimateCharts({ monthlyClimate, data }) {
  const climateList = monthlyClimate || data;
  if (!climateList || climateList.length === 0) return null;

  return (
    <div className="chart-grid">
      {/* Temperature Chart */}
      <div className="chart-panel">
        <div className="chart-panel-header">
          <span>Temperature Across Growing Season</span>
          <span className="env-card-badge demo">Illustrative data</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={climateList} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.sage} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS.sage} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.sageMuted} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={COLORS.sage} />
            <YAxis unit="°C" tick={{ fontSize: 12 }} stroke={COLORS.sage} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: `1px solid ${COLORS.sageMuted}`,
                borderRadius: '8px',
                fontSize: '13px',
              }}
              formatter={(value) => [`${value} °C`, 'Avg Temp']}
            />
            <Area
              type="monotone"
              dataKey="avgTemp"
              stroke={COLORS.forest}
              strokeWidth={2}
              fill="url(#tempGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rainfall Chart */}
      <div className="chart-panel">
        <div className="chart-panel-header">
          <span>Monthly Rainfall</span>
          <span className="env-card-badge demo">Illustrative data</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={climateList} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.sageMuted} />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={COLORS.sage} />
            <YAxis unit="mm" tick={{ fontSize: 12 }} stroke={COLORS.sage} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: `1px solid ${COLORS.sageMuted}`,
                borderRadius: '8px',
                fontSize: '13px',
              }}
              formatter={(value) => [`${value} mm`, 'Rainfall']}
            />
            <Bar dataKey="rainfall" fill={COLORS.forest} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
