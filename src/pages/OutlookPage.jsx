import { useState } from 'react'
import { CROPS } from '../data/agriculture.js'
import TypingHeading from '../components/TypingHeading.jsx'
import PredictionRunner from '../components/PredictionRunner.jsx'
import FieldForecast from '../components/FieldForecast.jsx'

export default function OutlookPage({ farm, catalog, modelStatus, refreshModels }) {
  const [modelCrop, setModelCrop] = useState(farm.crop)
  const [mode, setMode] = useState('field')
  const available = catalog?.crops.filter(crop => crop.targets.length > 0) || []
  const choices = mode === 'field' ? available.filter(crop => crop.crop === 'corn') : available
  const entry = choices.find(crop => crop.crop === modelCrop) || choices[0]
  const fieldCrop = CROPS.find(crop => crop.id === farm.crop)?.name
  return <div className="flow">
    <div className="page-head"><div><TypingHeading text="Yield outlook" /><p className="sub">{farm.name} · Saved field crop: {fieldCrop}</p></div></div>
    <div className="prediction-modes" role="group" aria-label="Prediction inputs"><button type="button" aria-pressed={mode === 'field'} onClick={() => setMode('field')}>Your field location</button><button type="button" aria-pressed={mode === 'trial'} onClick={() => setMode('trial')}>Trial examples</button></div>
    {modelStatus === 'loading' && <section className="card" role="status"><h2>Connecting to the models</h2><p>Checking the running backend for trained crop models…</p></section>}
    {modelStatus === 'error' && <section className="card"><h2>Reconnect to the model service</h2><p>The backend could not be reached. Check that it is running, then retry.</p><button className="btn" onClick={refreshModels}>Retry model connection</button></section>}
    {entry && <>
      <section className="card model-selector"><label className="field">Prediction model<select value={entry.crop} onChange={event => setModelCrop(event.target.value)}>{choices.map(crop => <option key={crop.crop} value={crop.crop}>{crop.crop === 'corn' ? 'Maize (corn)' : CROPS.find(value => value.id === crop.crop)?.name || crop.crop}</option>)}</select></label><div><strong>Backend connected</strong><p className="stat-note">{mode === 'field' ? 'Environmental inputs are retrieved for the coordinates you submit.' : `${available.reduce((sum, crop) => sum + crop.targets.length, 0)} trained targets across ${available.length} crop models.`}</p></div></section>
      {mode === 'field' ? <FieldForecast key={`field:${farm.id}:${entry.crop}:${entry.version}`} farm={farm} entry={entry} /> : <PredictionRunner key={`trial:${entry.crop}:${entry.version}`} entry={entry} />}
    </>}
    {modelStatus === 'ready' && !entry && <section className="card"><h2>{mode === 'field' ? 'No location-based model loaded' : 'No trained models loaded'}</h2><p>{mode === 'field' ? 'Location-based inference currently requires the maize artifact. Soybean trial inputs remain available under Trial examples.' : 'The backend is reachable, but no model artifacts passed validation.'}</p><button className="btn" onClick={refreshModels}>Check models again</button></section>}
  </div>
}
