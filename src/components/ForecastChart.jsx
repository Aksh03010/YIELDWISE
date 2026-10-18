import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export default function ForecastChart({ outlook }) {
  const history = outlook.history.map((point, index, list) => index === list.length - 1 ? { ...point, forecast: point.historical, range: [point.historical, point.historical] } : point)
  const data = [...history, { year: outlook.targetLabel, forecast: outlook.estimatedYield, range: [outlook.low, outlook.high] }]
  return <div className="forecast-chart" role="img" aria-label={`Illustrative yield history and outlook: ${outlook.estimatedYield.toFixed(2)} tonnes per hectare; scenario range ${outlook.low.toFixed(2)} to ${outlook.high.toFixed(2)}.`}>
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 16, right: 20, bottom: 2, left: -19 }}>
        <defs><linearGradient id="yield-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#537a42" stopOpacity={0.2} /><stop offset="100%" stopColor="#537a42" stopOpacity={0.01} /></linearGradient></defs>
        <CartesianGrid vertical={false} stroke="#edf0e9" strokeDasharray="3 4" />
        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#7e877b', fontSize: 11 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} domain={[0, 'auto']} tick={{ fill: '#7e877b', fontSize: 11 }} tickCount={5} />
        <Tooltip contentStyle={{ border: '1px solid #e4e8dd', borderRadius: 10, fontSize: 12 }} formatter={(value, name) => [Array.isArray(value) ? `${value[0].toFixed(2)}–${value[1].toFixed(2)} t/ha` : `${Number(value).toFixed(2)} t/ha`, { historical: 'Sample history', forecast: 'Illustrative outlook', range: 'Scenario range' }[name] || name]} />
        <Area dataKey="historical" type="monotone" stroke="none" fill="url(#yield-fill)" isAnimationActive={false} />
        <Area dataKey="range" type="linear" fill="#dce7ce" fillOpacity={0.65} stroke="none" isAnimationActive={false} />
        <Line type="monotone" dataKey="historical" stroke="#406636" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
        <Line type="linear" dataKey="forecast" stroke="#74934c" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4, fill: '#74934c', stroke: '#fff', strokeWidth: 2 }} isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
}
