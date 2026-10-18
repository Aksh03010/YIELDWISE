import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Workspace from './components/Workspace.jsx'
import HomePage from './pages/HomePage.jsx'
import OutlookPage from './pages/OutlookPage.jsx'
import HarvestPlanner from './pages/HarvestPlanner.jsx'
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
    } catch {
      setStorageNotice('Browser storage is unavailable. This field will be lost when you close the tab.')
    }
  }

  const shared = { farm, horizon, setHorizon, scenario, setScenario, ...weatherState }
  return (
    <Workspace farm={farm} saveFarm={saveFarm}>
      {storageNotice && <div className="notice" role="status">{storageNotice}</div>}
      <Routes>
        <Route path="/" element={<HomePage {...shared} />} />
        <Route path="/outlook" element={<OutlookPage {...shared} />} />
        <Route path="/planning" element={<HarvestPlanner key={`${farm.id}:${farm.crop}`} {...shared} />} />
        <Route path="/field" element={<FieldEditor key={farm.id} farm={farm} saveFarm={saveFarm} />} />
        <Route path="/conditions" element={<ConditionsPage farm={farm} {...weatherState} />} />
        <Route path="/market" element={<SupplyPage farm={farm} />} />
        <Route path="/about" element={<DataPage />} />
        <Route path="/results" element={<Navigate to="/outlook" replace />} />
        <Route path="/predict" element={<Navigate to="/field" replace />} />
        <Route path="/environmental" element={<Navigate to="/conditions" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Workspace>
  )
}
