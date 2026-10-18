import test from 'node:test'
import assert from 'node:assert/strict'
import { FARMS, AREA_TO_HA, fieldHectares, validateFarm, loadFarm } from '../src/data/agriculture.js'
import { createOutlook, calculateBalance, DEFAULT_BALANCE } from '../src/services/outlookService.js'
import { fetchWeather } from '../src/services/weatherService.js'

test('acre conversion is used consistently in total production', () => {
  const field = { ...FARMS[0], area: 100, areaUnit: 'ac' }
  const outlook = createOutlook(field)
  assert.equal(fieldHectares(field), 100 * AREA_TO_HA)
  assert.equal(outlook.totalProduction, outlook.estimatedYield * fieldHectares(field))
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
test('yield fixtures are repeatable and make no confidence claim', () => {
  const date = new Date('2026-10-17T12:00:00Z')
  assert.deepEqual(createOutlook(FARMS[0], 6, 'typical', date), createOutlook(FARMS[0], 6, 'typical', date))
  assert.equal(createOutlook(FARMS[0]).source, 'illustrative')
  assert.equal(createOutlook(FARMS[0]).confidence, undefined)
})
test('scenario ranges widen with horizon and include the estimate', () => {
  const results = [1, 6, 12].map(month => createOutlook(FARMS[0], month))
  results.forEach(result => assert.ok(result.low < result.estimatedYield && result.high > result.estimatedYield))
  assert.ok(results[0].high - results[0].low < results[1].high - results[1].low)
  assert.ok(results[1].high - results[1].low < results[2].high - results[2].low)
})
test('dry and wet scenario controls affect output in the intended direction', () => {
  assert.ok(createOutlook(FARMS[0], 12, 'dry').estimatedYield < createOutlook(FARMS[0]).estimatedYield)
  assert.ok(createOutlook(FARMS[0], 12, 'wet').estimatedYield > createOutlook(FARMS[0]).estimatedYield)
})
test('month-end planning dates do not skip the intended target month', () => {
  assert.equal(createOutlook(FARMS[0], 1, 'typical', new Date(2026, 0, 31, 12)).targetLabel, 'Feb 2026')
})
test('baseline balance conserves mass and reproduces the reference price', () => {
  const result = calculateBalance({ ...DEFAULT_BALANCE, populationGrowth: 0, productionChange: 0 })
  assert.equal(result.supply, 133)
  assert.equal(result.use, 105)
  assert.equal(result.endingStocks, 28)
  assert.equal(result.price, 240)
})
test('population-adjusted demand and production are counted exactly once', () => {
  const result = calculateBalance(DEFAULT_BALANCE)
  assert.equal(result.production, 104)
  assert.equal(result.demand, 70 * 1.012)
  assert.equal(result.endingStocks, 25 + 104 + 8 - 70 * 1.012 - 35)
  assert.ok(result.price < DEFAULT_BALANCE.basePrice)
})
test('external trade affects ending stocks with correct signs', () => {
  const base = calculateBalance(DEFAULT_BALANCE)
  assert.equal(calculateBalance({ ...DEFAULT_BALANCE, imports: 9 }).endingStocks, base.endingStocks + 1)
  assert.equal(calculateBalance({ ...DEFAULT_BALANCE, exports: 36 }).endingStocks, base.endingStocks - 1)
})
test('shortfalls remain negative rather than being silently changed to zero', () => {
  assert.ok(calculateBalance({ ...DEFAULT_BALANCE, production: 10 }).endingStocks < 0)
})
test('invalid or empty balance assumptions do not produce a price', () => {
  for (const patch of [{ openingStocks: -1 }, { domesticUse: 0 }, { production: '' }, { basePrice: 0 }, { exports: NaN }, { populationGrowth: -100 }, { elasticity: -1 }]) {
    assert.throws(() => calculateBalance({ ...DEFAULT_BALANCE, ...patch }))
  }
})
test('weather adapter preserves nulls and selects soil moisture for current hour', async () => {
  const originalFetch = globalThis.fetch
  let requested
  globalThis.fetch = async url => {
    requested = new URL(url)
    return { ok: true, json: async () => ({ current: { time: '2026-10-17T14:15', temperature_2m: 10, wind_speed_10m: 12, relative_humidity_2m: 60 }, hourly: { time: ['2026-10-17T00:00', '2026-10-17T14:00'], soil_moisture_0_to_1cm: [0.1, 0.32] }, daily: { time: ['2026-10-17'], temperature_2m_max: [15], temperature_2m_min: [4], precipitation_sum: [2], weather_code: [1] }, elevation: 570 }) }
  }
  try {
    const result = await fetchWeather(FARMS[0])
    assert.equal(result.moisture, 32)
    assert.equal(result.rainfall, 2)
    assert.equal(result.elevation, 570)
    assert.equal(requested.searchParams.get('latitude'), String(FARMS[0].latitude))
    assert.equal(requested.searchParams.get('forecast_days'), '7')
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
test('missing rain and unmatched soil moisture are displayed as unavailable', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({
    current: { time: '2026-10-17T14:15', temperature_2m: 10 },
    hourly: { time: ['2026-10-17T00:00'], soil_moisture_0_to_1cm: [0.4] },
    daily: { time: ['2026-10-17'], temperature_2m_max: [15], temperature_2m_min: [4], precipitation_sum: [null], weather_code: [1] },
  }) })
  try {
    const result = await fetchWeather(FARMS[0])
    assert.equal(result.rainfall, null)
    assert.equal(result.moisture, null)
  } finally { globalThis.fetch = originalFetch }
})
