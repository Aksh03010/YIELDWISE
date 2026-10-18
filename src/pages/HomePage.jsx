import { Link } from 'react-router-dom'
import { CROPS, fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import FieldIllustration from '../components/FieldIllustration.jsx'
import TypingHeading from '../components/TypingHeading.jsx'

export default function HomePage({ farm, weather, status, checkedAt, refreshWeather, modelStatus }) {
  const crop = CROPS.find(c => c.id === farm.crop)
  return <div className="bento">
    <section className="card card-dark field-tile span-7">
      <TypingHeading text={farm.name} />
      <p className="stat-note field-status">{farm.sample ? 'Sample field profile' : 'Saved in this browser'}</p>
      <p className="sub">{farm.region}, {farm.country} · {crop?.name} · {fmt(fieldHectares(farm), 0)} ha</p>
      <div className="tile-actions"><Link className="btn btn-sun" to="/outlook">Run a prediction</Link><Link className="link link-dark" to="/field">Edit field details</Link></div>
    </section>
    <section className="card span-5">
      <div className="tile-head"><h2>Conditions now</h2><button className="btn btn-small btn-ghost" disabled={status === 'loading'} onClick={refreshWeather}>Refresh</button></div>
      <div className="temp">{fmt(weather?.temperature, 0)}<small>°C</small></div>
      <div className="cond-rows"><div><span>7-day precipitation</span><strong>{fmt(weather?.rainfall)} mm</strong></div><div><span>Wind speed</span><strong>{fmt(weather?.wind)} km/h</strong></div></div>
      <p className="stat-note" role="status">{weather ? status === 'error' ? 'Update failed. Showing the last successful Open-Meteo data.' : 'Open-Meteo weather model values · automatic minute checks' : status === 'loading' ? 'Fetching weather…' : 'Weather unavailable. Try refreshing.'}{checkedAt && <> Last checked {new Date(checkedAt).toLocaleTimeString()}.</>}</p>
      <Link className="link" to="/conditions">Field conditions</Link>
    </section>
    <section className="card card-sun span-6">
      <h2>Yield outlook</h2>
      <p className="tile-copy">{modelStatus === 'loading' ? 'Connecting to the trained models…' : modelStatus === 'error' ? 'Reconnect to the backend to run predictions.' : 'Estimate maize yield and timing using coordinates, planting date and area. The backend retrieves the environmental inputs for that location.'}</p>
      <p className="stat-note">Field estimates are experimental. Maize and soybean trial examples are available separately.</p>
      <Link className="link" to="/outlook">Open prediction models</Link>
    </section>
    <section className="card card-flush span-6"><FieldIllustration /><div className="field-caption"><strong>{fmt(Number(farm.latitude), 4)}°, {fmt(Number(farm.longitude), 4)}°</strong><span>Field illustration</span></div></section>
    <section className="card span-6"><h2>Harvest planning</h2><p className="tile-copy">Compare quantities, saleable fractions, prices and costs you supply. Check a measured grain factor against a buyer's threshold.</p><Link className="link" to="/planning">Open planning tools</Link></section>
    <section className="card span-6"><h2>Understand the evidence</h2><p className="tile-copy">See which crop targets were trained, their held-out errors, and the limits on using trial results for a farm.</p><Link className="link" to="/about">Data & methodology</Link></section>
  </div>
}
