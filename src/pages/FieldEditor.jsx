import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LocateFixed } from 'lucide-react'
import { FARMS, CROPS, COUNTRIES, validateFarm, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import FieldIllustration from '../components/FieldIllustration.jsx'
import TypingHeading from '../components/TypingHeading.jsx'

// Field setup: the only place the field profile is edited. Saved to
// browser storage; the backend retrieves weather for the saved coordinates.
export default function FieldEditor({ farm, saveFarm }) {
  const [draft, setDraft] = useState({ ...farm })
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const navigate = useNavigate()

  function update(key, value) {
    setDraft(previous => ({ ...previous, [key]: value }))
    setErrors(previous => ({ ...previous, [key]: null }))
  }
  function locate() {
    if (!navigator.geolocation) { setLocationMessage('Location is unavailable in this browser. Enter your field coordinates below.'); return }
    setLocating(true)
    setLocationMessage('Waiting for your browser’s location permission…')
    navigator.geolocation.getCurrentPosition(position => {
      setDraft(previous => ({ ...previous, latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)) }))
      setLocating(false)
      setLocationMessage(`Device location added (accuracy about ${Math.round(position.coords.accuracy)} m). Confirm this is your field, then check its country and region below.`)
    }, error => {
      setLocating(false)
      setLocationMessage(error.code === 1 ? 'Location permission was declined. You can enter your field coordinates manually.' : 'Could not determine your location. Enter coordinates manually or try again outdoors.')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }
  function submit(event) {
    event.preventDefault()
    const nextErrors = validateFarm(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.getElementById(Object.keys(nextErrors)[0])?.focus(); return }
    saveFarm({ ...draft, id: `field-${Date.now()}`, latitude: Number(draft.latitude), longitude: Number(draft.longitude), area: Number(draft.area), sample: false })
    navigate('/')
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
        <p className="sub">Coordinates, crop and area for {farm.name}. The profile is stored in this browser only.</p>
      </div>
    </div>

    <div className="setup">
      <form onSubmit={submit} noValidate className="stack">
        <section className="card">
          <div className="step-head">
            <span className="step-num">01</span>
            <div><h2>Find your field</h2><p>Use your device location or enter coordinates directly.</p></div>
          </div>
          <button className="locate-btn" type="button" onClick={locate} disabled={locating}>
            <LocateFixed size={21} />
            <span><strong>{locating ? 'Finding your location…' : 'Use my current location'}</strong><small>Your browser will ask for permission</small></span>
          </button>
          {locationMessage && <p className="msg" role="status">{locationMessage}</p>}
          <div className="form-grid">
            {input('name', 'Field name', 'text', { autoComplete: 'off', maxLength: 80 })}
            <label className="field" htmlFor="country">Country
              <select id="country" value={draft.country} onChange={e => update('country', e.target.value)}>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select>
            </label>
            {input('region', 'State / province', 'text', { maxLength: 80 })}
            {input('locality', 'Town / local area (optional)', 'text', { maxLength: 80 })}
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
            <button className="btn" type="submit" disabled={locating}>Save field & view outlook</button>
          </div>
        </section>
      </form>

      <aside className="stack">
        <section className="card card-flush">
          <FieldIllustration compact />
          <div className="setup-summary summary-pad">
            <h2>{draft.name || 'Your new field'}</h2>
            <p> {draft.region || 'Choose your region'}, {draft.country}</p>
            <div className="setup-stats">
              <div><small>AREA</small><strong>{fmt(fieldHectares(draft))} ha</strong></div>
              <div><small>CROP</small><strong>{CROPS.find(c => c.id === draft.crop)?.name}</strong></div>
            </div>
            <p className="helper">Illustration only. No field boundary has been surveyed.</p>
          </div>
        </section>

        <section className="card samples">
          <h3>Just exploring?</h3>
          <p>Start from a sample farm, then edit anything before saving.</p>
          {FARMS.map(sample => (
            <button type="button" className="sample-btn" key={sample.id}
              onClick={() => { setDraft({ ...sample }); setErrors({}); setLocationMessage('Sample field loaded. You can edit its details before saving.') }}>
              <span>{sample.name}<small>{sample.region}, {sample.country}</small></span>
            </button>
          ))}
        </section>

        <p className="privacy-note">
          <span>Field details are stored on this device. Coordinates are sent to the HARVEST backend, which retrieves Open-Meteo weather after saving. <Link to="/about">Data details</Link></span>
        </p>
      </aside>
    </div>
  </div>
}
