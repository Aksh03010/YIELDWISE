import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LocateFixed } from 'lucide-react'
import { CROPS, validateFarm, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import FieldIllustration from '../components/FieldIllustration.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { getDeviceLocation } from '../services/locationService.js'

// Field setup: the only place the field profile is edited. Saved to
// browser storage; the backend retrieves weather for the saved coordinates.
export default function FieldEditor({ farm, saveFarm }) {
  const [draft, setDraft] = useState({ ...farm })
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const locationRequest = useRef(null)
  const navigate = useNavigate()
  useEffect(() => () => { locationRequest.current?.abort(); locationRequest.current = null }, [])

  function stopLocating() {
    locationRequest.current?.abort()
    locationRequest.current = null
    setLocating(false)
  }

  function update(key, value) {
    if (key === 'latitude' || key === 'longitude') { stopLocating(); setLocationMessage('Using the coordinates you entered. Confirm them before saving.') }
    setDraft(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: null }))
  }
  async function locate() {
    stopLocating()
    const controller = new AbortController()
    locationRequest.current = controller
    setLocating(true)
    setLocationMessage('Checking device location. If prompted, allow location access. This will stop after 12 seconds.')
    try {
      const position = await getDeviceLocation({ signal: controller.signal })
      if (controller.signal.aborted) return
      setDraft(previous => ({ ...previous, latitude: position.latitude, longitude: position.longitude }))
      setErrors(previous => ({ ...previous, latitude: null, longitude: null }))
      setLocationMessage(`Device coordinates added${position.accuracy === null ? '' : ` (accuracy about ${position.accuracy} m)`}. Confirm this is your field before saving.`)
    } catch (error) { if (!controller.signal.aborted) setLocationMessage(error.message) }
    finally { if (locationRequest.current === controller) { locationRequest.current = null; setLocating(false) } }
  }
  function submit(event) {
    event.preventDefault()
    stopLocating()
    const nextField = { ...draft, name: `${fmt(Number(draft.latitude), 4)}°, ${fmt(Number(draft.longitude), 4)}°`, country: '', region: '', locality: '' }
    const nextErrors = validateFarm(nextField)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.getElementById(Object.keys(nextErrors)[0])?.focus(); return }
    saveFarm({ ...nextField, id: `field-${Date.now()}`, latitude: Number(draft.latitude), longitude: Number(draft.longitude), area: Number(draft.area), sample: false })
    navigate('/outlook')
  }
  function input(key, label, type = 'text', attributes = {}) {
    return <label className="field" htmlFor={key}>{label}
      <input id={key} type={type} value={draft[key] ?? ''} onChange={e => update(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} {...attributes} />
      {errors[key] && <small id={`${key}-error`} className="field-error">{errors[key]}</small>}
    </label>
  }

  return <div className="flow">
    <div className="page-head">
      <div>
        <TypingHeading text="Field setup" />
        <p className="sub">Coordinates, crop and area for your field. The profile is stored in this browser only.</p>
      </div>
    </div>

    <div className="setup">
      <form onSubmit={submit} noValidate className="stack">
        <section className="card">
          <div className="step-head">
            <span className="step-num">01</span>
            <div><h2>Find your field</h2><p>Use device location or enter latitude and longitude.</p></div>
          </div>
          <button className="locate-btn" type="button" onClick={locate} disabled={locating}>
            <LocateFixed size={21} />
            <span><strong>{locating ? 'Finding your location…' : 'Use my current location'}</strong><small>Requires browser permission. You can also enter coordinates manually.</small></span>
          </button>
          {locating && <button className="link" type="button" onClick={() => { stopLocating(); setLocationMessage('Device lookup cancelled. Enter coordinates manually.') }}>Cancel device lookup</button>}
          {locationMessage && <p className="msg" role="status">{locationMessage}</p>}
          <div className="form-grid">
            {input('latitude', 'Latitude (° N)', 'number', { step: 'any', min: 14, max: 84 })}
            {input('longitude', 'Longitude (° E; use negative for west)', 'number', { step: 'any', min: -180, max: -50 })}
          </div>
          <p className="helper"> Device location may differ from your farm. Confirm coordinates before saving. Coverage: Canada, the US and Mexico; coordinate bounds are approximate.</p>
        </section>

        <section className="card">
          <div className="step-head">
            <span className="step-num">02</span>
            <div><h2>What are you growing?</h2><p>Crop and management details for this field.</p></div>
          </div>
          <div className="form-grid">
            <label className="field" htmlFor="crop">Crop
              <select id="crop" value={draft.crop} onChange={e => { update('crop', e.target.value); update('variety', CROPS.find(c => c.id === e.target.value).variety) }}>
                {CROPS.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
            </label>
            {input('variety', 'Crop type / variety', 'text', { maxLength: 80 })}
            {input('area', 'Field area', 'number', { min: 0.01, step: 'any' })}
            <label className="field" htmlFor="areaUnit">Area unit
              <select id="areaUnit" value={draft.areaUnit} onChange={e => update('areaUnit', e.target.value)}>
                <option value="ha">Hectares (ha)</option>
                <option value="ac">Acres (ac)</option>
              </select>
            </label>
            {input('plantingDate', 'Planting date (optional)', 'date')}
            <label className="field" htmlFor="irrigation">Irrigation
              <select id="irrigation" value={draft.irrigation} onChange={e => update('irrigation', e.target.value)}>
                {['Rainfed', 'Center pivot', 'Drip irrigation', 'Surface irrigation', 'Sprinkler'].map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className="field" htmlFor="soil">Soil texture
              <select id="soil" value={draft.soil} onChange={e => update('soil', e.target.value)}>
                {['Loam', 'Clay loam', 'Sandy loam', 'Silt loam', 'Clay', 'Unknown'].map(value => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <Link to="/" className="btn btn-ghost">Cancel</Link>
            <button className="btn" type="submit">Save field & view outlook</button>
          </div>
        </section>
      </form>

      <aside className="stack">
        <section className="card card-flush">
          <FieldIllustration compact />
          <div className="setup-summary summary-pad">
            <h2>Your field coordinates</h2>
            <p>{fmt(Number(draft.latitude), 4)}°, {fmt(Number(draft.longitude), 4)}°</p>
            <div className="setup-stats">
              <div><small>AREA</small><strong>{fmt(fieldHectares(draft))} ha</strong></div>
              <div><small>CROP</small><strong>{CROPS.find(c => c.id === draft.crop)?.name}</strong></div>
            </div>
            <p className="helper">Illustration only. No field boundary has been surveyed.</p>
          </div>
        </section>

        <p className="privacy-note">
          <span>Field details are stored on this device. The backend retrieves Open-Meteo weather after saving. In Yield outlook, complete field inputs automatically send coordinates and planting dates to NASA POWER for maize estimates. <Link to="/about">Data details</Link></span>
        </p>
      </aside>
    </div>
  </div>
}
