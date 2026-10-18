import { useState } from 'react'
import { CROPS } from '../data/agriculture.js'
import TypingHeading from '../components/TypingHeading.jsx'
import PredictionRunner from '../components/PredictionRunner.jsx'

export default function OutlookPage({ farm, catalog, modelStatus, refreshModels }) {
  const [modelCrop, setModelCrop] = useState(farm.crop)
  const available = catalog?.crops.filter(crop => crop.targets.length > 0) || []
  const entry = available.find(crop => crop.crop === modelCrop) || available[0]
  const fieldCrop = CROPS.find(crop => crop.id === farm.crop)?.name
  return <div className="flow">
    <div className="page-head"><div><TypingHeading text="Yield outlook" /><p className="sub">{farm.name} · Saved field crop: {fieldCrop}</p></div></div>
    {modelStatus === 'loading' && <section className="card" role="status"><h2>Connecting to the models</h2><p>Checking the running backend for trained crop models…</p></section>}
    {modelStatus === 'error' && <section className="card"><h2>Reconnect to the model service</h2><p>The backend could not be reached. Check that it is running, then retry.</p><button className="btn" onClick={refreshModels}>Retry model connection</button></section>}
    {entry && <>
      <section className="card model-selector"><label className="field">Prediction model<select value={entry.crop} onChange={event => setModelCrop(event.target.value)}>{available.map(crop => <option key={crop.crop} value={crop.crop}>{crop.crop === 'corn' ? 'Maize (corn)' : CROPS.find(value => value.id === crop.crop)?.name || crop.crop}</option>)}</select></label><div><strong>Backend connected</strong><p className="stat-note">{available.reduce((sum, crop) => sum + crop.targets.length, 0)} trained targets across {available.length} crop models.</p></div></section>
      {!available.some(crop => crop.crop === farm.crop) && <p className="source-note">A {fieldCrop?.toLowerCase()} model is not installed. You can run the maize and soybean models below without changing your saved field.</p>}
      <PredictionRunner key={`${entry.crop}:${entry.version}`} entry={entry} />
    </>}
    {modelStatus === 'ready' && !entry && <section className="card"><h2>No trained models loaded</h2><p>The backend is reachable, but no model artifacts passed validation.</p><button className="btn" onClick={refreshModels}>Check models again</button></section>}
  </div>
}
