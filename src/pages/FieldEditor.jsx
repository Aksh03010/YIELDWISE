import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LocateFixed } from 'lucide-react'
import { FARMS, CROPS, COUNTRIES, validateFarm, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import FieldIllustration from '../components/FieldIllustration.jsx'
import TypingHeading from '../components/TypingHeading.jsx'
import { getDeviceLocation, searchLocations } from '../services/locationService.js'

// Field setup: the only place the field profile is edited. Saved to
// browser storage; the backend retrieves weather for the saved coordinates.
export default function FieldEditor({ farm, saveFarm }) {
  const [draft, setDraft] = useState({ ...farm })
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const [query, setQuery] = useState('')
  const [places, setPlaces] = useState([])
  const [searchStatus, setSearchStatus] = useState('')
  const [searching, setSearching] = useState(false)
  const locationRequest = useRef(null)
  const searchRequest = useRef(null)
  const navigate = useNavigate()
  useEffect(() => () => { locationRequest.current?.abort(); locationRequest.current = null; searchRequest.current?.abort(); searchRequest.current = null }, [])

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
      setLocationMessage(`Device coordinates added${position.accuracy === null ? '' : ` (accuracy about ${position.accuracy} m)`}. Confirm this is your field and check its country and region below.`)
    } catch (error) { if (!controller.signal.aborted) setLocationMessage(error.message) }
    finally { if (locationRequest.current === controller) { locationRequest.current = null; setLocating(false) } }
  }
  async function findPlaces() {
    searchRequest.current?.abort()
    const controller = new AbortController()
    searchRequest.current = controller
    const timer = setTimeout(() => controller.abort('timeout'), 10000)
    setSearching(true); setPlaces([]); setSearchStatus('Searching…')
    try {
      const found = await searchLocations(query, { country: draft.country, signal: controller.signal })
      if (controller.signal.aborted) return
      setPlaces(found)
      setSearchStatus(found.length ? 'Choose a result to fill country, region and coordinates.' : 'No matching places in this country. Try a nearby town or enter coordinates.')
    } catch (error) { if (searchRequest.current === controller) setSearchStatus(controller.signal.aborted ? 'Location search timed out. Retry or enter coordinates directly.' : error.message) }
    finally { clearTimeout(timer); if (searchRequest.current === controller) { searchRequest.current = null; setSearching(false) } }
  }
  function choosePlace(place) {
    stopLocating()
    setDraft(previous => ({ ...previous, country: place.country, region: place.region, locality: place.locality, latitude: place.latitude, longitude: place.longitude }))
    setErrors(previous => ({ ...previous, country: null, region: null, latitude: null, longitude: null }))
    setPlaces([]); setSearchStatus('')
    setLocationMessage(`${place.locality} selected. These are town coordinates; adjust them to your field before saving.`)
  }
  function submit(event) {
    event.preventDefault()
    stopLocating()
    const nextErrors = validateFarm(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { document.getElementById(Object.keys(nextErrors)[0])?.focus(); return }
    saveFarm({ ...draft, id: `field-${Date.now()}`, latitude: Number(draft.latitude), longitude: Number(draft.longitude), area: Number(draft.area), sample: false })
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
        <p className="sub">Coordinates, crop and area for {farm.name}. The profile is stored in this browser only.</p>
      </div>
    </div>

    <div className="setup">
      <form onSubmit={submit} noValidate className="stack">
        <section className="card">
          <div className="step-head">
            <span className="step-num">01</span>
            <div><h2>Find your field</h2><p>Use device location, search for a nearby town, or enter coordinates.</p></div>
          </div>
          <button className="locate-btn" type="button" onClick={locate} disabled={locating}>
            <LocateFixed size={21} />
            <span><strong>{locating ? 'Finding your location…' : 'Use my current location'}</strong><small>Requires browser permission. Town search works without it.</small></span>
          </button>
          {locating && <button className="link" type="button" onClick={() => { stopLocating(); setLocationMessage('Device lookup cancelled. Search for a town or enter coordinates.') }}>Cancel device lookup</button>}
          {locationMessage && <p className="msg" role="status">{locationMessage}</p>}
          <div className="location-search">
            <label className="field" htmlFor="location-query">Town or postcode in {draft.country}<input id="location-query" value={query} maxLength={120} placeholder="e.g. Toronto or Regina" onChange={event => { searchRequest.current?.abort(); searchRequest.current = null; setSearching(false); setQuery(event.target.value); setPlaces([]); setSearchStatus('') }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); findPlaces() } }} /></label>
            <button className="btn btn-ghost" type="button" disabled={searching || query.trim().length < 2} onClick={findPlaces}>{searching ? 'Searching…' : 'Search location'}</button>
          </div>
          {searchStatus && <p className="helper" role="status">{searchStatus}</p>}
          {places.length > 0 && <ul className="location-results" aria-label="Matching places">{places.map(place => <li key={place.id}><button type="button" onClick={() => choosePlace(place)}><strong>{place.locality}</strong><span>{[place.region, place.country].filter(Boolean).join(', ')} · {fmt(place.latitude, 4)}, {fmt(place.longitude, 4)}</span></button></li>)}</ul>}
          <p className="helper">Town search uses Open-Meteo / GeoNames. It finds a place centre, not a field boundary. Search text is sent when you press Search.</p>
          <div className="form-grid">
            {input('name', 'Field name', 'text', { autoComplete: 'off', maxLength: 80 })}
            <label className="field" htmlFor="country">Country
              <select id="country" value={draft.country} onChange={e => { update('country', e.target.value); searchRequest.current?.abort(); searchRequest.current = null; setSearching(false); setPlaces([]); setSearchStatus('') }}>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select>
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
            <button className="btn" type="submit">Save field & view outlook</button>
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
              onClick={() => { stopLocating(); searchRequest.current?.abort(); searchRequest.current = null; setSearching(false); setPlaces([]); setSearchStatus(''); setDraft({ ...sample }); setErrors({}); setLocationMessage('Sample field loaded. You can edit its details before saving.') }}>
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
