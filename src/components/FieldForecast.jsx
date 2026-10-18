import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CROPS, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import { TARGET_LABELS, TARGET_UNITS } from '../data/modelTargets.js'
import { buildFieldRequest, fetchFieldForecast } from '../services/fieldForecastService.js'
import { getDeviceLocation } from '../services/locationService.js'
import { useVisibleRefresh } from '../hooks/useVisibleRefresh.js'
import HarvestTiming from './HarvestTiming.jsx'
import CurrentFieldWeather from './CurrentFieldWeather.jsx'

function weatherPoint(field) {
  const latitude = Number(field.latitude), longitude = Number(field.longitude)
  if (field.latitude === '' || field.longitude === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 14 || latitude > 75 || longitude < -170 || longitude > -50) return null
  return { latitude, longitude }
}

export default function FieldForecast({ farm, entry }) {
  const [draft, setDraft] = useState(() => ({ latitude: String(farm.latitude), longitude: String(farm.longitude), areaHa: String(fieldHectares(farm)), plantingDate: farm.plantingDate || '' }))
  const [request, setRequest] = useState(null)
  const [state, setState] = useState(null)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [continuous, setContinuous] = useState(true)
  const [point, setPoint] = useState(() => weatherPoint(draft))
  const tick = useVisibleRefresh(continuous ? 60000 : 0)
  const device = useRef(null)
  const scheduledRun = useRef(null)
  const draftKey = JSON.stringify(draft)
  useEffect(() => {
    const timer = setTimeout(() => setPoint(weatherPoint({ latitude: draft.latitude, longitude: draft.longitude })), 800)
    return () => clearTimeout(timer)
  }, [draft.latitude, draft.longitude])
  useEffect(() => {
    if (!continuous) return
    // Wait for typing to settle before sending a complete field to the backend.
    scheduledRun.current = setTimeout(() => {
      try {
        const payload = buildFieldRequest(entry.crop, draft)
        setRequest(previous => ({ id: (previous?.id || 0) + 1, payload, draft: draftKey }))
      } catch { /* Incomplete inputs wait for the farmer to finish the form. */ }
    }, 800)
    return () => clearTimeout(scheduledRun.current)
  }, [continuous, draft, draftKey, entry.crop, tick])
  useEffect(() => () => { device.current?.abort(); device.current = null }, [])
  useEffect(() => {
    if (!request) return
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    fetchFieldForecast(request.payload, controller.signal)
      .then(data => { if (active && !controller.signal.aborted) setState({ id: request.id, draft: request.draft, data, status: 'ready', checkedAt: new Date().toISOString(), successfulAt: new Date().toISOString() }) })
      .catch(reason => {
        if (active) setState(previous => ({
          id: request.id, draft: request.draft, status: 'error', checkedAt: new Date().toISOString(),
          data: previous?.draft === request.draft ? previous.data : null,
          successfulAt: previous?.draft === request.draft ? previous.successfulAt : null,
          error: controller.signal.aborted ? 'Environmental lookup timed out. Retry the field estimate.' : reason.message,
        }))
      })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [request])
  const dirty = !!request && draftKey !== request.draft
  const current = !request || dirty ? { status: 'idle' } : state?.id === request.id ? state : { status: 'loading' }
  const data = state?.draft === draftKey ? state.data : null
  const loading = current.status === 'loading'
  const currentPoint = point && point.latitude === Number(draft.latitude) && point.longitude === Number(draft.longitude) && draft.latitude !== '' && draft.longitude !== '' ? point : null
  const yieldResult = data?.predictions.find(value => value.target === 'Yield_Mg_ha')
  const timing = data?.predictions.find(value => value.target === 'Harvest_DAP_days')
  function update(field, value) {
    if (field === 'latitude' || field === 'longitude') { device.current?.abort(); device.current = null; setLocating(false) }
    setDraft(previous => ({ ...previous, [field]: value })); setError('')
  }
  async function locate() {
    device.current?.abort()
    const controller = new AbortController()
    device.current = controller
    setLocating(true); setLocationMessage('Allow device location when prompted. Lookup stops after 12 seconds.')
    try {
      const position = await getDeviceLocation({ signal: controller.signal })
      if (!controller.signal.aborted) {
        setDraft(previous => ({ ...previous, latitude: String(position.latitude), longitude: String(position.longitude) }))
        setLocationMessage('Device coordinates filled. Check that they match the field. Automatic updates use the entered field coordinates.')
      }
    } catch (reason) { if (!controller.signal.aborted) setLocationMessage(reason.message) }
    finally { if (device.current === controller) { device.current = null; setLocating(false) } }
  }
  function run(event) {
    event.preventDefault()
    try {
      const payload = buildFieldRequest(entry.crop, draft)
      clearTimeout(scheduledRun.current)
      setError(''); setRequest(previous => ({ id: (previous?.id || 0) + 1, payload, draft: draftKey }))
    } catch (reason) { setError(reason.message) }
  }
  return <>
    <section className="card">
      <h2>Estimate maize at your location</h2>
      <p className="stat-note">Coordinates and planting date go to the backend. It retrieves 31 days of NASA POWER weather, builds the model inputs and runs the maize models. Area converts yield into tonnes.</p>
      <div className="continuous-controls"><div><strong>{continuous ? 'Automatic updates on' : 'Automatic updates paused'}</strong><p className="source-note">{continuous ? 'Estimates update after input changes and are checked every minute while this page is visible.' : 'Change the field details, then refresh manually or resume automatic updates.'}</p></div><button className="btn btn-small btn-ghost" type="button" onClick={() => setContinuous(value => !value)}>{continuous ? 'Pause automatic updates' : 'Resume automatic updates'}</button></div>
      {farm.crop !== 'corn' && <p className="source-note">Your saved crop is {CROPS.find(crop => crop.id === farm.crop)?.name}. This run estimates maize at this location.</p>}
      <div className="prediction-actions"><button className="btn btn-ghost" type="button" onClick={locate} disabled={locating}>{locating ? 'Finding device location…' : 'Use device location'}</button><Link className="link" to="/field">Edit saved coordinates</Link>{locating && <button className="link" type="button" onClick={() => { device.current?.abort(); device.current = null; setLocating(false); setLocationMessage('Device lookup cancelled. Enter coordinates manually.') }}>Cancel lookup</button>}</div>
      {locationMessage && <p className="source-note" role="status">{locationMessage}</p>}
      <form onSubmit={run} className="stack prediction-form" noValidate><div className="form-grid">
        <label className="field">Latitude<input type="number" step="any" value={draft.latitude} onChange={event => update('latitude', event.target.value)} /></label>
        <label className="field">Longitude<input type="number" step="any" value={draft.longitude} onChange={event => update('longitude', event.target.value)} /></label>
        <label className="field">Planting date<input type="date" value={draft.plantingDate} onChange={event => update('plantingDate', event.target.value)} /></label>
        <label className="field">Field area (hectares)<input type="number" min="0.01" step="any" value={draft.areaHa} onChange={event => update('areaHa', event.target.value)} /></label>
      </div><p className="helper">Use a completed planting-to-day-30 window. Future weather is not substituted for observed inputs.</p>
      <button className="btn" type="submit" disabled={loading}>{loading ? 'Fetching environment and running model…' : 'Refresh estimate now'}</button>
      {error && <p className="msg" role="alert">{error}</p>}</form>
      {!draft.plantingDate && <p className="source-note" role="status">Enter the planting date to start the crop estimate. Current weather only needs your coordinates.</p>}
      {dirty && <p className="source-note" role="status">{continuous ? 'Field inputs changed. The estimate updates automatically when the inputs are complete.' : 'Field inputs changed. Refresh the estimate to update the statistics.'}</p>}
      {!dirty && current.status === 'error' && <p className="msg" role="alert">{current.error}</p>}
      {loading && <p className="source-note" role="status">Retrieving environmental data for {request.payload.latitude}, {request.payload.longitude}. No trial examples are used.</p>}
      {state?.draft === draftKey && <p className="source-note" role="status">Estimate last checked {new Date(state.checkedAt).toLocaleTimeString()}.{state.status === 'error' && data ? ` Last successful estimate: ${new Date(state.successfulAt).toLocaleTimeString()}.` : ''} Rechecking unchanged historical inputs can return the same values.</p>}
    </section>
    {currentPoint && <CurrentFieldWeather key={`${currentPoint.latitude}:${currentPoint.longitude}`} latitude={currentPoint.latitude} longitude={currentPoint.longitude} continuous={continuous} />}
    {data && <>
      <section className="card field-data-source"><h2>Location used for this run</h2><p><strong>{fmt(data.latitude, 4)}°, {fmt(data.longitude, 4)}°</strong> · {fmt(data.area_ha, 2)} ha · planting {data.planting_date}</p><p className="source-note">NASA POWER observations: {data.source.start} to {data.source.end} ({data.source.days} days). {data.source.cached ? 'Retrieved from the 24-hour backend cache.' : 'Retrieved from NASA for this request.'}</p><p className="source-note">Provider data retrieved {new Date(data.source.fetched_at).toLocaleString()}. This is the observed planting window used by the model. Current conditions are shown separately above.</p></section>
      <section className="card card-dark prediction-primary"><h2>Experimental maize yield estimate</h2><div className="stat-value">{fmt(yieldResult?.value, 2)}<small>t/ha</small></div><p className="stat-note">Estimated production for {fmt(data.area_ha, 2)} ha: {fmt(data.production_tonnes, 1)} metric tonnes</p>{!yieldResult && <p className="stat-note">{data.unavailable_targets.Yield_Mg_ha}</p>}</section>
      <HarvestTiming crop="corn" result={timing} target={entry.targets.find(target => target.id === 'Harvest_DAP_days')} plantingDate={draft.plantingDate} onDateChange={value => update('plantingDate', value)} locationDriven />
      <div className="two-col">{data.predictions.filter(value => !['Yield_Mg_ha', 'Harvest_DAP_days'].includes(value.target)).map(value => <section className="card" key={value.target}><h3>{TARGET_LABELS[value.target]}</h3><div className="stat-value">{fmt(value.value, value.target.includes('DAP') ? 0 : 1)}<small>{TARGET_UNITS[value.target] || value.unit}</small></div></section>)}</div>
      <section className="card"><h2>Environment used by the model</h2><dl className="dl"><div><dt>Average air temperature</dt><dd>{fmt(data.environment.mean_temperature_c)} °C</dd></div><div><dt>31-day precipitation</dt><dd>{fmt(data.environment.rainfall_mm)} mm</dd></div><div><dt>Lowest daily temperature</dt><dd>{fmt(data.environment.minimum_temperature_c)} °C</dd></div><div><dt>Highest daily temperature</dt><dd>{fmt(data.environment.maximum_temperature_c)} °C</dd></div></dl><p className="source-note">{data.source.resolution_note}</p></section>
      <section className="card"><h2>How to read this estimate</h2>{data.warnings.map(warning => <p className="source-note" key={warning}>{warning}</p>)}{Object.entries(data.unavailable_targets).map(([target, reason]) => <p className="source-note" key={target}><strong>{TARGET_LABELS[target] || target}:</strong> {reason}</p>)}<details><summary>Input and model details</summary><p className="source-note">Model version: {data.model_version.slice(0, 12)}. NASA response: {data.source.response_sha256.slice(0, 12)}.</p>{data.predictions.map(value => <p className="source-note" key={value.target}>{TARGET_LABELS[value.target]}: {value.outside_training_bounds.length} inputs outside fitted ranges. {value.warnings.join(' ')}</p>)}{data.source.unit_conversions.map(value => <p className="source-note" key={value.parameter}>{value.parameter}: converted {value.from} to {value.to} for the trained model.</p>)}</details></section>
    </>}
  </>
}
