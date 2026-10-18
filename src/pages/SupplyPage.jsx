import { useState } from 'react'
import { Globe2, RotateCcw, Info, ArrowUpRight, Package, Scale, ChartNoAxesCombined } from 'lucide-react'
import { CROPS, formatNumber as fmt } from '../data/agriculture.js'
import { calculateBalance, DEFAULT_BALANCE } from '../services/outlookService.js'

const assumptionFields = [
  ['openingStocks', 'Opening stocks'],
  ['production', 'Baseline production'],
  ['imports', 'Imports from outside region'],
  ['domesticUse', 'Domestic use'],
  ['exports', 'Exports outside region'],
]

// Supply balance lab: editable assumptions in, a conserved crop balance
// and a linear price sensitivity out. Deliberately not a market feed.
export default function SupplyPage({ farm }) {
  const [crop, setCrop] = useState(farm.crop)
  const [scope, setScope] = useState('North America')
  const [inputs, setInputs] = useState({ ...DEFAULT_BALANCE, basePrice: CROPS.find(c => c.id === farm.crop).price })
  let balance, error
  try { balance = calculateBalance(inputs) } catch (cause) { error = cause.message }
  const update = (key, value) => setInputs(previous => ({ ...previous, [key]: value }))
  const reset = () => setInputs({ ...DEFAULT_BALANCE, basePrice: CROPS.find(c => c.id === crop).price })
  const cropName = CROPS.find(c => c.id === crop).name

  return <div className="flow">
    <div className="page-head">
      <div>
        <span className="eyebrow">Scenario lab</span>
        <h1>Supply balance lab</h1>
        <p className="sub">Edit production, trade and demand for one marketing year — volumes in million metric tonnes (Mt). See ending stocks and a simple price response.</p>
      </div>
      <span className="badge badge-sample"><Globe2 size={13} /> Hypothetical inputs</span>
    </div>

    <div className="notice" role="note">
      <Info size={17} />
      <span><strong>Not market data.</strong> The price response is a linear sensitivity around your baseline, not a calibrated forecast, and it does not produce trading signals.</span>
    </div>

    <div className="toolbar">
      <label className="field" htmlFor="market-crop">Crop
        <select id="market-crop" value={crop} onChange={e => { setCrop(e.target.value); update('basePrice', CROPS.find(c => c.id === e.target.value).price) }}>
          {CROPS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="field" htmlFor="market-scope">Region
        <select id="market-scope" value={scope} onChange={e => setScope(e.target.value)}>
          {['North America', 'Canada', 'United States', 'Mexico'].map(name => <option key={name}>{name}</option>)}
        </select>
      </label>
    </div>

    <div className="supply">
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Your assumptions</h2>
            <p className="stat-note">{scope} · {cropName} · hypothetical values</p>
          </div>
          <button className="icon-btn" aria-label="Reset assumptions" title="Reset assumptions" onClick={reset}><RotateCcw size={16} /></button>
        </div>
        {assumptionFields.map(([key, label]) => (
          <label className="assumption-row" htmlFor={key} key={key}>
            <span>{label}</span>
            <div>
              <input id={key} type="number" step="any" min={key === 'domesticUse' ? 0.01 : 0} value={inputs[key]} onChange={e => update(key, e.target.value)} />
              <span className="unit">Mt</span>
            </div>
          </label>
        ))}
        <div className="slider">
          <label htmlFor="productionChange">Production change <strong>{inputs.productionChange > 0 ? '+' : ''}{inputs.productionChange}%</strong></label>
          <input id="productionChange" type="range" min="-35" max="35" step="0.5" value={inputs.productionChange} onChange={e => update('productionChange', Number(e.target.value))} />
          <div><span>−35%</span><span>+35%</span></div>
        </div>
        <div className="slider">
          <label htmlFor="populationGrowth">Population / use growth <strong>{inputs.populationGrowth}%</strong></label>
          <input id="populationGrowth" type="range" min="0" max="5" step="0.1" value={inputs.populationGrowth} onChange={e => update('populationGrowth', Number(e.target.value))} />
          <div><span>0%</span><span>5%</span></div>
        </div>
        <p className="panel-note">Growth scales domestic use proportionally in this simplified scenario. Food, feed, seed and industrial demand can grow differently. Exclude internal regional trade to avoid double counting.</p>
      </section>

      <div className="stack" aria-live="polite">
        {error ? <div className="notice error-notice" role="alert">{error}</div> : <>
          <div className="bento">
            <article className="card span-6">
              <div className="stat-label">Total available supply <Package size={17} /></div>
              <div className="stat-value">{fmt(balance.supply)}<small>Mt</small></div>
              <div className="stat-note">Opening stocks + production + imports</div>
            </article>
            <article className="card span-6">
              <div className="stat-label">Ending stocks <Scale size={17} /></div>
              <div className={`stat-value ${balance.endingStocks < 0 ? 'delta-down' : ''}`}>{fmt(balance.endingStocks)}<small>Mt</small></div>
              <div className="stat-note">{balance.endingStocks < 0 ? 'Unmet demand in this scenario' : `${fmt(balance.ratio * 100)}% stocks-to-use ratio`}</div>
            </article>
          </div>

          <section className="card">
            <div className="section-head">
              <div>
                <h2>The crop balance</h2>
                <p className="stat-note">Every tonne accounted for, within your assumptions</p>
              </div>
            </div>
            <div className="balance-eq">
              <div><small>AVAILABLE</small><strong>{fmt(balance.supply)}</strong><span>million tonnes</span></div>
              <span>−</span>
              <div><small>TOTAL USE</small><strong>{fmt(balance.use)}</strong><span>domestic + exports</span></div>
              <span>=</span>
              <div className="result"><small>ENDING STOCKS</small><strong>{fmt(balance.endingStocks)}</strong><span>million tonnes</span></div>
            </div>
            <div className="bars">
              {[['Production', balance.production, '#3f6b40'], ['Domestic use', balance.demand, '#8aa86b'], ['Exports', Number(inputs.exports), '#d9b552']].map(([label, value, color]) => (
                <div key={label}>
                  <span>{label}</span>
                  <div className="track"><i style={{ width: `${Math.min(100, Math.max(0, value / Math.max(balance.supply, 1) * 100))}%`, background: color }} /></div>
                  <strong>{fmt(value)} Mt</strong>
                </div>
              ))}
            </div>
            <p className="panel-note">Illustrative price = reference price × [1 − sensitivity × (scenario stocks-to-use − baseline stocks-to-use)], floored at zero, with all other drivers held fixed.</p>
          </section>

          <section className="price-panel">
            <div>
              <span className="eyebrow eyebrow-dark"><ChartNoAxesCombined size={14} /> Price sensitivity</span>
              <h2>{balance.endingStocks < 0 ? 'Supply shortfall' : `$${fmt(balance.price, 0)}`}</h2>
              <small>{balance.endingStocks >= 0 ? 'USD / metric tonne' : 'Price estimate withheld'}</small>
              <p>{balance.endingStocks < 0
                ? 'Negative stocks represent unmet demand — the simple price relationship is not meaningful here.'
                : `${balance.priceChange >= 0 ? '+' : ''}${fmt(balance.priceChange)}% relative to your reference price of $${fmt(inputs.basePrice, 0)}/t`}</p>
            </div>
            <ArrowUpRight size={34} strokeWidth={1.2} />
          </section>

          <section className="card">
            <div className="section-head"><div><h2>Price assumptions</h2></div></div>
            <div className="form-grid">
              <label className="field" htmlFor="basePrice">Reference price (USD / t)
                <input id="basePrice" type="number" min="0.01" step="any" value={inputs.basePrice} onChange={e => update('basePrice', e.target.value)} />
              </label>
              <label className="field" htmlFor="elasticity">Sensitivity factor
                <input id="elasticity" type="number" min="0" step="0.1" value={inputs.elasticity} onChange={e => update('elasticity', e.target.value)} />
              </label>
            </div>
          </section>
        </>}
      </div>
    </div>

    <div className="notice gap-top">
      <Info size={17} />
      <span>A field forecast is one piece of the system. This lab does not scale one farm to all of North America — regional harvested area, crop-specific demand, external trade, inventories and validated price data must be modeled together.</span>
    </div>
  </div>
}
