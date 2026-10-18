import test from 'node:test'
import assert from 'node:assert/strict'
import { predictTargets } from '../src/services/predictionService.js'

test('model runs post actual inputs for every target and preserve partial failures', async () => {
  const originalFetch = globalThis.fetch, requests = []
  globalThis.fetch = async (url, options) => {
    const payload = JSON.parse(options.body)
    requests.push({ url, payload })
    return payload.target === 'Yield_Mg_ha'
      ? { ok: true, json: async () => ({ crop: 'corn', target: payload.target, value: 4.45, research_only: true }) }
      : { ok: false, json: async () => ({ detail: 'Site identifier required' }) }
  }
  try {
    const results = await predictTargets({ crop: 'corn', targets: ['Yield_Mg_ha', 'Grain_Moisture'], inputs: { Year: 2021 }, siteId: 'COH1' })
    assert.equal(results[0].value, 4.45)
    assert.equal(results[1].error, 'Site identifier required')
    assert.deepEqual(requests[0], { url: '/api/predict', payload: { crop: 'corn', target: 'Yield_Mg_ha', inputs: { Year: 2021 }, site_id: 'COH1', research_only: true } })
  } finally { globalThis.fetch = originalFetch }
})

test('a missing model value is an error and never becomes a demo prediction', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ crop: 'corn', target: 'Yield_Mg_ha', value: null, research_only: true }) })
  try {
    const [result] = await predictTargets({ crop: 'corn', targets: ['Yield_Mg_ha'], inputs: {} })
    assert.match(result.error, /incomplete/)
    assert.equal(result.value, undefined)
  } finally { globalThis.fetch = originalFetch }
})
