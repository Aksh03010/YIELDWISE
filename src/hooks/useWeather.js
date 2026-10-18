import { useEffect, useState } from 'react'
import { fetchWeather } from '../services/weatherService.js'
import { useVisibleRefresh } from './useVisibleRefresh.js'

export function useWeather(farm, { pollInterval = 0 } = {}) {
  const [result, setResult] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const tick = useVisibleRefresh(pollInterval)
  const { latitude, longitude } = farm
  const locationKey = `${latitude}:${longitude}`
  const requestKey = `${locationKey}:${refresh}:${tick}`
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    fetchWeather({ latitude, longitude }, controller.signal)
      .then(weather => { if (active && !controller.signal.aborted) setResult({ requestKey, locationKey, weather, checkedAt: new Date().toISOString(), status: 'ready' }) })
      .catch(() => { if (active) setResult(previous => ({ requestKey, locationKey, weather: previous?.locationKey === locationKey ? previous.weather : null, checkedAt: new Date().toISOString(), status: 'error' })) })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [latitude, longitude, locationKey, requestKey])
  // Keep the same field visible during refresh; never show another location's weather.
  const sameLocation = result?.locationKey === locationKey
  return {
    weather: sameLocation ? result.weather : null,
    status: result?.requestKey === requestKey ? result.status : 'loading',
    checkedAt: sameLocation ? result.checkedAt : null,
    refreshWeather: () => setRefresh(value => value + 1),
  }
}
