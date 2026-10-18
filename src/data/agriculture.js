export const CROPS = [
  { id: 'wheat', name: 'Wheat', variety: 'Hard red spring', base: 3.8, color: '#b6a15e', price: 240 },
  { id: 'corn', name: 'Corn', variety: 'Grain corn', base: 10.2, color: '#d4b754', price: 185 },
  { id: 'soybeans', name: 'Soybeans', variety: 'Commodity soybean', base: 3.1, color: '#78926e', price: 410 },
  { id: 'canola', name: 'Canola', variety: 'Spring canola', base: 2.4, color: '#d5c661', price: 470 },
  { id: 'barley', name: 'Barley', variety: 'Feed barley', base: 4.3, color: '#ac9875', price: 205 },
]

// Product fixtures, not official agricultural statistics or market quotes.
export const FARMS = [
  { id: 'prairie', name: 'Prairie View Farm', country: 'Canada', region: 'Saskatchewan', locality: 'Regina', latitude: 50.4452, longitude: -104.6189, crop: 'wheat', variety: 'Hard red spring', area: 160, areaUnit: 'ha', soil: 'Loam', irrigation: 'Rainfed', plantingDate: '', sample: true },
  { id: 'plains', name: 'Great Plains Farm', country: 'United States', region: 'Kansas', locality: 'Wichita', latitude: 37.6872, longitude: -97.3301, crop: 'wheat', variety: 'Hard red winter', area: 320, areaUnit: 'ac', soil: 'Clay loam', irrigation: 'Rainfed', plantingDate: '', sample: true },
  { id: 'sonora', name: 'Valle del Yaqui', country: 'Mexico', region: 'Sonora', locality: 'Ciudad Obregón', latitude: 27.4864, longitude: -109.9408, crop: 'wheat', variety: 'Durum', area: 100, areaUnit: 'ha', soil: 'Clay loam', irrigation: 'Surface irrigation', plantingDate: '', sample: true },
]
export const COUNTRIES = ['Canada', 'United States', 'Mexico']
export const HORIZONS = [1, 6, 12]
export const AREA_TO_HA = 0.40468564224
export const fieldHectares = farm => Number(farm.area) * (farm.areaUnit === 'ac' ? AREA_TO_HA : 1)
export const formatNumber = (value, digits = 1) => Number.isFinite(value)
  ? new Intl.NumberFormat('en-CA', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
  : '—'

export function validateFarm(farm) {
  const errors = {}
  if (!farm.name?.trim()) errors.name = 'Give your field a name.'
  if (!COUNTRIES.includes(farm.country)) errors.country = 'Choose a supported country.'
  if (!farm.region?.trim()) errors.region = 'Enter your state or province.'
  if (!CROPS.some(c => c.id === farm.crop)) errors.crop = 'Choose a crop.'
  if (!Number.isFinite(Number(farm.area)) || Number(farm.area) <= 0) errors.area = 'Enter an area greater than zero.'
  const lat = Number(farm.latitude), lon = Number(farm.longitude)
  if (farm.latitude === '' || !Number.isFinite(lat) || lat < 14 || lat > 84) errors.latitude = 'Use a latitude between 14° and 84° N.'
  if (farm.longitude === '' || !Number.isFinite(lon) || lon < -180 || lon > -50) errors.longitude = 'Use a longitude between 180° and 50° W.'
  return errors
}
export function loadFarm(storage) {
  try {
    const saved = JSON.parse(storage.getItem('harvest:field:v2'))
    if (saved && Object.keys(validateFarm(saved)).length === 0 && ['ha', 'ac'].includes(saved.areaUnit)) return saved
  } catch { /* An unavailable or outdated cache should not prevent opening the app. */ }
  return { ...FARMS[0] }
}
