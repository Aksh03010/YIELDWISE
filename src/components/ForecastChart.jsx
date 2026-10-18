import { formatNumber as fmt } from '../data/agriculture.js'

// Hand-rolled SVG yield chart: no chart library, no resize observers, no animation.
const W = 640
const H = 250
const M = { top: 18, right: 18, bottom: 34, left: 46 }

export default function ForecastChart({ outlook }) {
  const { history, estimatedYield, low, high, targetLabel } = outlook
  const past = history.map(point => point.historical)
  const values = [...past, estimatedYield, low, high]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.3 || 1
  const yMin = Math.max(0, min - pad)
  const yMax = max + pad
  const count = past.length

  const x = index => M.left + (index / count) * (W - M.left - M.right)
  const y = value => M.top + (1 - (value - yMin) / (yMax - yMin)) * (H - M.top - M.bottom)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => yMin + t * (yMax - yMin))

  const lastX = x(count - 1)
  const lastY = y(past.at(-1))
  const futureX = x(count)
  const futureY = y(estimatedYield)
  const labels = [...history.map(point => point.year), targetLabel]

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Illustrative yield history ${history[0].year} to ${history.at(-1).year}, then an outlook of ${fmt(estimatedYield, 2)} tonnes per hectare for ${targetLabel}, scenario range ${fmt(low, 2)} to ${fmt(high, 2)}.`}>
      {ticks.map(value => (
        <g key={value}>
          <line className="grid" x1={M.left} x2={W - M.right} y1={y(value)} y2={y(value)} />
          <text className="tick" x={M.left - 8} y={y(value) + 4} textAnchor="end">{fmt(value, 1)}</text>
        </g>
      ))}
      <rect className="band" x={lastX} y={y(high)} width={futureX - lastX} height={Math.max(2, y(low) - y(high))} rx="3" />
      <path className="past" d={past.map((value, index) => `${index ? 'L' : 'M'}${x(index)} ${y(value)}`).join(' ')} />
      <path className="future" d={`M${lastX} ${lastY} L${futureX} ${futureY}`} />
      {past.map((value, index) => <circle className="dot-past" key={index} cx={x(index)} cy={y(value)} r="4" />)}
      <circle className="dot-future" cx={futureX} cy={futureY} r="5.5" />
      {labels.map((label, index) => (
        <text className="tick" key={label} x={x(index)} y={H - 10} textAnchor="middle">{label}</text>
      ))}
    </svg>
  )
}
