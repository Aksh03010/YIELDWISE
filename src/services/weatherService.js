export async function fetchWeather(farm, signal) {
  const query = new URLSearchParams({
    latitude: farm.latitude, longitude: farm.longitude,
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code',
    hourly: 'soil_moisture_0_to_1cm',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
    forecast_days: '16', timezone: 'auto',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal })
  if (!response.ok) throw new Error('Weather service is temporarily unavailable.')
  const data = await response.json()
  if (!Number.isFinite(data.current?.temperature_2m) || !Array.isArray(data.daily?.time)) throw new Error('The weather provider returned incomplete data.')
  const hour = data.hourly?.time?.findIndex(time => time.slice(0, 13) === data.current.time.slice(0, 13)) ?? -1
  const moisture = hour >= 0 ? data.hourly?.soil_moisture_0_to_1cm?.[hour] : null
  const dailyRain = data.daily.precipitation_sum
  const rainfall = Array.isArray(dailyRain) && dailyRain.length > 0 && dailyRain.slice(0, 7).every(Number.isFinite)
    ? dailyRain.slice(0, 7).reduce((sum, value) => sum + value, 0) : null
  return {
    temperature: data.current.temperature_2m, wind: data.current.wind_speed_10m,
    humidity: data.current.relative_humidity_2m,
    rainfall,
    moisture: Number.isFinite(moisture) ? moisture * 100 : null, elevation: data.elevation,
    source: 'Open-Meteo', modelTime: data.current.time, fetchedAt: new Date().toISOString(),
    days: data.daily.time.map((date, index) => ({ date, max: data.daily.temperature_2m_max[index], min: data.daily.temperature_2m_min[index], rain: data.daily.precipitation_sum[index], code: data.daily.weather_code[index] })),
  }
}
export const SAMPLE_WEATHER = {
  temperature: 18, wind: 14, humidity: 62, rainfall: 18.4, moisture: 28, elevation: 577,
  source: 'Illustrative', modelTime: null,
  days: [17, 19, 18, 16, 20, 21, 19, 17, 15, 13, 9, 10, 12, 11, 14, 15].map((max, i) => {
    const date = new Date(); date.setDate(date.getDate() + i)
    return { date: date.toLocaleDateString('en-CA'), max, min: max - 9, rain: [0, 0, 2.4, 12, 4, 0, 0, 0, 1, 0, 9, 6, 0, 0, 2, 0][i], code: [3, 10, 11].includes(i) ? 61 : [2, 4, 8, 14].includes(i) ? 3 : 1 }
  }),
}
