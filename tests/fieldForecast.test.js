import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFieldRequest, fetchFieldForecast } from '../src/services/fieldForecastService.js'

test('field requests use entered coordinates, date and area without trial examples', () => {
  const payload = buildFieldRequest('corn', { latitude: '43.65', longitude: '-79.38', areaHa: '40', plantingDate: '2021-05-22' })
  assert.deepEqual(payload, { crop: 'corn', latitude: 43.65, longitude: -79.38, area_ha: 40, planting_date: '2021-05-22', research_only: true })
  for (const patch of [{ latitude: '' }, { longitude: 'bad' }, { areaHa: 0 }, { plantingDate: '' }]) assert.throws(() => buildFieldRequest('corn', { latitude: 43, longitude: -79, areaHa: 40, plantingDate: '2021-05-22', ...patch }))
})

test('field responses from a different location are rejected', async () => {
  const originalFetch = globalThis.fetch
  const payload = buildFieldRequest('corn', { latitude: 43, longitude: -79, areaHa: 40, plantingDate: '2021-05-22' })
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ crop: 'corn', research_only: true, location_driven: true, latitude: 40, longitude: -100, area_ha: 40, planting_date: payload.planting_date, source: { days: 31 }, predictions: [] }) })
  try { await assert.rejects(fetchFieldForecast(payload), /different or incomplete/) }
  finally { globalThis.fetch = originalFetch }
})
