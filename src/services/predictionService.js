/**
 * YIELD Platform — Mock Prediction Service
 * 
 * This module provides demonstration prediction data.
 * It is designed to be replaced by a real API call to a trained ML model.
 * 
 * The service accepts farm inputs and returns a simulated prediction result.
 * All returned values are clearly marked as demonstration data.
 */

const CROP_YIELD_RANGES = {
  maize: { base: 4.2, low: 2.8, high: 6.5 },
  wheat: { base: 3.1, low: 2.0, high: 4.8 },
  rice: { base: 4.5, low: 3.0, high: 6.8 },
  sorghum: { base: 2.3, low: 1.5, high: 3.8 },
  barley: { base: 2.8, low: 1.8, high: 4.2 },
  millet: { base: 1.2, low: 0.7, high: 2.0 },
  soybeans: { base: 2.5, low: 1.6, high: 3.5 },
  groundnut: { base: 1.8, low: 1.0, high: 2.8 },
  chickpea: { base: 1.1, low: 0.6, high: 1.8 },
  lentil: { base: 1.3, low: 0.8, high: 2.0 },
  potato: { base: 20.0, low: 14.0, high: 30.0 },
  cassava: { base: 12.5, low: 8.0, high: 20.0 },
  sweetpotato: { base: 10.0, low: 6.5, high: 16.0 },
  cotton: { base: 1.8, low: 1.0, high: 2.8 },
  sugarcane: { base: 65.0, low: 45.0, high: 90.0 },
  sunflower: { base: 1.7, low: 1.0, high: 2.5 },
  tomato: { base: 35.0, low: 22.0, high: 50.0 },
  onion: { base: 18.0, low: 12.0, high: 28.0 },
  cabbage: { base: 25.0, low: 16.0, high: 38.0 },
}

function generateMonthlyClimate() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map((month, i) => {
    const seasonFactor = Math.sin(((i - 1) / 12) * Math.PI * 2)
    return {
      month,
      avgTemp: Math.round((22 + seasonFactor * 10) * 10) / 10,
      rainfall: Math.round(Math.max(10, 80 + seasonFactor * 60 + Math.random() * 30)),
      humidity: Math.round(55 + seasonFactor * 15 + Math.random() * 10),
    }
  })
}

function generateHistoricalYields(crop, years = 8) {
  const range = CROP_YIELD_RANGES[crop] || CROP_YIELD_RANGES.maize
  const currentYear = new Date().getFullYear()
  const yields = []
  for (let i = years; i > 0; i--) {
    const variation = (Math.random() - 0.5) * (range.high - range.low) * 0.4
    yields.push({
      year: currentYear - i,
      yield: Math.round((range.base + variation) * 10) / 10,
      source: 'demonstration',
    })
  }
  return yields
}

function generateFactors() {
  return [
    {
      name: 'Temperature',
      description: 'Average temperature during the growing season directly affects crop development rate and yield potential.',
      impact: 'high',
      relativeWeight: 85,
      icon: 'thermometer',
    },
    {
      name: 'Rainfall & Water',
      description: 'Total rainfall and water availability during critical growth stages strongly influence crop productivity.',
      impact: 'high',
      relativeWeight: 80,
      icon: 'droplets',
    },
    {
      name: 'Soil Properties',
      description: 'Soil type, pH, organic matter, and nutrient content affect nutrient availability and root development.',
      impact: 'high',
      relativeWeight: 72,
      icon: 'mountain',
    },
    {
      name: 'Seed Variety',
      description: 'Genetic potential of the seed variety determines the maximum achievable yield under optimal conditions.',
      impact: 'medium',
      relativeWeight: 65,
      icon: 'sprout',
    },
    {
      name: 'Historical Yields',
      description: 'Regional historical yield data provides a baseline for expected productivity under local conditions.',
      impact: 'medium',
      relativeWeight: 58,
      icon: 'trendingUp',
    },
    {
      name: 'Elevation & Terrain',
      description: 'Elevation affects temperature, sunlight exposure, and growing season length.',
      impact: 'low',
      relativeWeight: 40,
      icon: 'mountain',
    },
  ]
}

/**
 * Generate a mock prediction result based on farm inputs.
 * 
 * @param {import('./types').FarmInput} inputs
 * @returns {Promise<import('./types').PredictionResult>}
 */
export async function getPrediction(inputs) {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 1200))

  const cropId = inputs.crop.crop
  const range = CROP_YIELD_RANGES[cropId] || CROP_YIELD_RANGES.maize

  // Generate a plausible yield based on the crop's typical range
  const irrigationBonus = inputs.field.irrigationMethod && !inputs.field.irrigationMethod.includes('Rainfed') ? 0.15 : 0
  const baseYield = range.base * (1 + irrigationBonus)
  const estimatedYield = Math.round(baseYield * 100) / 100
  const yieldLow = Math.round(range.low * 100) / 100
  const yieldHigh = Math.round(range.high * 100) / 100

  const fieldAreaHa = inputs.field.fieldArea
    ? inputs.field.areaUnit === 'acres'
      ? inputs.field.fieldArea * 0.4047
      : inputs.field.fieldArea
    : null

  const monthlyClimate = generateMonthlyClimate()

  return {
    id: `demo-${Date.now()}`,
    crop: inputs.crop.cropName || inputs.crop.crop,
    variety: inputs.crop.variety,
    location: inputs.location,
    estimatedYield,
    yieldLow,
    yieldHigh,
    fieldArea: fieldAreaHa ? Math.round(fieldAreaHa * 10) / 10 : null,
    totalProduction: fieldAreaHa ? Math.round(estimatedYield * fieldAreaHa * 10) / 10 : null,
    growingSeason: inputs.crop.plantingSeason || 'Not specified',
    unit: 't/ha',
    dataSource: 'demonstration',
    generatedAt: new Date().toISOString(),
    environmental: {
      temperature: {
        avgGrowingSeason: 24.3,
        avgMin: 16.8,
        avgMax: 31.5,
        source: 'demonstration',
      },
      rainfall: {
        annualTotal: 850,
        growingSeasonTotal: 520,
        source: 'demonstration',
      },
      soil: {
        type: inputs.field.soilType || 'Loam',
        pH: 6.4,
        organicMatter: 'Moderate (2.1%)',
        texture: 'Medium',
        drainage: 'Well-drained',
        source: 'demonstration',
      },
      elevation: 435,
      terrain: 'Gently undulating',
      soilMoisture: 42,
      monthlyClimate,
    },
    factors: generateFactors(cropId),
    historicalYields: generateHistoricalYields(cropId),
  }
}

/**
 * Generate a demo prediction for exploring the interface without real inputs.
 * @returns {Promise<import('./types').PredictionResult>}
 */
export async function getDemoPrediction() {
  const demoInputs = {
    location: {
      country: 'Kenya',
      region: 'Rift Valley',
      city: 'Nakuru',
      latitude: -0.3031,
      longitude: 36.0800,
    },
    crop: {
      category: 'cereals',
      crop: 'maize',
      cropName: 'Maize (Corn)',
      variety: 'Pioneer P1197',
      plantingSeason: 'Spring (Mar–May)',
      plantingDate: '',
    },
    field: {
      fieldArea: 50,
      areaUnit: 'hectares',
      irrigationMethod: 'Rainfed (no irrigation)',
      farmingMethod: 'Conservation tillage',
      soilType: 'Loam',
    },
  }
  return getPrediction(demoInputs)
}
