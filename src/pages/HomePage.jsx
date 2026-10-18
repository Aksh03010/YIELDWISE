import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ArrowDownRight, CloudSun, Droplets, Layers, MapPin, RefreshCw, Sprout, Wheat, Wind } from 'lucide-react'
import { fieldHectares, formatNumber as fmt } from '../data/agriculture.js'
import { createOutlook } from '../services/outlookService.js'
import { SAMPLE_WEATHER } from '../services/weatherService.js'
import FieldIllustration from '../components/FieldIllustration.jsx'
import ForecastChart from '../components/ForecastChart.jsx'

// Overview page: a bento of at-a-glance tiles — field identity, conditions
// right now, the headline yield numbers, the trend, and doors into the
// three working pages. Work itself happens on those pages.
export default function HomePage({ farm, horizon, scenario, weather, status, refreshWeather }) {
  const outlook = useMemo(() => createOutlook(farm, horizon, scenario), [farm, horizon, scenario])
  const conditions = weather || SAMPLE_WEATHER
  const Delta = outlook.change >= 0 ? ArrowUpRight : ArrowDownRight

  return (
    <div className="bento">
      {/* Field identity */}
      <section className="card card-dark field-tile span-7">
        <div className="tile-head">
          <span className="eyebrow eyebrow-dark">Active field</span>
          <span className="badge badge-dark">{farm.sample ? 'Sample field' : 'Saved in this browser'}</span>
        </div>
        <h1>{farm.name}</h1>
        <p className="sub">
          {farm.locality ? `${farm.locality}, ` : ''}{farm.region}, {farm.country} · {outlook.crop.name} · {farm.irrigation} · {fmt(fieldHectares(farm), 0)} ha
        </p>
        <div className="tile-actions">
          <Link className="btn btn-sun" to="/outlook">Open yield outlook <ArrowRight size={16} /></Link>
          <Link className="link link-dark" to="/field">Edit field details <ArrowUpRight size={15} /></Link>
        </div>
      </section>

      {/* Conditions now */}
      <section className="card span-5">
        <div className="tile-head">
          <h2>Conditions now</h2>
          <button className={`icon-btn ${status === 'loading' ? 'spinning' : ''}`} aria-label="Refresh weather" title="Refresh weather" onClick={refreshWeather} disabled={status === 'loading'}>
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="temp-row">
          <CloudSun size={44} strokeWidth={1.5} />
          <div>
            <span className="temp">{fmt(conditions.temperature, 0)}°<small>C</small></span>
            <span className="temp-meta">{weather ? 'Open-Meteo model value' : 'Illustrative value'}</span>
          </div>
          <span className={`badge ${weather ? 'badge-live' : 'badge-sample'}`}>{weather ? 'Live' : 'Sample'}</span>
        </div>
        <div className="cond-rows">
          <div><span><Droplets size={16} /> 7-day precipitation</span><strong>{fmt(conditions.rainfall)} mm</strong></div>
          <div><span><Wind size={16} /> Wind speed</span><strong>{fmt(conditions.wind, 0)} km/h</strong></div>
          <div><span><Sprout size={16} /> Surface soil moisture</span><strong>{fmt(conditions.moisture, 0)}%</strong></div>
        </div>
        <div className="tile-foot">
          <span>{status === 'loading' ? 'Fetching weather…' : weather ? `Retrieved ${new Date(weather.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Live weather unavailable'}</span>
          <Link className="link" to="/conditions">Full conditions <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* Headline numbers */}
      <article className="card card-sun span-3">
        <div className="stat-label">Expected yield <Wheat size={17} /></div>
        <div className="stat-value">{fmt(outlook.estimatedYield, 2)}<small>t/ha</small></div>
        <div className="stat-note">
          <span className={outlook.change >= 0 ? 'delta-up' : 'delta-down'}><Delta size={14} /> {fmt(outlook.change)}%</span>
          vs. sample last season
        </div>
      </article>
      <article className="card span-3">
        <div className="stat-label">Field production <Layers size={17} /></div>
        <div className="stat-value">{fmt(outlook.totalProduction, 0)}<small>tonnes</small></div>
        <div className="stat-note">{scenario} season · {horizon}-month outlook</div>
      </article>

      {/* The field itself */}
      <section className="card card-flush span-6">
        <FieldIllustration />
        <div className="field-caption">
          <span><MapPin size={15} /><strong>{fmt(Number(farm.latitude), 4)}°, {fmt(Number(farm.longitude), 4)}°</strong></span>
          <span>Illustration, not satellite imagery</span>
        </div>
      </section>

      {/* Trend */}
      <section className="card span-6">
        <div className="tile-head">
          <h2>Yield trend</h2>
          <span className="badge badge-sample">Illustrative</span>
        </div>
        <ForecastChart outlook={outlook} />
        <div className="tile-foot">
          <span>Scenario range at {outlook.targetLabel}</span>
          <Link className="link" to="/outlook">Adjust horizon & scenario <ArrowRight size={15} /></Link>
        </div>
      </section>

      {/* Doors into the working pages */}
      <section className="card span-7">
        <span className="eyebrow">Scenario lab</span>
        <h2 className="tile-title">Supply balance</h2>
        <p className="tile-copy">Edit production, trade and demand assumptions to see ending stocks and a simple price response. All volumes hypothetical.</p>
        <div className="tile-foot"><Link className="link" to="/market">Open the balance lab <ArrowUpRight size={15} /></Link></div>
      </section>
      <section className="card span-5">
        <span className="eyebrow">Transparency</span>
        <h2 className="tile-title">What's live, what's illustrative</h2>
        <p className="tile-copy">Weather is live from Open-Meteo. Yield history and market figures are product fixtures, not forecasts.</p>
        <div className="tile-foot"><Link className="link" to="/about">Data & methodology <ArrowUpRight size={15} /></Link></div>
      </section>
    </div>
  )
}
