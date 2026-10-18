import { useState } from 'react'
import { Link } from 'react-router-dom'
import TypingHeading from '../components/TypingHeading.jsx'
import AnimatedMoney from '../components/AnimatedMoney.jsx'
import { formatNumber as fmt } from '../data/agriculture.js'
import { calculateEconomics, compareMeasurement } from '../services/planningCalculator.js'

const empty = { date: '', quantity: '', saleable: '', price: '', cost: '' }
const inputs = [['quantity', 'Harvest quantity (metric tonnes)'], ['saleable', 'Saleable fraction (%)'], ['price', 'Sale price (USD per tonne)'], ['cost', 'Total operating expenses (USD)']]
const factors = { moisture: 'Moisture (%)', protein: 'Protein (%)', oil: 'Oil (%)', testWeight: 'Test weight (kg/m³)' }

function Scenario({ label, value, onChange }) {
  const { result, errors } = calculateEconomics(value)
  return <section className="card"><h2>{label}</h2><div className="form-grid">
    <label className="field">Harvest date<input type="date" value={value.date} onChange={e => onChange({ ...value, date: e.target.value })} /></label>
    {inputs.map(([key, text]) => <label className="field" key={key}>{text}<input type="number" min="0" max={key === 'saleable' ? 100 : undefined} step="any" value={value[key]} onChange={e => onChange({ ...value, [key]: e.target.value })} aria-invalid={!!errors[key]} />{errors[key] && <small className="field-error">{errors[key]}</small>}</label>)}
    </div><dl className="dl"><div><dt>Saleable quantity</dt><dd>{fmt(result?.saleableQuantity, 2)} t</dd></div><div><dt>Gross revenue</dt><dd><AnimatedMoney value={result?.gross} /></dd></div><div><dt>Net operating return</dt><dd><AnimatedMoney value={result?.net} /></dd></div></dl>
    {!result && <p className="helper">Enter quantity, saleable fraction, price and expenses to calculate a return.</p>}
  </section>
}

export default function HarvestPlanner({ farm }) {
  const [a, setA] = useState({ ...empty }), [b, setB] = useState({ ...empty })
  const [factor, setFactor] = useState('moisture'), [measured, setMeasured] = useState(''), [threshold, setThreshold] = useState(''), [direction, setDirection] = useState('max')
  const ar = calculateEconomics(a).result, br = calculateEconomics(b).result
  const percentInvalid = factor !== 'testWeight' && (Number(measured) > 100 || Number(threshold) > 100)
  const passes = percentInvalid ? null : compareMeasurement(measured, threshold, direction)
  return <div className="flow"><div className="page-head"><div><TypingHeading text="Harvest planning" /><p className="sub">Input-based planning for {farm.name}. Prices, quantities and costs are your assumptions.</p></div></div>
    <section className="card"><h2>Compare operating returns</h2><p>Net operating return = harvest quantity × saleable fraction × sale price − operating expenses. Changing a date does not automatically change yield, grade, weather losses or price. Enter the assumptions for each date yourself.</p><p className="stat-note">Amounts are in USD. This comparison does not predict an optimal harvest window or market prices.</p><Link className="link" to="/outlook">View estimated harvest dates in Yield outlook</Link></section>
    <div className="two-col"><Scenario label="Scenario A" value={a} onChange={setA} /><Scenario label="Scenario B" value={b} onChange={setB} /></div>
    {ar && br && <section className="card card-sun" role="status"><h2>Scenario B minus Scenario A</h2><div className="stat-value"><AnimatedMoney value={br.net - ar.net} /></div><p className="stat-note">Difference in net operating return under the assumptions you entered.</p></section>}
    <section className="card" id="grade-target"><h2>Measured grain check</h2><p>Compare one measured factor against a threshold from your buyer or laboratory. Passing one factor does not establish an official grade or predict future quality.</p><div className="form-grid">
      <label className="field">Measured factor<select value={factor} onChange={e => { setFactor(e.target.value); setMeasured(''); setThreshold('') }}>{Object.entries(factors).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field">Measured value<input type="number" min="0" max={factor === 'testWeight' ? undefined : 100} step="any" value={measured} onChange={e => setMeasured(e.target.value)} /></label>
      <label className="field">Buyer threshold<input type="number" min="0" max={factor === 'testWeight' ? undefined : 100} step="any" value={threshold} onChange={e => setThreshold(e.target.value)} /></label>
      <label className="field">Requirement<select value={direction} onChange={e => setDirection(e.target.value)}><option value="max">At or below the threshold</option><option value="min">At or above the threshold</option></select></label>
    </div><p className="source-note" role="status">{percentInvalid ? 'Percentage values must be from 0 to 100.' : passes === null ? 'Enter a measurement and a buyer threshold.' : passes ? 'The measured value meets this single threshold.' : 'The measured value does not meet this single threshold.'}</p></section>
  </div>
}
