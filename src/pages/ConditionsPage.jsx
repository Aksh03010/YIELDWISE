import { Link } from 'react-router-dom'
import { CloudRain, Sun, Cloud, RefreshCw } from 'lucide-react'
import { formatNumber as fmt } from '../data/agriculture.js'
import { SAMPLE_WEATHER } from '../services/weatherService.js'
import FieldIllustration from '../components/FieldIllustration.jsx'

// Field conditions: everything the live weather provider returns for this
// coordinate, plus an honest list of what has no data yet.
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
  return <div className="flow">
    <div className="page-head">
      <div>
        <h1>Field conditions</h1>
        <p className="sub">{farm.name} · {farm.region}, {farm.country}</p>
      </div>
      <button className="btn btn-ghost" onClick={refreshWeather} disabled={status === 'loading'}>
        <RefreshCw size={16} className={status === 'loading' ? 'spinning' : ''} /> {status === 'loading' ? 'Updating…' : 'Refresh weather'}
      </button>
    </div>

    <div className={`notice ${weather ? 'notice-ready' : ''}`} role="status">
      <span>
        {weather
          ? <>Weather model values from <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>. Retrieved {new Date(weather.fetchedAt).toLocaleString()}. Model time: {weather.modelTime.replace('T', ' ')} (field local time).</>
          : status === 'loading'
            ? 'Fetching current weather. Sample values are shown while the request completes.'
            : 'Live weather could not be retrieved. All weather values below are illustrative; try refreshing.'}
      </span>
      <span className={`badge ${weather ? 'badge-live' : 'badge-sample'}`}>{weather ? 'Live source' : 'Sample data'}</span>
    </div>

    <div className="bento">
      {metrics.map(([name, value, unit, note]) => (
        <article className="card span-4" key={name}>
          <div className="stat-label">{name}</div>
          <div className="stat-value">{fmt(value, name === 'Precipitation' ? 1 : 0)}<small>{unit}</small></div>
          <div className="stat-note">{note}</div>
        </article>
      ))}
    </div>

    <section className="card gap-top">
      <div className="section-head">
        <div>
          <h2>The week ahead</h2>
          <p className="stat-note">Daily highs, lows and precipitation at your coordinates</p>
        </div>
        <span className={`badge ${weather ? 'badge-live' : 'badge-sample'}`}>{weather ? '7-day forecast' : 'Illustrative forecast'}</span>
      </div>
      <div className="week">
        {values.days.slice(0, 7).map((day, index) => {
          const Icon = day.code >= 50 ? CloudRain : day.code >= 3 ? Cloud : Sun
          return <div className="day" key={day.date}>
            <span>{index === 0 ? 'Today' : new Date(`${day.date}T12:00:00`).toLocaleDateString('en-CA', { weekday: 'short' })}</span>
            <small>{new Date(`${day.date}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</small>
            <Icon size={28} strokeWidth={1.5} />
            <strong>{fmt(day.max, 0)}° <span>{fmt(day.min, 0)}°</span></strong>
            <p> {fmt(day.rain)} mm</p>
          </div>
        })}
      </div>
    </section>

    <div className="two-col gap-top">
      <section className="card card-flush">
        <FieldIllustration />
        <div className="setup-summary summary-pad">
          <div className="section-head">
            <div>
              <h2 className="h2-icon"> Your field location</h2>
              <p className="stat-note">{fmt(Number(farm.latitude), 4)}°, {fmt(Number(farm.longitude), 4)}°</p>
            </div>
            <span className="badge">{farm.sample ? 'Sample coordinates' : 'Your coordinates'}</span>
          </div>
          <p className="stat-note">Parcel illustration only. Weather represents the provider's grid near these coordinates.</p>
          <a href={mapUrl} className="link link-top" target="_blank" rel="noreferrer">Open location on OpenStreetMap</a>
        </div>
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Soil & crop measurements</h2>
            <p className="stat-note">What exists today, and what still needs data</p>
          </div>
        </div>
        <dl className="dl">
          <div><dt>Soil texture</dt><dd>{farm.soil}<small>Field profile · user supplied</small></dd></div>
          <div><dt>pH & nutrient profile</dt><dd>Not measured<small>Soil survey / lab result needed</small></dd></div>
          <div><dt>Grain protein & grade</dt><dd><Link className="link" to="/planning#grade-target">Custom grade targets</Link><small>Illustrative scenarios; measured quality still needed</small></dd></div>
          <div><dt>Vegetation index (NDVI)</dt><dd>Not connected<small>Satellite observations planned</small></dd></div>
          <div><dt>Slope & topography</dt><dd>Not surveyed<small>Elevation alone does not describe slope</small></dd></div>
        </dl>
        <Link to="/about" className="link link-top">Data sources & limitations</Link>
      </section>
    </div>
  </div>
}
