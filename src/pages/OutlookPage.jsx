import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { CROPS, HORIZONS, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import { createOutlook } from '../services/outlookService.js'
import ForecastChart from '../components/ForecastChart.jsx'

function exportReport(farm, outlook) {
  const rows = [
    ['HARVEST field outlook', 'ILLUSTRATIVE. NOT A TRAINED MODEL FORECAST'],
    ['Field', farm.name], ['Country', farm.country], ['Region', farm.region], ['Latitude', farm.latitude], ['Longitude', farm.longitude],
    ['Crop', outlook.crop.name], ['Area (ha)', fieldHectares(farm)], ['Horizon (months)', outlook.months], ['Outlook date', outlook.targetLabel],
    ['Yield (t/ha)', outlook.estimatedYield], ['Scenario low (t/ha)', outlook.low], ['Scenario high (t/ha)', outlook.high],
    ['Total production (metric tonnes)', outlook.totalProduction], ['Crop quality', 'Not assessed'], ['Generated at', new Date().toISOString()],
  ]
  const safe = value => `"${String(value).replace(/^[=+@\t\r-]/, "'$&").replaceAll('"', '""')}"` // neutralize spreadsheet formulas
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(safe).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = 'harvest-field-outlook.csv'; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// The yield workbench: horizon and scenario controls, the numbers they
// drive, the trend chart, and a per-crop comparison for this one field.
export default function OutlookPage({ farm, horizon, setHorizon, scenario, setScenario }) {
  const outlook = useMemo(() => createOutlook(farm, horizon, scenario), [farm, horizon, scenario])
  const comparisons = useMemo(
    () => CROPS.map(crop => ({ crop, result: createOutlook({ ...farm, crop: crop.id }, horizon, scenario) })),
    [farm, horizon, scenario],
  )
  const hectares = fieldHectares(farm)
  const rangeMax = outlook.high * 1.05 || 1 // zero-based scale for the range bar
  const rangeLeft = outlook.low / rangeMax * 100
  const rangeWidth = (outlook.high - outlook.low) / rangeMax * 100

  return <div className="flow">
    <div className="page-head">
      <div>
        <h1>Yield outlook</h1>
        <p className="sub">Illustrative scenarios for {farm.name}. Yield is harvest mass per land area (t/ha); it does not measure crop quality. Ranges are scenario spreads, not confidence intervals.</p>
      </div>
      <button className="btn btn-ghost" onClick={() => exportReport(farm, outlook)}><Download size={16} /> Export CSV</button>
    </div>

    <div className="controls">
      <label className="control-label">Scenario
        <select className="select" value={scenario} onChange={e => setScenario(e.target.value)}>
          <option value="typical">Typical conditions</option>
          <option value="dry">Dry season</option>
          <option value="wet">Wetter season</option>
        </select>
      </label>
      <div className="segmented" role="group" aria-label="Planning horizon">
        {HORIZONS.map(months => (
          <button key={months} aria-pressed={months === horizon} onClick={() => setHorizon(months)}>
            {months} {months === 1 ? 'month' : 'months'}
          </button>
        ))}
      </div>
      <span className="badge badge-sample">Illustrative fixture</span>
    </div>

    <div className="bento">
      <article className="card card-sun span-3">
        <div className="stat-label">Expected yield</div>
        <div className="stat-value">{fmt(outlook.estimatedYield, 2)}<small>t/ha</small></div>
        <div className="stat-note">
          <span className={outlook.change >= 0 ? 'delta-up' : 'delta-down'}> {fmt(outlook.change)}%</span>
          vs. sample last season
        </div>
      </article>
      <article className="card span-3">
        <div className="stat-label">Field production</div>
        <div className="stat-value">{fmt(outlook.totalProduction, 0)}<small>tonnes</small></div>
        <div className="stat-note">Across {fmt(hectares, 0)} hectares</div>
      </article>
      <article className="card span-3">
        <div className="stat-label">Scenario range</div>
        <div className="stat-value">{fmt(outlook.low)}–{fmt(outlook.high)}<small>t/ha</small></div>
        <div className="range-bar"><span style={{ left: `${rangeLeft}%`, width: `${rangeWidth}%` }} /></div>
        <div className="stat-note">{scenario} season · widens with horizon</div>
      </article>
      <article className="card span-3">
        <div className="stat-label">Crop quality</div>
        <div className="stat-value text">Custom grade targets</div>
        <Link className="link" to="/planning#grade-target">Explore illustrative grade chances</Link>
      </article>
    </div>

    <section className="card">
      <div className="section-head">
        <div>
          <h2>Sample history and outlook</h2>
          <p className="stat-note">{outlook.crop.name} · tonnes per hectare · target {outlook.targetLabel}</p>
        </div>
        <span className="badge">Sample history · dashed = outlook</span>
      </div>
      <ForecastChart outlook={outlook} />
      <p className="panel-note">The {horizon}-month horizon is a planning outlook date for harvest yield. not crops accumulated over {horizon} months. A longer horizon widens the illustrative spread; it does not run a seasonal weather model, and real weather does not feed this calculation.</p>
    </section>

    <section className="card">
      <div className="section-head">
        <div>
          <h2>Compare crops on this field</h2>
          <p className="stat-note">Same field and scenario, different base yields</p>
        </div>
        <span className="badge badge-sample">Scenario only</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Crop</th><th>Yield / ha</th><th>Field production</th><th>Relative potential</th></tr></thead>
          <tbody>
            {comparisons.map(({ crop, result }) => (
              <tr key={crop.id}>
                <td><span className="crop-dot" style={{ background: crop.color }} /><strong>{crop.name}</strong>{crop.id === farm.crop && <span className="chip">Selected</span>}</td>
                <td>{fmt(result.estimatedYield, 2)} t/ha</td>
                <td>{fmt(result.totalProduction, 0)} t</td>
                <td><span className="bar"><i style={{ width: `${Math.min(100, result.estimatedYield / 12 * 100)}%`, background: crop.color }} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="panel-note">A comparison of fixtures, not an agronomic recommendation. Rotation, input costs, local suitability and cultivar performance are not modeled.</p>
    </section>
  </div>
}
