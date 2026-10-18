import test from 'node:test'
import assert from 'node:assert/strict'
import { getDeviceLocation, searchLocations } from '../src/services/locationService.js'

test('device lookup has a deadline even when a browser permission prompt never answers', async () => {
  let deadline, lateSuccess
  const lookup = getDeviceLocation({ geolocation: { getCurrentPosition(success) { lateSuccess = success } },
    schedule(callback) { deadline = callback; return 1 }, clear() {} })
  const rejected = assert.rejects(lookup, /did not return a location/)
  deadline()
  await rejected
  lateSuccess({ coords: { latitude: 43, longitude: -79, accuracy: 100 } })
  await assert.rejects(lookup, /did not return a location/, 'Late device results cannot replace a timed-out lookup')
})

test('device lookup can be cancelled and distinguishes permission denial from unavailable positioning', async () => {
  const controller = new AbortController()
  const cancelled = getDeviceLocation({ signal: controller.signal, geolocation: { getCurrentPosition() {} } })
  const rejected = assert.rejects(cancelled, { name: 'AbortError' })
  controller.abort()
  await rejected
  for (const [code, expected] of [[1, /blocked/], [2, /could not determine/], [3, /timed out/]]) {
    await assert.rejects(getDeviceLocation({ geolocation: { getCurrentPosition(success, error) { error({ code }) } } }), expected)
  }
  const result = await getDeviceLocation({ geolocation: { getCurrentPosition(success, error, options) {
    assert.equal(options.enableHighAccuracy, false)
    success({ coords: { latitude: 43.65320001, longitude: -79.38320001, accuracy: 92.2 } })
  } } })
  assert.deepEqual(result, { latitude: 43.6532, longitude: -79.3832, accuracy: 92 })
})

test('town search uses the selected country and returns only supported places with coordinates', async () => {
  const originalFetch = globalThis.fetch
  let requested
  globalThis.fetch = async url => {
    requested = url
    return { ok: true, json: async () => ({ results: [
      { id: 1, name: 'Toronto', admin1: 'Ontario', country_code: 'CA', latitude: 43.65, longitude: -79.38 },
      { id: 2, name: 'London', country_code: 'GB', latitude: 51.5, longitude: -0.1 },
      { id: 3, name: 'Missing', country_code: 'CA' },
    ] }) }
  }
  try {
    const places = await searchLocations('Toronto', { country: 'Canada' })
    assert.equal(requested.searchParams.get('countryCode'), 'CA')
    assert.deepEqual(places, [{ id: 1, locality: 'Toronto', region: 'Ontario', country: 'Canada', latitude: 43.65, longitude: -79.38 }])
    globalThis.fetch = async () => ({ ok: false })
    await assert.rejects(searchLocations('Toronto'), /unavailable/)
  } finally { globalThis.fetch = originalFetch }
})
