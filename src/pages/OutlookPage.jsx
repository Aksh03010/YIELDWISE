import { useEffect, useRef, useState } from 'react'
import { CROPS, formatNumber as fmt } from '../data/agriculture.js'
import TypingHeading from '../components/TypingHeading.jsx'

const TARGET_LABELS = {
  Yield_Mg_ha: 'Grain yield', Grain_Moisture: 'Harvest grain moisture', Twt_kg_m3: 'Test weight',
  Silk_DAP_days: 'Planting to silking', Harvest_DAP_days: 'Recorded harvest operation',
  yield_t_ha: 'Grain yield', R8_maturity_DAP: 'R8 physiological maturity',
}

export default function OutlookPage({ farm, catalog, modelStatus, refreshModels }) {
  const [targetId, setTargetId] = useState('')
  const [inputText, setInputText] = useState('{}')
  const [siteId, setSiteId] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const request = useRef(null)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; request.current?.abort() } }, [])
  const crop = CROPS.find(c => c.id === farm.crop)
  const entry = catalog?.crops.find(c => c.crop === farm.crop)
  const targets = entry?.targets || []
  const selected = targets.find(t => t.id === targetId) || targets[0]
  async function run(event) {
    event.preventDefault()
    setPrediction(null); setError('')
    let inputs
    try { inputs = JSON.parse(inputText); if (!inputs || Array.isArray(inputs) || typeof inputs !== 'object') throw new Error() }
    catch { setError('Enter one JSON object containing the required model inputs.'); return }
    const controller = new AbortController(); request.current = controller
    const timeout = setTimeout(() => controller.abort(), 15000)
    setRunning(true)
    try {
      const response = await fetch('/api/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ crop: farm.crop, target: selected.id, inputs, ...(siteId ? { site_id: siteId } : {}), research_only: true }) })
      const data = await response.json()
      if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'The model inputs could not be accepted.')
      if (mounted.current && !controller.signal.aborted) setPrediction(data)
    } catch (reason) { if (mounted.current) setError(controller.signal.aborted ? 'The request timed out. Try again.' : reason.message) }
    finally { clearTimeout(timeout); if (mounted.current && request.current === controller) setRunning(false) }
  }
  return <div className="flow">
    <div className="page-head"><div><TypingHeading text="Yield outlook" /><p className="sub">{farm.name} · {crop?.name}</p></div></div>
    <section className="card card-sun"><h2>Farm forecast unavailable</h2><p>A yield forecast for this field or next season has not been validated. Location alone does not supply the experimental identifiers, planting records and historical inputs required by these models.</p><p className="stat-note">{modelStatus === 'loading' ? 'Checking model availability…' : modelStatus === 'error' ? 'The model service is unavailable. Start the backend to review trained artifacts.' : entry?.status === 'research_only' ? 'Research models are registered for this crop.' : 'No verified model artifact is registered for this crop.'}</p></section>
    {modelStatus === 'error' && <button className="btn btn-ghost" onClick={refreshModels}>Retry model connection</button>}
    {targets.length > 0 && <section className="card"><h2>Trained research targets</h2><div className="table-wrap"><table><thead><tr><th>Target</th><th>Held-out mean absolute error</th><th>Test environments</th></tr></thead><tbody>{targets.map(t => <tr key={t.id}><td>{TARGET_LABELS[t.id] || t.id}</td><td>{fmt(t.test_metrics.MAE_in_target_units ?? t.test_metrics.environment_macro_mae, 3)} {t.unit}</td><td>{t.test_metrics.site_season_counts ?? t.test_metrics.environments}</td></tr>)}</tbody></table></div><p className="panel-note">{entry.scope} Recorded harvest operations are not economically optimal harvest dates. No grade probability or calibrated prediction interval is available.</p></section>}
    {targets.length > 0 && <details className="card"><summary>Run research inference with experimental inputs</summary><p>This sends only the inputs below to the model service. The result remains an experimental prediction within the dataset's scope.</p>
      <form className="stack" onSubmit={run}>
        <label className="field">Target<select disabled={running} value={selected.id} onChange={e => { setTargetId(e.target.value); setPrediction(null); setError('') }}>{targets.map(t => <option key={t.id} value={t.id}>{TARGET_LABELS[t.id] || t.id}</option>)}</select></label>
        <label className="field">Model inputs (JSON)<textarea disabled={running} rows="8" value={inputText} onChange={e => { setInputText(e.target.value); setPrediction(null) }} spellCheck="false" /></label>
        <p className="helper">Required fields: {selected.features.join(', ')}. Maize inputs must describe a complete planting-to-30-day window from the 2014–2021 trials. Soybean requires a recognized SoyNAM strain.</p>
        {farm.crop === 'corn' && <label className="field">Trial site identifier (required for the site-history baseline)<input disabled={running} value={siteId} onChange={e => { setSiteId(e.target.value); setPrediction(null) }} /></label>}
        <button className="btn" disabled={running} type="submit">{running ? 'Running…' : 'Run research prediction'}</button>
      </form>
      {error && <p className="msg" role="alert">{error}</p>}
      {prediction && <div className="summary-pad" role="status"><h3>Research result</h3><div className="stat-value">{fmt(prediction.value, 3)}<small>{prediction.unit}</small></div>{prediction.warnings.map(w => <p className="stat-note" key={w}>{w}</p>)}<p className="helper">Model version: {prediction.model_version.slice(0, 12)}</p></div>}
    </details>}
  </div>
}
