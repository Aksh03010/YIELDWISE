import test from 'node:test'
import assert from 'node:assert/strict'
import { FARMS, fieldHectares } from '../src/data/agriculture.js'
import { CROPS } from '../src/data/agriculture.js'
import { getGradeTarget, getSampleGradeRecords, HARVEST_PROFILES } from '../src/data/harvestProfiles.js'
import { addDays, calculateHarvestPlan, createPlannerState, defaultHarvestSettings, daysBetween, gradeEvidence, isDateKey, loadPlanner } from '../src/services/harvestPlanningService.js'
import { gradingCsv, parseGradingCsv } from '../src/services/gradingCsv.js'

const asOf = '2026-10-18'
function input(patch = {}, options = {}) {
  const farm = options.farm || FARMS[0]
  return {
    farm, asOf,
    settings: { ...defaultHarvestSettings(farm, asOf), ...patch },
    target: getGradeTarget(farm.crop), records: getSampleGradeRecords(farm.crop),
    weatherDays: Array.from({ length: 16 }, (_, index) => ({ date: addDays(asOf, index), min: 8, max: 20, rain: 1 })),
    ...options,
  }
}
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`)

test('harvest date calculations handle month boundaries and leap days', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01')
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
  assert.equal(daysBetween('2026-10-18', '2026-11-01'), 14)
  assert.equal(isDateKey('2026-02-31'), false)
})
test('every supported crop has a working crop-specific planning target', () => {
  for (const crop of CROPS) {
    const result = calculateHarvestPlan(input({}, { farm: { ...FARMS[0], crop: crop.id } }))
    assert.deepEqual(result.errors, {})
    assert.ok(result.evidence.count > 0)
    assert.ok(result.current.probability >= 0 && result.current.probability <= 1)
  }
})
test('harvest window is contiguous, includes the best date and uses near-best returns', () => {
  const result = calculateHarvestPlan(input())
  const dates = result.candidates.filter(day => day.date >= result.window.start && day.date <= result.window.end)
  assert.ok(dates.length >= 1 && dates.length <= 4)
  assert.ok(result.best.date >= result.window.start && result.best.date <= result.window.end)
  assert.equal(dates.length, daysBetween(result.window.start, result.window.end) + 1)
  for (const day of dates) {
    assert.ok(day.maturity >= 0.9)
    assert.ok(day.weatherComplete)
    assert.ok(result.best.net - day.net <= Math.abs(result.best.net) * 0.03 + 1e-7)
  }
})
test('frost before a delayed harvest lowers retained yield and moves the best date earlier', () => {
  const params = input()
  params.weatherDays[9].min = -3
  const result = calculateHarvestPlan(params)
  assert.ok(result.best.date < addDays(asOf, 9))
  assert.ok(result.later.frostDays > result.best.frostDays)
  assert.ok(result.later.weatherLoss > result.best.weatherLoss)
})
test('weather gaps, duplicates and distant harvest dates remain provisional', () => {
  const empty = calculateHarvestPlan(input({}, { weatherDays: [] }))
  assert.equal(empty.window.provisional, true)
  assert.equal(empty.current.weatherComplete, false)
  for (const type of ['frost', 'heat', 'rain', 'drought']) assert.equal(empty.warnings.find(warning => warning.type === type).state, 'unknown')
  const params = input()
  params.weatherDays[3] = { ...params.weatherDays[2] }
  assert.equal(calculateHarvestPlan(params).current.weatherComplete, false)
  const distant = calculateHarvestPlan(input({ maturityDate: addDays(asOf, 60), harvestDate: addDays(asOf, 60) }))
  assert.equal(distant.window.provisional, true)
})
test('calendar candidates stay within the selectable one-year limit', () => {
  const result = calculateHarvestPlan(input({ maturityDate: addDays(asOf, 365), harvestDate: addDays(asOf, 365) }))
  assert.ok(result.candidates.length > 0)
  assert.ok(result.candidates.every(day => day.date <= addDays(asOf, 365)))
})
test('quality checks every target criterion and rejects mismatched crop records', () => {
  const target = getGradeTarget('wheat')
  const good = { crop: 'wheat', protein_pct: 13, moisture_pct: 13, test_weight_kg_hl: 78 }
  const records = [good, good, good, { ...good, moisture_pct: 15 }, { ...good, crop: 'corn' }]
  const result = gradeEvidence('wheat', target, records)
  assert.equal(result.count, 4)
  assert.equal(result.passes, 3)
  assert.equal(result.observedRate, 0.75)
  const stricter = { ...target, limits: { ...target.limits, protein_pct: 14 } }
  assert.equal(gradeEvidence('wheat', stricter, records).passes, 0)
})
test('no grading evidence means no probability and no assumed premium revenue', () => {
  const result = calculateHarvestPlan(input({}, { records: [] }))
  assert.equal(result.current.probability, null)
  assert.equal(result.current.expectedPrice, defaultHarvestSettings(FARMS[0], asOf).standardPrice)
  close(result.current.revenue, result.current.tonnes * result.current.expectedPrice)
})
test('frost warning has an exact lead time and tracks unharvested exposure', () => {
  const params = input()
  params.weatherDays[4].min = -2
  const warning = calculateHarvestPlan(params).warnings.find(item => item.type === 'frost')
  assert.equal(warning.leadDays, 4)
  assert.equal(warning.exposed, true)
  const earlier = calculateHarvestPlan({ ...params, settings: { ...params.settings, harvestDate: addDays(asOf, 2) } })
  assert.equal(earlier.warnings.find(item => item.type === 'frost').exposed, false)
})
test('heat, rainfall, low-water and delay triggers use editable thresholds', () => {
  const params = input({ harvestDate: addDays(asOf, 15) })
  params.weatherDays[2].max = 35
  params.weatherDays[3].rain = 13
  let result = calculateHarvestPlan(params)
  for (const type of ['heat', 'rain', 'delay']) assert.equal(result.warnings.find(item => item.type === type).state, 'triggered')
  params.weatherDays.forEach(day => { day.rain = 0 })
  result = calculateHarvestPlan(params)
  assert.equal(result.warnings.find(item => item.type === 'drought').state, 'triggered')
  params.settings.extraIrrigation = 15
  assert.equal(calculateHarvestPlan(params).warnings.find(item => item.type === 'drought').state, 'not-triggered')
})
test('low-water screen is not marked as pre-harvest exposure after an earlier harvest', () => {
  const params = input({ harvestDate: addDays(asOf, 2) })
  params.weatherDays.forEach(day => { day.rain = 0 })
  const warning = calculateHarvestPlan(params).warnings.find(item => item.type === 'drought')
  assert.equal(warning.state, 'triggered')
  assert.equal(warning.exposed, false)
})
test('rainfall and temperature scenarios change yield without mutating the source forecast', () => {
  const base = input()
  const before = JSON.stringify(base.weatherDays)
  const baseline = calculateHarvestPlan(base)
  const dry = calculateHarvestPlan({ ...base, settings: { ...base.settings, rainfallChange: -30 } })
  const hotter = calculateHarvestPlan({ ...base, settings: { ...base.settings, temperatureChange: 5 } })
  assert.ok(dry.current.retainedYield < baseline.current.retainedYield)
  assert.ok(hotter.current.retainedYield < baseline.current.retainedYield)
  assert.equal(JSON.stringify(base.weatherDays), before)
})
test('added irrigation can relieve the dry scenario while adding its explicit cost', () => {
  const dry = calculateHarvestPlan(input({ rainfallChange: -30 }))
  const irrigated = calculateHarvestPlan(input({ rainfallChange: -30, extraIrrigation: 20 }))
  assert.ok(irrigated.current.retainedYield > dry.current.retainedYield)
  close(irrigated.current.costs.irrigation, fieldHectares(FARMS[0]) * 20 * 0.6)
})
test('profit conserves revenue minus every itemized expense and respects acreage conversion', () => {
  const params = input({ extraIrrigation: 10 }, { farm: { ...FARMS[0], area: 100, areaUnit: 'ac' } })
  const result = calculateHarvestPlan(params).current
  close(result.tonnes, result.retainedYield * fieldHectares(params.farm))
  close(result.totalCost, Object.values(result.costs).reduce((sum, value) => sum + value, 0))
  close(result.net, result.revenue - result.totalCost)
  assert.ok(result.expectedPrice >= params.settings.standardPrice && result.expectedPrice <= params.settings.premiumPrice)
})
test('harvest delay changes holding costs and negative net results remain negative', () => {
  const params = input({ operatingCost: 100000 })
  const result = calculateHarvestPlan(params)
  assert.ok(result.current.net < 0)
  assert.ok(result.best.net < 0)
  const later = calculateHarvestPlan({ ...params, settings: { ...params.settings, harvestDate: addDays(params.settings.harvestDate, 7) } }).current
  close(later.costs.holding - result.current.costs.holding, 7 * fieldHectares(params.farm) * params.settings.holdingCost)
})
test('invalid, blank and contradictory assumptions block calculations', () => {
  for (const patch of [{ baselineYield: '' }, { harvestingCost: -1 }, { maturityDate: '2026-02-31' }, { harvestDate: '2026-10-01' }, { temperatureChange: Infinity }, { premiumPrice: 1 }, { delayThreshold: 1.5 }]) {
    const result = calculateHarvestPlan(input(patch))
    assert.ok(Object.keys(result.errors).length > 0)
    assert.equal(result.current, undefined)
  }
  const params = input()
  params.target.limits.protein_pct = ''
  assert.ok(calculateHarvestPlan(params).errors.protein_pct)
})
test('crop-specific grading CSV round trips, including quoted headers and BOM', () => {
  for (const crop of CROPS) {
    const records = getSampleGradeRecords(crop.id)
    assert.deepEqual(parseGradingCsv('\uFEFF' + gradingCsv(crop.id, records), crop.id), records)
  }
  const text = '"crop","protein_pct","moisture_pct","test_weight_kg_hl"\r\nwheat,13,13,77'
  assert.equal(parseGradingCsv(text, 'wheat')[0].protein_pct, 13)
})
test('CSV import rejects wrong crops, missing measurements, duplicates and oversized datasets', () => {
  for (const text of [
    'crop,protein_pct,moisture_pct,test_weight_kg_hl\ncorn,13,13,77',
    'crop,protein_pct,moisture_pct,test_weight_kg_hl\nwheat,,13,77',
    'crop,protein_pct\nwheat,13',
    'crop,protein_pct,protein_pct\nwheat,13,13',
    'crop,protein_pct,moisture_pct,test_weight_kg_hl\nwheat,130,13,77',
    '"crop,protein_pct\nwheat,13',
    'a'.repeat(200001),
  ]) assert.throws(() => parseGradingCsv(text, 'wheat'))
  const tooMany = getSampleGradeRecords('wheat')
  assert.throws(() => parseGradingCsv(gradingCsv('wheat', Array.from({ length: 201 }, () => tooMany[0])), 'wheat'))
})
test('planner storage keeps the crop context and recovers from invalid or stale drafts', () => {
  const state = createPlannerState(FARMS[0], asOf)
  assert.deepEqual(loadPlanner(FARMS[0], { getItem: () => JSON.stringify(state) }, asOf), state)
  assert.equal(loadPlanner(FARMS[0], { getItem: () => '{' }, asOf).evidenceMode, 'sample')
  state.settings.harvestDate = addDays(asOf, -1)
  const recovered = loadPlanner(FARMS[0], { getItem: () => JSON.stringify(state) }, asOf)
  assert.equal(recovered.settings.harvestDate, addDays(asOf, 7))
  assert.deepEqual(Object.keys(recovered.target.limits), HARVEST_PROFILES.wheat.metrics.map(metric => metric.key))
})
