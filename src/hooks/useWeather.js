import { useEffect, useState } from 'react'
import { fetchWeather } from '../services/weatherService.js'

export function useWeather(farm) {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading')
  const [refresh, setRefresh] = useState(0)
  const { latitude, longitude } = farm
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    setWeather(null)
    setStatus('loading')
    fetchWeather({ latitude, longitude }, controller.signal)
      .then(result => { if (active && !controller.signal.aborted) { setWeather(result); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
      .finally(() => clearTimeout(timeout))
    return () => { active = false; controller.abort(); clearTimeout(timeout) }
  }, [latitude, longitude, refresh])
  return { weather, status, refreshWeather: () => setRefresh(value => value + 1) }
}
