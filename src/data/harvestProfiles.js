// Editable research targets, NOT official grades or buyer specifications.
export const HARVEST_PROFILES = {
  wheat: {
    label: 'Custom wheat premium target', grainMoisture: 17, dryingRate: 0.45, operatingCost: 420, harvestingCost: 95,
    metrics: [
      { key: 'protein_pct', label: 'Protein', unit: '%', direction: 'min', threshold: 12.5, sample: 13.4, max: 100 },
      { key: 'moisture_pct', label: 'Grain moisture', unit: '%', direction: 'max', threshold: 14, sample: 13.1, max: 100 },
      { key: 'test_weight_kg_hl', label: 'Test weight', unit: 'kg/hL', direction: 'min', threshold: 75, sample: 77, max: 150 },
    ],
  },
  corn: {
    label: 'Custom corn market target', grainMoisture: 25, dryingRate: 0.6, operatingCost: 850, harvestingCost: 150,
    metrics: [
      { key: 'moisture_pct', label: 'Grain moisture', unit: '%', direction: 'max', threshold: 15.5, sample: 14.4, max: 100 },
      { key: 'test_weight_kg_hl', label: 'Test weight', unit: 'kg/hL', direction: 'min', threshold: 70, sample: 72, max: 150 },
      { key: 'damage_pct', label: 'Damaged kernels', unit: '%', direction: 'max', threshold: 3, sample: 1.8, max: 100 },
    ],
  },
  soybeans: {
    label: 'Custom soybean market target', grainMoisture: 15, dryingRate: 0.35, operatingCost: 520, harvestingCost: 105,
    metrics: [
      { key: 'protein_pct', label: 'Protein', unit: '%', direction: 'min', threshold: 34, sample: 35.8, max: 100 },
      { key: 'moisture_pct', label: 'Grain moisture', unit: '%', direction: 'max', threshold: 13, sample: 12.2, max: 100 },
      { key: 'damage_pct', label: 'Damaged seed', unit: '%', direction: 'max', threshold: 2, sample: 1, max: 100 },
    ],
  },
  canola: {
    label: 'Custom canola market target', grainMoisture: 12, dryingRate: 0.3, operatingCost: 520, harvestingCost: 110,
    metrics: [
      { key: 'oil_pct', label: 'Oil content', unit: '%', direction: 'min', threshold: 42, sample: 43.3, max: 100 },
      { key: 'moisture_pct', label: 'Seed moisture', unit: '%', direction: 'max', threshold: 10, sample: 9.1, max: 100 },
      { key: 'damage_pct', label: 'Damaged seed', unit: '%', direction: 'max', threshold: 2, sample: 0.8, max: 100 },
    ],
  },
  barley: {
    label: 'Custom malting barley target', grainMoisture: 16, dryingRate: 0.4, operatingCost: 380, harvestingCost: 95,
    metrics: [
      { key: 'protein_pct', label: 'Protein', unit: '%', direction: 'max', threshold: 12.5, sample: 11.8, max: 100 },
      { key: 'moisture_pct', label: 'Grain moisture', unit: '%', direction: 'max', threshold: 13.5, sample: 12.5, max: 100 },
      { key: 'germination_pct', label: 'Germination', unit: '%', direction: 'min', threshold: 95, sample: 97, max: 100 },
    ],
  },
}

export function getGradeTarget(crop) {
  const profile = HARVEST_PROFILES[crop]
  return { name: profile.label, limits: Object.fromEntries(profile.metrics.map(metric => [metric.key, metric.threshold])) }
}

export function getSampleGradeRecords(crop) {
  const profile = HARVEST_PROFILES[crop]
  // Fixed examples make it possible to inspect why a record passes or fails.
  return Array.from({ length: 16 }, (_, index) => Object.fromEntries([
    ['crop', crop],
    ...profile.metrics.map((metric, column) => {
      const variation = (((index * (column + 3)) % 9) - 4) * 0.22
      const adverse = index % 5 === 0 && column === index % 3
      const value = adverse ? metric.threshold + (metric.direction === 'min' ? -1.2 : 1.2) : metric.sample + variation
      return [metric.key, Number(Math.max(0, Math.min(metric.max, value)).toFixed(2))]
    }),
  ]))
}
