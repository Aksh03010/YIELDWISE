import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { formatNumber as fmt } from '../data/agriculture.js'
import { SAMPLE_WEATHER } from '../services/weatherService.js'
import FieldIllustration from '../components/FieldIllustration.jsx'

export default function ConditionsPage({ farm, weather, status, refreshWeather }) {
  const values = weather || SAMPLE_WEATHER
  const metrics = [
    ['Air temperature', values.temperature, '°C', 'Current weather model'],
    ['Precipitation', values.rainfall, 'mm', 'Forecast total · next 7 days'],
    ['Wind speed', values.wind, 'km/h', 'At 10 metres above ground'],
    ['Surface soil moisture', values.moisture, '%', 'Volumetric · 0–1 cm depth'],
    ['Relative humidity', values.humidity, '%', 'At 2 metres above ground'],
    ['Grid elevation', values.elevation, 'm', 'Weather grid · not a field survey'],
  ]
  const mapUrl = `https://www.openstreetmap.org/?mlat=${Number(farm.latitude)}&mlon=${Number(farm.longitude)}#map=13/${Number(farm.latitude)}/${Number(farm.longitude)}`
  return <><div className="page-heading"><div><h1>Field conditions</h1><p>{farm.name} · {farm.region}, {farm.country}</p></div><button className="button button-outline" onClick={refreshWeather} disabled={status === 'loading'}><RefreshCw size={16} className={status === 'loading' ? 'spinning' : ''} />{status === 'loading' ? 'Updating…' : 'Refresh weather'}</button></div>
    <div className={`source-notice ${weather ? 'source-ready' : ''}`} role="status"><span>{weather ? <>Weather model values from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Retrieved {new Date(weather.fetchedAt).toLocaleString()}. Model time: {weather.modelTime.replace('T', ' ')} (field local time).</> : status === 'loading' ? 'Fetching current weather. Sample values are shown while the request completes.' : 'Live weather could not be retrieved. All weather values below are illustrative; try refreshing.'}</span><span className={`badge ${weather ? 'badge-live' : 'badge-sample'}`}>{weather ? 'Live source' : 'Sample data'}</span></div>
    <div className="environment-grid">{metrics.map(([name, value, unit, note]) => <article className="metric-card" key={name}><div className="metric-label">{name}</div><div className="metric-value">{fmt(value, name === 'Precipitation' ? 1 : 0)}<span>{unit}</span></div><p className="metric-foot">{note}</p></article>)}</div>
    <section className="panel"><div className="panel-heading"><div><h2>Seven-day weather forecast</h2><p>Daily highs, lows and precipitation at your coordinates</p></div><span className={`badge ${weather ? 'badge-live' : 'badge-sample'}`}>{weather ? '7-day forecast' : 'Illustrative forecast'}</span></div><div className="week-grid">{values.days.slice(0, 7).map((day, index) => { const condition = day.code >= 50 ? 'Precipitation' : day.code >= 3 ? 'Cloudy' : 'Clear'; return <div className="day-card" key={day.date}><span>{index === 0 ? 'Today' : new Date(`${day.date}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short' })}</span><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</small><span className="day-condition">{condition}</span><strong>{fmt(day.max, 0)}° <span>{fmt(day.min, 0)}°</span></strong><p> {fmt(day.rain)} mm</p></div> })}</div></section>
    <div className="conditions-bottom"><section className="panel location-panel"><FieldIllustration /><div className="setup-summary"><div className="panel-heading"><div><h2> Your field location</h2><p>{fmt(Number(farm.latitude), 4)}°, {fmt(Number(farm.longitude), 4)}°</p></div><span className="badge">{farm.sample ? 'Sample coordinates' : 'Your coordinates'}</span></div><p>Parcel illustration only. Weather represents the provider’s grid near these coordinates.</p><a href={mapUrl} className="text-link" target="_blank" rel="noreferrer">Open location on OpenStreetMap </a></div></section><section className="panel"><div className="panel-heading"><div><h2>Soil & crop quality</h2><p>Recorded measurements and missing data</p></div></div><dl className="data-list"><div><dt>Soil texture</dt><dd>{farm.soil}<small>Field profile · user supplied</small></dd></div><div><dt>pH & nutrient profile</dt><dd>Not measured<small>Soil survey / lab result needed</small></dd></div><div><dt>Grain protein & grade</dt><dd>Not assessed<small>Crop-specific quality model needed</small></dd></div><div><dt>Vegetation index (NDVI)</dt><dd>Not connected<small>Satellite observations planned</small></dd></div><div><dt>Slope & topography</dt><dd>Not surveyed<small>Elevation alone does not describe slope</small></dd></div></dl><Link to="/about" className="text-link">Data sources and limitations </Link></section></div>
  </>
}
