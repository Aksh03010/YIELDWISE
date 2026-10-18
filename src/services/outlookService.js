import { CROPS, fieldHectares } from '../data/agriculture.js'

// Repeatable product fixtures. This is deliberately NOT a trained yield model.
export function createOutlook(farm, months = 12, scenario = 'typical', now = new Date()) {
  const crop = CROPS.find(c => c.id === farm.crop) || CROPS[0]
  const locationFactor = 1 + Math.sin(Number(farm.latitude) * 0.1 + Number(farm.longitude) * 0.04) * 0.08
  const irrigationFactor = farm.irrigation === 'Rainfed' ? 1 : 1.08
  const scenarioFactor = { dry: 0.82, typical: 1, wet: 1.06 }[scenario] ?? 1
  const estimatedYield = Number((crop.base * locationFactor * irrigationFactor * scenarioFactor).toFixed(2))
  const spread = { 1: 0.09, 6: 0.18, 12: 0.29 }[months] ?? 0.29
  const target = new Date(now)
  const originalDay = target.getDate()
  target.setDate(1)
  target.setMonth(target.getMonth() + months)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(originalDay, lastDay))
  const history = [-0.13, -0.06, -0.19, 0.025, -0.045].map((change, index) => ({
    year: String(now.getFullYear() - 5 + index),
    historical: Number((crop.base * locationFactor * (1 + change)).toFixed(2)),
  }))
  const previousYield = history.at(-1).historical
  return {
    crop, months, estimatedYield, previousYield, history,
    low: estimatedYield * (1 - spread), high: estimatedYield * (1 + spread),
    totalProduction: estimatedYield * fieldHectares(farm),
    change: (estimatedYield / previousYield - 1) * 100,
    targetLabel: target.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' }),
    source: 'illustrative',
  }
}

export function calculateBalance(inputs) {
  const keys = ['openingStocks', 'production', 'imports', 'domesticUse', 'exports', 'populationGrowth', 'productionChange', 'basePrice', 'elasticity']
  if (keys.some(key => inputs[key] === '' || inputs[key] == null || !Number.isFinite(Number(inputs[key])))) throw new Error('Enter a number in every assumption.')
  const v = Object.fromEntries(keys.map(key => [key, Number(inputs[key])]))
  if (['openingStocks', 'production', 'imports', 'exports'].some(key => v[key] < 0) || v.domesticUse <= 0 || v.basePrice <= 0 || v.elasticity < 0 || v.populationGrowth <= -100 || v.productionChange < -100) {
    throw new Error('Volumes must be non-negative; use and price must be positive. Growth must exceed −100%.')
  }
  const production = v.production * (1 + v.productionChange / 100)
  const demand = v.domesticUse * (1 + v.populationGrowth / 100)
  const supply = v.openingStocks + production + v.imports
  const use = demand + v.exports
  const endingStocks = supply - use
  const previousEnding = v.openingStocks + v.production + v.imports - v.domesticUse - v.exports
  const previousRatio = previousEnding / (v.domesticUse + v.exports)
  const ratio = endingStocks / use
  // Linear sensitivity around the baseline, not a calibrated price model.
  const price = Math.max(0, v.basePrice * (1 - v.elasticity * (ratio - previousRatio)))
  return { production, demand, supply, use, endingStocks, previousEnding, ratio, price, priceChange: (price / v.basePrice - 1) * 100 }
}
export const DEFAULT_BALANCE = { openingStocks: 25, production: 100, imports: 8, domesticUse: 70, exports: 35, populationGrowth: 1.2, productionChange: 4, basePrice: 240, elasticity: 1.5 }
