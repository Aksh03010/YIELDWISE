import { CROPS, fieldHectares } from '../data/agriculture.js'
import { HARVEST_PROFILES, getGradeTarget } from '../data/harvestProfiles.js'
import { createOutlook } from './outlookService.js'

const DAY = 86400000
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function isDateKey(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
}
export const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY).toISOString().slice(0, 10)
export const daysBetween = (first, second) => Math.round((Date.parse(`${second}T12:00:00Z`) - Date.parse(`${first}T12:00:00Z`)) / DAY)
export const formatDate = date => isDateKey(date) ? new Date(`${date}T12:00:00Z`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : 'N/A'

export function defaultHarvestSettings(farm, asOf = dateKey()) {
  const crop = CROPS.find(item => item.id === farm.crop)
  const profile = HARVEST_PROFILES[farm.crop]
  return {
    maturityDate: addDays(asOf, 7), harvestDate: addDays(asOf, 7),
    rainfallChange: 0, temperatureChange: 0, extraIrrigation: 0,
    baselineYield: createOutlook(farm).estimatedYield, grainMoisture: profile.grainMoisture,
    standardPrice: crop.price, premiumPrice: Math.round(crop.price * 1.2),
    operatingCost: profile.operatingCost, harvestingCost: profile.harvestingCost,
    irrigationCost: 0.6, dryingCost: 3, holdingCost: 2,
    frostThreshold: 0, heatThreshold: 30, rainThreshold: 12, waterThreshold: 10, delayThreshold: 7,
  }
}

export function validateHarvestSettings(settings, target, crop, asOf = dateKey()) {
  const errors = {}
  const ranges = {
    rainfallChange: [-100, 100], temperatureChange: [-15, 15], extraIrrigation: [0, 100], baselineYield: [0.01, 50], grainMoisture: [0, 70],
    standardPrice: [0, 100000], premiumPrice: [0, 100000], operatingCost: [0, 100000], harvestingCost: [0, 100000], irrigationCost: [0, 1000], dryingCost: [0, 1000], holdingCost: [0, 10000],
    frostThreshold: [-15, 15], heatThreshold: [15, 55], rainThreshold: [1, 200], waterThreshold: [0, 100], delayThreshold: [1, 30],
  }
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (settings[key] === '' || settings[key] == null || !Number.isFinite(Number(settings[key])) || Number(settings[key]) < min || Number(settings[key]) > max) errors[key] = `Enter a value between ${min} and ${max}.`
  }
  for (const key of ['maturityDate', 'harvestDate']) {
    if (!isDateKey(settings[key])) errors[key] = 'Enter a valid date.'
    else if (daysBetween(asOf, settings[key]) > 365 || daysBetween(asOf, settings[key]) < (key === 'harvestDate' ? 0 : -60)) errors[key] = key === 'harvestDate' ? 'Choose a date from today through the next 365 days.' : 'Choose a readiness date between 60 days ago and 365 days from today.'
  }
  if (!errors.delayThreshold && !Number.isInteger(Number(settings.delayThreshold))) errors.delayThreshold = 'Enter a whole number of days.'
  if (Number(settings.premiumPrice) < Number(settings.standardPrice)) errors.premiumPrice = 'The target-grade price must be at least the standard price.'
  if (!target?.name?.trim()) errors.targetName = 'Name your grade target.'
  for (const metric of HARVEST_PROFILES[crop].metrics) {
    const value = target?.limits?.[metric.key]
    if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > metric.max) errors[metric.key] = `Enter a target between 0 and ${metric.max}.`
  }
  return errors
}

export function gradeEvidence(crop, target, records) {
  const metrics = HARVEST_PROFILES[crop].metrics
  const matching = (records || []).filter(record => record.crop === crop && metrics.every(metric => Number.isFinite(record[metric.key]) && record[metric.key] >= 0 && record[metric.key] <= metric.max))
  const passes = matching.filter(record => metrics.every(metric => metric.direction === 'min' ? record[metric.key] >= Number(target.limits[metric.key]) : record[metric.key] <= Number(target.limits[metric.key]))).length
  return { count: matching.length, passes, observedRate: matching.length ? passes / matching.length : null, smoothedRate: matching.length ? (passes + 1) / (matching.length + 2) : null }
}

export function adjustedWeather(days, settings, asOf) {
  return (days || []).filter(day => isDateKey(day.date) && day.date >= asOf).map(day => ({
    ...day,
    min: Number.isFinite(day.min) ? day.min + Number(settings.temperatureChange) : null,
    max: Number.isFinite(day.max) ? day.max + Number(settings.temperatureChange) : null,
    rain: Number.isFinite(day.rain) ? Math.max(0, day.rain * (1 + Number(settings.rainfallChange) / 100)) : null,
  })).sort((a, b) => a.date.localeCompare(b.date))
}

// These response curves are transparent UI fixtures, not agronomic inference.
function evaluateDate(farm, settings, target, evidence, days, harvestDate, asOf) {
  const profile = HARVEST_PROFILES[farm.crop]
  const area = fieldHectares(farm)
  const offset = daysBetween(settings.maturityDate, harvestDate)
  const maturity = clamp(1 + Math.min(0, offset) * 0.025, 0.55, 1)
  const delay = Math.max(0, offset)
  const harvestWeather = days.find(day => day.date === harvestDate)
  const exposureDays = days.filter(day => day.date <= harvestDate)
  const expectedDays = daysBetween(asOf, harvestDate) + 1
  const weatherComplete = exposureDays.length === expectedDays && exposureDays.every((day, index) => day.date === addDays(asOf, index) && [day.min, day.max, day.rain].every(Number.isFinite))
  const frostDays = exposureDays.filter(day => Number.isFinite(day.min) && day.min <= Number(settings.frostThreshold)).length
  const heatDays = exposureDays.filter(day => Number.isFinite(day.max) && day.max >= Number(settings.heatThreshold)).length
  const wetDays = exposureDays.filter(day => Number.isFinite(day.rain) && day.rain >= Number(settings.rainThreshold)).length
  const weatherLoss = clamp(frostDays * 0.035 + heatDays * 0.008 + wetDays * 0.012, 0, 0.35)
  const delayLoss = clamp(Math.max(0, delay - Number(settings.delayThreshold)) * 0.009, 0, 0.3)
  const waterStress = Math.max(0, -Number(settings.rainfallChange)) * 0.002
  const irrigationRelief = Math.min(waterStress, Number(settings.extraIrrigation) * 0.003)
  const heatStress = Math.max(0, Number(settings.temperatureChange)) * 0.012
  const wetStress = Math.max(0, Number(settings.rainfallChange) - 30) * 0.0008
  const growthFactor = clamp(1 - waterStress + irrigationRelief - heatStress - wetStress, 0.4, 1)
  const retainedYield = Number(settings.baselineYield) * growthFactor * maturity * (1 - weatherLoss) * (1 - delayLoss)
  const tonnes = retainedYield * area
  const moisture = clamp(Number(settings.grainMoisture) - offset * profile.dryingRate + (harvestWeather?.rain ?? 0) * 0.08 - Number(settings.temperatureChange) * 0.1, 4, 70)
  const moistureLimit = Number(target.limits.moisture_pct)
  const moistureExcess = Math.max(0, moisture - moistureLimit)
  const probability = evidence.smoothedRate == null ? null : clamp(evidence.smoothedRate - (1 - maturity) * 0.7 - weatherLoss * 0.65 - delayLoss * 0.5 - moistureExcess * 0.018, 0, 1)
  const expectedPrice = probability == null ? Number(settings.standardPrice) : probability * Number(settings.premiumPrice) + (1 - probability) * Number(settings.standardPrice)
  const revenue = tonnes * expectedPrice
  const costs = {
    operating: area * Number(settings.operatingCost),
    harvesting: area * Number(settings.harvestingCost),
    irrigation: area * Number(settings.extraIrrigation) * Number(settings.irrigationCost),
    drying: tonnes * moistureExcess * Number(settings.dryingCost),
    holding: area * delay * Number(settings.holdingCost),
  }
  const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
  return { date: harvestDate, maturity, delay, growthFactor, retainedYield, tonnes, moisture, probability, expectedPrice, revenue, costs, totalCost, net: revenue - totalCost, weatherLoss, delayLoss, weatherComplete, harvestWeather: harvestWeather || null, frostDays, heatDays, wetDays }
}

export function riskWarnings(days, settings, asOf) {
  const warnings = []
  const event = (type, label, threshold, key, compare, units) => {
    const crossing = days.find(day => Number.isFinite(day[key]) && compare(day[key], threshold))
    const validCount = days.filter(day => Number.isFinite(day[key])).length
    warnings.push({ type, label, state: crossing ? 'triggered' : validCount ? 'not-triggered' : 'unknown', date: crossing?.date ?? null, leadDays: crossing ? daysBetween(asOf, crossing.date) : null, exposed: crossing ? crossing.date <= settings.harvestDate : false, value: crossing?.[key] ?? null, threshold, units, detail: crossing ? `${crossing[key].toFixed(1)} ${units}; trigger ${threshold} ${units}` : validCount ? 'No trigger in the available forecast. This does not establish zero crop risk.' : 'Forecast measurements unavailable.' })
  }
  event('frost', 'Frost', Number(settings.frostThreshold), 'min', (value, threshold) => value <= threshold, '°C')
  event('heat', 'Excessive heat', Number(settings.heatThreshold), 'max', (value, threshold) => value >= threshold, '°C')
  event('rain', 'Heavy rainfall', Number(settings.rainThreshold), 'rain', (value, threshold) => value >= threshold, 'mm/day')
  const week = days.filter(day => day.date <= addDays(asOf, 6))
  const completeWeek = week.length === 7 && week.every((day, index) => day.date === addDays(asOf, index) && Number.isFinite(day.rain))
  const water = completeWeek ? week.reduce((sum, day) => sum + day.rain, 0) + Number(settings.extraIrrigation) : null
  const lowWater = completeWeek && water < Number(settings.waterThreshold)
  warnings.push({ type: 'drought', label: 'Low water / drought signal', state: completeWeek ? lowWater ? 'triggered' : 'not-triggered' : 'unknown', date: lowWater ? week.at(-1).date : null, leadDays: lowWater ? 6 : null, exposed: lowWater && settings.harvestDate >= week.at(-1).date, value: water, threshold: Number(settings.waterThreshold), units: 'mm / 7 days', detail: completeWeek ? `${water.toFixed(1)} mm of forecast rain plus added irrigation; trigger below ${settings.waterThreshold} mm. Not a drought diagnosis.` : 'A complete seven-day precipitation forecast is needed.' })
  const delay = Math.max(0, daysBetween(settings.maturityDate, settings.harvestDate))
  const late = delay > Number(settings.delayThreshold)
  const delayDate = addDays(settings.maturityDate, Number(settings.delayThreshold) + 1)
  warnings.push({ type: 'delay', label: 'Harvest delay', state: late ? 'triggered' : 'not-triggered', date: late ? delayDate : null, leadDays: late ? Math.max(0, daysBetween(asOf, delayDate)) : null, exposed: late, value: delay, threshold: Number(settings.delayThreshold), units: 'days', detail: `${delay} days after your readiness estimate; trigger above ${settings.delayThreshold} days.` })
  return warnings
}

export function calculateHarvestPlan({ farm, settings, target, records = [], weatherDays = [], asOf = dateKey() }) {
  const errors = validateHarvestSettings(settings, target, farm.crop, asOf)
  if (Object.keys(errors).length) return { errors }
  const evidence = gradeEvidence(farm.crop, target, records)
  const days = adjustedWeather(weatherDays, settings, asOf)
  const evaluate = date => evaluateDate(farm, settings, target, evidence, days, date, asOf)
  const start = settings.maturityDate > addDays(asOf, 5) ? addDays(settings.maturityDate, -5) : asOf
  const candidates = Array.from({ length: 15 }, (_, index) => addDays(start, index)).filter(date => date <= addDays(asOf, 365)).map(evaluate)
  const mature = candidates.filter(day => day.maturity >= 0.9)
  const covered = mature.filter(day => day.weatherComplete)
  const eligible = covered.length ? covered : mature
  const best = eligible.reduce((winner, day) => day.net > winner.net ? day : winner, eligible[0])
  const tolerance = Math.max(1, Math.abs(best.net)) * 0.03
  const allowed = new Set(eligible.filter(day => best.net - day.net <= tolerance).map(day => day.date))
  let first = candidates.findIndex(day => day.date === best.date), last = first
  while (last - first < 3) {
    const before = candidates[first - 1], after = candidates[last + 1]
    const canBefore = before && allowed.has(before.date), canAfter = after && allowed.has(after.date)
    if (!canBefore && !canAfter) break
    if (canBefore && (!canAfter || before.net >= after.net)) first -= 1
    else last += 1
  }
  const current = evaluate(settings.harvestDate)
  const baselineDate = settings.maturityDate < asOf ? asOf : settings.maturityDate
  const baselineSettings = { ...settings, rainfallChange: 0, temperatureChange: 0, extraIrrigation: 0, harvestDate: baselineDate }
  const baseline = evaluateDate(farm, baselineSettings, target, evidence, adjustedWeather(weatherDays, baselineSettings, asOf), baselineDate, asOf)
  return {
    errors: {}, evidence, days, candidates, current, baseline, best,
    window: { start: candidates[first].date, end: candidates[last].date, provisional: !covered.length },
    later: evaluate(addDays(best.date, 7)), warnings: riskWarnings(days, settings, asOf),
    comparisons: [current, evaluate(addDays(settings.harvestDate, 7))],
  }
}

export function createPlannerState(farm, asOf = dateKey()) {
  return { version: 1, settings: defaultHarvestSettings(farm, asOf), target: getGradeTarget(farm.crop), evidenceMode: 'sample', importedRecords: [], compareDate: addDays(asOf, 14) }
}

export function loadPlanner(farm, storage, asOf = dateKey()) {
  try {
    const saved = JSON.parse(storage.getItem(`harvest:planner:v1:${farm.id}:${farm.crop}`))
    if (saved?.version === 1 && ['sample', 'uploaded', 'none'].includes(saved.evidenceMode) && Array.isArray(saved.importedRecords) && saved.importedRecords.length <= 200 && isDateKey(saved.compareDate) && !Object.keys(validateHarvestSettings(saved.settings, saved.target, farm.crop, asOf)).length) return saved
  } catch { /* Unavailable or invalid browser storage falls back to a fresh scenario. */ }
  return createPlannerState(farm, asOf)
}
