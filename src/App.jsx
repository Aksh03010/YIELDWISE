import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Workspace from './components/Workspace.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FieldEditor from './pages/FieldEditor.jsx'
import ConditionsPage from './pages/ConditionsPage.jsx'
import SupplyPage from './pages/SupplyPage.jsx'
import DataPage from './pages/DataPage.jsx'
import { loadFarm } from './data/agriculture.js'
import { useWeather } from './hooks/useWeather.js'

export default function App() {
  const [farm, setFarm] = useState(() => loadFarm(window.localStorage))
  const [storageNotice, setStorageNotice] = useState('')
  const [horizon, setHorizon] = useState(12)
  const [scenario, setScenario] = useState('typical')
  const weatherState = useWeather(farm)
  function saveFarm(next) {
    setFarm(next)
    try {
      localStorage.setItem('harvest:field:v2', JSON.stringify(next))
      setStorageNotice('')
    } catch { setStorageNotice('Your field is available for this visit. Browser storage is unavailable, so it could not be saved for next time.') }
  }
  const shared = { farm, horizon, setHorizon, scenario, setScenario, ...weatherState }
  return (
    <Workspace farm={farm} saveFarm={saveFarm}>
      {storageNotice && <div className="notice" role="status">{storageNotice}</div>}
      <Routes>
        <Route path="/" element={<Dashboard {...shared} />} />
        <Route path="/results" element={<Dashboard {...shared} forecastsOnly />} />
        <Route path="/predict" element={<FieldEditor key={farm.id} farm={farm} saveFarm={saveFarm} />} />
        <Route path="/environmental" element={<ConditionsPage {...shared} />} />
        <Route path="/market" element={<SupplyPage farm={farm} />} />
        <Route path="/about" element={<DataPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Workspace>
  )
}
