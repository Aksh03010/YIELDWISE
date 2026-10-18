import { useEffect, useState } from 'react'
import { formatNumber as fmt } from '../data/agriculture.js'
import examples from '../data/modelExamples.json'
import { TARGET_LABELS, TARGET_UNITS } from '../data/modelTargets.js'
import { predictTargets } from '../services/predictionService.js'

export default function PredictionRunner({ entry }) {
  const seed = examples[entry.crop]
  const seedText = JSON.stringify(seed?.inputs || {}, null, 2)
  const [inputText, setInputText] = useState(seedText)
  const [siteId, setSiteId] = useState(seed?.siteId || '')
  const [inputError, setInputError] = useState('')
  const [request, setRequest] = useState(() => ({ id: 0, inputs: seed?.inputs || {}, inputText: seedText, siteId: seed?.siteId || '', example: true }))
  const [state, setState] = useState(null)
  const crop = entry.crop, targetIds = entry.targets.map(target => target.id).join(',')
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    predictTargets({ crop, targets: targetIds.split(','), inputs: request.inputs, siteId: request.siteId, signal: controller.signal })
      .then(results => { if (active && !controller.signal.aborted) setState({ id: request.id, results, status: 'ready' }) })
      .catch(() => { if (active) setState({ id: request.id, results: [], status: 'error' }) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [crop, targetIds, request])
  const dirty = inputText !== request.inputText || siteId !== request.siteId
  const current = state?.id === request.id ? state : { status: 'loading', results: [] }
  const results = dirty ? [] : current.results
  const yieldId = crop === 'corn' ? 'Yield_Mg_ha' : 'yield_t_ha'
  const yieldResult = results.find(result => result.target === yieldId)
  function run(event) {
    event.preventDefault()
    let inputs
    try { inputs = JSON.parse(inputText); if (!inputs || Array.isArray(inputs) || typeof inputs !== 'object') throw new Error() }
    catch { setInputError('Enter a JSON object containing the required model inputs.'); return }
    setInputError('')
    setRequest(previous => ({ id: previous.id + 1, inputs, inputText, siteId, example: inputText === seedText && siteId === (seed?.siteId || '') }))
  }
  function reset() {
    setInputText(seedText); setSiteId(seed?.siteId || ''); setInputError('')
    setRequest(previous => ({ id: previous.id + 1, inputs: seed?.inputs || {}, inputText: seedText, siteId: seed?.siteId || '', example: true }))
  }
  return <>
    <section className="card">
      <div className="tile-head"><h2>Run the trained model</h2><span className="source-status">{entry.targets.length} connected targets</span></div>
      <p className="stat-note">The example runs automatically through the backend. Replace its inputs to run your own trial data.</p>
      <p className="source-note">{seed?.description} Example inputs are separate from your saved field.</p>
      <form onSubmit={run} className="stack prediction-form">
        {crop === 'soybeans' && <div className="form-grid">{[['strain', 'Experimental strain'], ['family', 'Experimental family'], ['site', 'Trial site'], ['planting_doy', 'Planting day of year (131–152)']].map(([field, label]) => {
          let values
          try { values = JSON.parse(inputText) || {} } catch { values = {} }
          return <label className="field" key={field}>{label}<input type={field === 'planting_doy' ? 'number' : 'text'} value={values[field] ?? ''} onChange={event => { setInputText(JSON.stringify({ ...values, [field]: field === 'planting_doy' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value }, null, 2)); setInputError('') }} /></label>
        })}</div>}
        <details className="prediction-inputs"><summary>{crop === 'corn' ? 'View or edit the 31-day environmental inputs' : 'View or edit model inputs as JSON'}</summary>
          <label className="field">Model inputs (JSON)<textarea rows="10" value={inputText} onChange={event => { setInputText(event.target.value); setInputError('') }} spellCheck="false" /></label>
          <p className="helper">Required fields: {entry.targets[0].features.join(', ')}.</p>
          {crop === 'corn' && <label className="field">Trial site identifier<input value={siteId} onChange={event => setSiteId(event.target.value)} /></label>}
        </details>
        <div className="prediction-actions"><button className="btn" type="submit" disabled={!dirty && current.status === 'loading'}>{!dirty && current.status === 'loading' ? 'Running model…' : 'Run prediction'}</button><button className="btn btn-ghost" type="button" onClick={reset}>Reset example inputs</button></div>
        {inputError && <p className="msg" role="alert">{inputError}</p>}
      </form>
    </section>
    <section className="card card-dark prediction-primary" aria-busy={!dirty && current.status === 'loading'}>
      <h2>Predicted grain yield</h2>
      <div className="stat-value">{fmt(yieldResult?.value, 2)}<small>t/ha</small></div>
      <p className="stat-note" role="status">{dirty ? 'Inputs changed. Run prediction to update results.' : current.status === 'loading' ? 'Calculating with the trained model…' : current.status === 'error' ? 'The prediction request timed out. Press Run prediction to retry.' : yieldResult?.error || `${request.example ? 'Example inputs' : 'Your model inputs'} · computed by the ${crop === 'corn' ? 'maize' : 'soybean'} model`}</p>
    </section>
    <div className="two-col">{entry.targets.filter(target => target.id !== yieldId).map(target => {
      const result = results.find(value => value.target === target.id)
      return <section className="card" key={target.id}><h3>{TARGET_LABELS[target.id] || target.id}</h3><div className="stat-value">{fmt(result?.value, target.id.includes('DAP') ? 0 : 1)}<small>{TARGET_UNITS[target.id] || target.unit}</small></div>{result?.error && <p className="msg" role="alert">{result.error}</p>}{target.id === 'Harvest_DAP_days' && <p className="stat-note">Estimated timing of a recorded harvest operation, not an optimized harvest window.</p>}</section>
    })}</div>
    <p className="source-note">These are research model outputs. An example run is not a forecast for your saved field or a future season.</p>
    <details className="card"><summary>Model performance and run details</summary><div className="table-wrap"><table><thead><tr><th>Target</th><th>Held-out mean absolute error</th><th>Test environments</th></tr></thead><tbody>{entry.targets.map(target => <tr key={target.id}><td>{TARGET_LABELS[target.id] || target.id}</td><td>{fmt(target.test_metrics.MAE_in_target_units ?? target.test_metrics.environment_macro_mae, 3)} {target.unit}</td><td>{target.test_metrics.site_season_counts ?? target.test_metrics.environments}</td></tr>)}</tbody></table></div><p className="source-note">{entry.scope}</p>{results.filter(result => result.warnings).map(result => <div className="prediction-warning" key={result.target}><strong>{TARGET_LABELS[result.target]}</strong>{result.warnings.map(warning => <p className="source-note" key={warning}>{warning}</p>)}</div>)}<p className="helper">Model version: {entry.version?.slice(0, 12)}</p></details>
  </>
}
