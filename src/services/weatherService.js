export async function fetchWeather(farm, signal) {
  const response = await fetch('/api/weather', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal,
    body: JSON.stringify({ latitude: Number(farm.latitude), longitude: Number(farm.longitude) }),
  })
  if (!response.ok) throw new Error('Weather service is temporarily unavailable.')
  const weather = await response.json()
  if (!Number.isFinite(weather.temperature) || !Array.isArray(weather.days) || typeof weather.modelTime !== 'string' || typeof weather.fetchedAt !== 'string') {
    throw new Error('The weather service returned incomplete data.')
  }
  return weather
}
