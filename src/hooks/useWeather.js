import { useEffect, useState } from 'react'
import { fetchWeather } from '../services/weatherService.js'

export function useWeather(farm) {
  const [result, setResult] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const { latitude, longitude } = farm
  const requestKey = `${latitude}:${longitude}:${refresh}`
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    fetchWeather({ latitude, longitude }, controller.signal)
      .then(weather => { if (active && !controller.signal.aborted) setResult({ requestKey, weather, status: 'ready' }) })
      .catch(() => { if (active) setResult({ requestKey, weather: null, status: 'error' }) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [latitude, longitude, requestKey])
  // A changed coordinate or refresh immediately hides the previous request's data.
  const current = result?.requestKey === requestKey ? result : { weather: null, status: 'loading' }
  return { weather: current.weather, status: current.status, refreshWeather: () => setRefresh(value => value + 1) }
}
