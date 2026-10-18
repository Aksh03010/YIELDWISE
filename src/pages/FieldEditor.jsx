import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LocateFixed, MapPin, ArrowRight, Check, Sprout, Navigation, Info } from 'lucide-react'
import { FARMS, CROPS, COUNTRIES, validateFarm, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import FieldIllustration from '../components/FieldIllustration.jsx'

export default function FieldEditor({ farm, saveFarm }) {
  const [draft, setDraft] = useState({ ...farm })
  const [errors, setErrors] = useState({})
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const navigate = useNavigate()
  function update(key, value) { setDraft(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: null })) }
  function useLocation() {
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
    return <label className="form-field" htmlFor={key}>{label}<input id={key} type={type} value={draft[key] ?? ''} onChange={e => update(key, e.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} {...attributes} />{errors[key] && <small id={`${key}-error`} className="field-error">{errors[key]}</small>}</label>
  }
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="green-rule" /> YOUR STARTING POINT</div><h1>Good forecasts start here.</h1><p>Tell us about the field behind your next harvest.</p></div></div>
    <div className="setup-layout"><form onSubmit={submit} noValidate className="field-form">
      <section className="panel form-section"><div className="form-section-title"><span className="step-number">01</span><div><h2>Find your field</h2><p>Use your location or enter coordinates directly.</p></div></div><button className="location-button" type="button" onClick={useLocation} disabled={locating}><LocateFixed size={21} /><span><strong>{locating ? 'Finding your location…' : 'Use my current location'}</strong><small>Your browser will ask for permission</small></span><ArrowRight size={18} /></button>{locationMessage && <p className="location-feedback" role="status">{locationMessage}</p>}
        <div className="form-grid">{input('name', 'Field name', 'text', { autoComplete: 'off', maxLength: 80 })}<label className="form-field" htmlFor="country">Country<select id="country" value={draft.country} onChange={e => update('country', e.target.value)}>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></label>{input('region', 'State / province', 'text', { maxLength: 80 })}{input('locality', 'Town / local area (optional)', 'text', { maxLength: 80 })}{input('latitude', 'Latitude (° N)', 'number', { step: 'any', min: 14, max: 84 })}{input('longitude', 'Longitude (° E; use negative for west)', 'number', { step: 'any', min: -180, max: -50 })}</div>
        <p className="form-helper"><Navigation size={13} /> Device location may differ from your farm. Confirm coordinates before saving. Coverage: Canada, the US and Mexico; coordinate bounds are approximate.</p>
      </section>
      <section className="panel form-section"><div className="form-section-title"><span className="step-number">02</span><div><h2>What are you growing?</h2><p>Field details stay saved in this browser.</p></div></div><div className="form-grid"><label className="form-field" htmlFor="crop">Crop<select id="crop" value={draft.crop} onChange={e => { update('crop', e.target.value); update('variety', CROPS.find(c => c.id === e.target.value).variety) }}>{CROPS.map(crop => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></label>{input('variety', 'Crop type / variety', 'text', { maxLength: 80 })}{input('area', 'Field area', 'number', { min: 0.01, step: 'any' })}<label className="form-field" htmlFor="areaUnit">Area unit<select id="areaUnit" value={draft.areaUnit} onChange={e => update('areaUnit', e.target.value)}><option value="ha">Hectares (ha)</option><option value="ac">Acres (ac)</option></select></label>{input('plantingDate', 'Planting date (optional)', 'date')}<label className="form-field" htmlFor="irrigation">Irrigation<select id="irrigation" value={draft.irrigation} onChange={e => update('irrigation', e.target.value)}>{['Rainfed', 'Center pivot', 'Drip irrigation', 'Surface irrigation', 'Sprinkler'].map(value => <option key={value}>{value}</option>)}</select></label><label className="form-field" htmlFor="soil">Soil texture<select id="soil" value={draft.soil} onChange={e => update('soil', e.target.value)}>{['Loam', 'Clay loam', 'Sandy loam', 'Silt loam', 'Clay', 'Unknown'].map(value => <option key={value}>{value}</option>)}</select></label></div></section>
      <div className="form-actions"><Link to="/" className="button button-outline">Cancel</Link><button className="button" type="submit" disabled={locating}>Save field & view outlook <ArrowRight size={16} /></button></div>
    </form><aside className="setup-aside"><section className="panel"><FieldIllustration compact /><div className="setup-summary"><span className="eyebrow">YOUR FIELD AT A GLANCE</span><h2>{draft.name || 'Your new field'}</h2><p><MapPin size={14} /> {draft.region || 'Choose your region'}, {draft.country}</p><div className="setup-summary-grid"><div><small>AREA</small><strong>{fmt(fieldHectares(draft))} ha</strong></div><div><small>CROP</small><strong>{CROPS.find(c => c.id === draft.crop)?.name}</strong></div></div><p className="form-helper">Illustration only. No field boundary has been surveyed.</p></div></section><section className="sample-selector"><Sprout size={23} /><h3>Just exploring?</h3><p>Start with one of our sample farms.</p>{FARMS.map(sample => <button type="button" key={sample.id} onClick={() => { setDraft({ ...sample }); setErrors({}); setLocationMessage('Sample field loaded. You can edit its details before saving.') }}><span>{sample.name}<small>{sample.region}, {sample.country}</small></span><ArrowUpIcon /></button>)}</section><p className="privacy-note"><Check size={15} /> Field details are stored on this device. Coordinates are sent to Open-Meteo to fetch weather after saving. <Link to="/about">Data details</Link></p><div className="notice"><Info size={16} /><span>The research preview does not run your trained model yet. Saving a field generates an illustrative outlook.</span></div></aside></div>
  </>
}
function ArrowUpIcon() { return <ArrowRight size={15} /> }
