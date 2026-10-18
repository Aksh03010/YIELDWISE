import { useWeather } from '../hooks/useWeather.js'
import { formatNumber as fmt } from '../data/agriculture.js'

export default function CurrentFieldWeather({ latitude, longitude, continuous = true }) {
  const { weather, status, checkedAt, refreshWeather } = useWeather({ latitude, longitude }, { pollInterval: continuous ? 60000 : 0 })
  return <section className="card">
    <div className="tile-head"><h2>Current weather at this location</h2><button className="btn btn-small btn-ghost" type="button" disabled={status === 'loading'} onClick={refreshWeather}>{status === 'loading' ? 'Updating…' : 'Refresh current weather'}</button></div>
    <p className="source-note">{fmt(latitude, 4)}°, {fmt(longitude, 4)}°. {continuous ? 'Updates every minute while this page is visible, and when you return to it.' : 'Automatic updates paused.'}</p>
    <dl className="dl"><div><dt>Air temperature now</dt><dd>{fmt(weather?.temperature)} °C</dd></div><div><dt>Wind speed now</dt><dd>{fmt(weather?.wind)} km/h</dd></div><div><dt>Next seven days of precipitation</dt><dd>{fmt(weather?.rainfall)} mm</dd></div></dl>
    <p className="source-note" role="status">{weather ? `Open-Meteo model time: ${weather.modelTime.replace('T', ' ')} (field local time). Provider data retrieved ${new Date(weather.fetchedAt).toLocaleString()}.${weather.cached ? ' Served from the one-minute backend cache.' : ''}` : status === 'loading' ? 'Retrieving current conditions for these coordinates…' : 'Current conditions could not be retrieved. Try refreshing.'}</p>
    {checkedAt && <p className="source-note">Last checked {new Date(checkedAt).toLocaleTimeString()}.{status === 'error' ? ' Update failed; the last successful weather remains displayed.' : status === 'loading' ? ' Checking for updates…' : ''}</p>}
    <p className="helper">These current conditions are shown separately from the observed early-season window used by the crop model.</p>
  </section>
}
