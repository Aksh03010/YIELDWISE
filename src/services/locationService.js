const COUNTRIES = { CA: 'Canada', US: 'United States', MX: 'Mexico' }

export function getDeviceLocation({ geolocation = globalThis.navigator?.geolocation, signal, timeoutMs = 12000, schedule = setTimeout, clear = clearTimeout } = {}) {
  return new Promise((resolve, reject) => {
    let finished = false, timer
    function finish(error, value) {
      if (finished) return
      finished = true
      clear(timer)
      signal?.removeEventListener('abort', abort)
      if (error) reject(error)
      else resolve(value)
    }
    function abort() { finish(new DOMException('Location request cancelled', 'AbortError')) }
    if (signal?.aborted) { abort(); return }
    if (!geolocation) { finish(new Error('Device location is unavailable in this browser. Search for a town or enter coordinates.')); return }
    signal?.addEventListener('abort', abort, { once: true })
    // Browser timeout may exclude time waiting for permission. Keep our own deadline.
    timer = schedule(() => finish(new Error('The browser did not return a location within 12 seconds. Allow location access, try your regular browser, or search for a town below.')), timeoutMs)
    try {
      geolocation.getCurrentPosition(position => {
        const { latitude, longitude, accuracy } = position.coords
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) { finish(new Error('The browser returned invalid coordinates. Search for a town or enter coordinates.')); return }
        finish(null, { latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)), accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null })
      }, error => {
        const messages = {
          1: 'Location access is blocked. Allow location for this site in your browser, or use town search below.',
          2: 'Your device could not determine its location. Town search works without device location.',
          3: 'Device location timed out. Retry, or use town search below.',
        }
        finish(new Error(messages[error.code] || 'Device location failed. Search for a town or enter coordinates.'))
      }, { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 300000 })
    } catch { finish(new Error('This browser could not start location access. Search for a town or enter coordinates.')) }
  })
}

export async function searchLocations(query, { country, signal } = {}) {
  const name = query.trim()
  if (name.length < 2) throw new Error('Enter at least two characters of a town or postcode.')
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({ name, count: '10', language: 'en', format: 'json',
    ...(country ? { countryCode: Object.keys(COUNTRIES).find(code => COUNTRIES[code] === country) || '' } : {}) }).toString()
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Location search is unavailable. You can still enter coordinates directly.')
  const data = await response.json()
  if (data.results !== undefined && !Array.isArray(data.results)) throw new Error('Location search returned incomplete data. Enter coordinates or try again.')
  return (data.results || []).filter(place => COUNTRIES[place.country_code] && Number.isFinite(place.latitude) && Number.isFinite(place.longitude))
    .map(place => ({ id: place.id, locality: place.name, region: place.admin1 || '', country: COUNTRIES[place.country_code], latitude: place.latitude, longitude: place.longitude }))
}
