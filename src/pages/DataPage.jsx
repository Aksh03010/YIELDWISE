import { MapPin, CloudSun, Satellite, Sprout, ChartNoAxesCombined, ArrowUpRight, Check, CircleDashed } from 'lucide-react'

const sources = [
  { name: 'Browser geolocation', status: 'Available', live: true, icon: MapPin, description: 'Permission-based device coordinates, with manual entry as an alternative. Confirm that your device is at the field.', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API' },
  { name: 'Open-Meteo', status: 'Connected', live: true, icon: CloudSun, description: 'Current modeled temperature, wind and humidity; seven-day precipitation and surface soil moisture. Availability is shown per request.', url: 'https://open-meteo.com/en/docs' },
  { name: 'NASA POWER & remote sensing', status: 'Planned', icon: Satellite, description: 'Coordinate-based environmental history and satellite vegetation observations are planned inputs. No NASA imagery or NDVI is fetched today.', url: 'https://power.larc.nasa.gov/docs/services/api/' },
  { name: 'Soil & terrain records', status: 'Planned', icon: Sprout, description: 'Regional soil surveys, lab measurements and terrain layers will complement the field profile. Weather grid elevation is not a topographic survey.', url: 'https://www.nrcs.usda.gov/resources/data-and-reports/web-soil-survey' },
  { name: 'Regional production & trade', status: 'Planned', icon: ChartNoAxesCombined, description: 'USDA, Statistics Canada and Mexican official records are intended sources. The balance lab uses editable hypothetical volumes.', url: 'https://www.usda.gov/oce/commodity/wasde' },
]

const worksToday = [
  'Save a field with coordinates, crop and area.',
  'Retrieve modeled weather near that location.',
  'Explore repeatable sample yield scenarios at 1, 6 and 12 months.',
  'Compare sample crop potential and export a labeled outlook.',
  'Explore an editable supply-and-price sensitivity calculation.',
]
const needsModel = [
  'Validated crop-specific inference and training datasets.',
  'Calibrated prediction intervals and regional backtesting.',
  'Protein, grade and moisture models for crop quality.',
  'Regional production aggregation and actual trade feeds.',
  'Calibrated crop prices and company exposure analysis.',
]

// Data & methodology: the single place that states what is live, what is a
// fixture, and how to read every number the other pages show.
export default function DataPage() {
  return <div className="flow">
    <div className="page-head">
      <div>
        <span className="eyebrow">Transparency</span>
        <h1>Data & methodology</h1>
        <p className="sub">What is connected, what is illustrative, and how to read an outlook.</p>
      </div>
    </div>

    <section className="method-hero">
      <span className="badge badge-dark">Our purpose</span>
      <h2>From one field to a connected food system.</h2>
      <p>HARVEST is being built for farmers and agricultural companies in Canada, the United States and Mexico. The goal is to connect local growing conditions with harvest yield, crop quality and regional supply planning — and to be explicit about the difference until each piece is validated.</p>
    </section>

    <div className="two-col">
      <section className="card">
        <h2>What you can use today</h2>
        <ul className="check-list">{worksToday.map(text => <li key={text}><Check size={17} />{text}</li>)}</ul>
      </section>
      <section className="card">
        <h2>What still needs a model</h2>
        <ul className="check-list">{needsModel.map(text => <li className="pending" key={text}><CircleDashed size={17} />{text}</li>)}</ul>
      </section>
    </div>

    <div className="section-head gap-top">
      <div>
        <h2>Data connections</h2>
        <p className="stat-note">Availability is separate from forecast accuracy</p>
      </div>
    </div>
    <div className="sources">
      {sources.map(({ name, status, live, icon: Icon, description, url }) => (
        <article className="card source-card" key={name}>
          <div className="src-head">
            <span className="src-icon"><Icon size={21} /></span>
            <span className={`badge ${live ? 'badge-live' : ''}`}>{status}</span>
          </div>
          <h3>{name}</h3>
          <p>{description}</p>
          <a href={url} target="_blank" rel="noreferrer" className="link">Provider documentation <ArrowUpRight size={14} /></a>
        </article>
      ))}
    </div>

    <section className="card prose">
      <h2>How to read an outlook</h2>
      <div className="two-col">
        <div>
          <h3>Yield and quality are different.</h3>
          <p>Yield is harvest mass per unit of land, shown in metric tonnes per hectare (t/ha). Total production is yield multiplied by field area. Grain quality needs different targets and measurements, such as protein, moisture and grade.</p>
          <h3>A horizon is a planning date.</h3>
          <p>A one-, six- or twelve-month outlook updates the view of expected harvest yield. It is not a promise that a full crop can be harvested within that period. The demo changes scenario spread by horizon; it does not forecast future weather.</p>
        </div>
        <div>
          <h3>Examples are not probabilities.</h3>
          <p>The current yield engine is a deterministic fixture, not trained AI. Its ranges are illustrative scenario spreads with no statistical coverage claim. Real weather is not yet fed into the yield calculation.</p>
          <h3>Your location stays in your control.</h3>
          <p>Browser permission is required for device location. Your field profile is saved locally in this browser. Coordinates are sent to Open-Meteo for weather, and to OpenStreetMap only when you open its link. We do not infer your field from your IP address.</p>
        </div>
      </div>
    </section>
  </div>
}
