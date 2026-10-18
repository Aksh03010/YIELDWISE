import test from 'node:test'
import assert from 'node:assert/strict'
import { FARMS, AREA_TO_HA, fieldHectares, validateFarm, loadFarm } from '../src/data/agriculture.js'
import { fetchWeather } from '../src/services/weatherService.js'

test('acre conversion preserves the field area in hectares', () => {
  const field = { ...FARMS[0], area: 100, areaUnit: 'ac' }
  assert.equal(fieldHectares(field), 100 * AREA_TO_HA)
})
test('all three North American sample farms are valid', () => {
  FARMS.forEach(farm => assert.deepEqual(validateFarm(farm), {}))
})
test('invalid, missing and out-of-region coordinates and areas are rejected', () => {
  for (const area of ['', -5, 0, Infinity, 'bad']) assert.ok(validateFarm({ ...FARMS[0], area }).area)
  for (const latitude of ['', -1, 90, NaN]) assert.ok(validateFarm({ ...FARMS[0], latitude }).latitude)
  for (const longitude of ['', 30, -181, NaN]) assert.ok(validateFarm({ ...FARMS[0], longitude }).longitude)
  assert.ok(validateFarm({ ...FARMS[0], country: 'France' }).country)
})
test('broken, outdated and unavailable storage recover to a sample field', () => {
  for (const data of ['{', 'null', '{}', '{"name":"old"}']) {
    assert.equal(loadFarm({ getItem: () => data }).id, FARMS[0].id)
  }
  assert.equal(loadFarm({ getItem() { throw new Error('Denied') } }).id, FARMS[0].id)
  assert.deepEqual(loadFarm({ getItem: () => JSON.stringify(FARMS[1]) }), FARMS[1])
})
test('weather client posts coordinates to the backend and preserves unavailable values', async () => {
  const originalFetch = globalThis.fetch
  let requested
  globalThis.fetch = async (url, options) => {
    requested = { url, ...options }
    return { ok: true, json: async () => ({ temperature: 10, moisture: null, rainfall: null, elevation: 570, days: [{ date: '2026-10-17', rain: null }], modelTime: '2026-10-17T14:15', fetchedAt: '2026-10-17T14:16:00Z' }) }
  }
  try {
    const result = await fetchWeather(FARMS[0])
    assert.equal(result.moisture, null)
    assert.equal(result.rainfall, null, 'A partial day list must not be labeled as a seven-day total')
    assert.equal(result.elevation, 570)
    assert.equal(requested.url, '/api/weather')
    assert.equal(requested.method, 'POST')
    assert.deepEqual(JSON.parse(requested.body), { latitude: FARMS[0].latitude, longitude: FARMS[0].longitude })
  } finally { globalThis.fetch = originalFetch }
})
test('failed or incomplete weather does not masquerade as live data', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ ok: false })
    await assert.rejects(fetchWeather(FARMS[0]), /unavailable/)
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ current: { temperature_2m: null } }) })
    await assert.rejects(fetchWeather(FARMS[0]), /incomplete/)
  } finally { globalThis.fetch = originalFetch }
})
