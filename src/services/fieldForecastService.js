export function buildFieldRequest(crop, field) {
  const latitude = Number(field.latitude), longitude = Number(field.longitude), area = Number(field.areaHa)
  if (field.latitude === '' || field.longitude === '' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < 14 || latitude > 75 || longitude < -170 || longitude > -50) throw new Error('Enter maize-model coordinates between 14–75° N and 170–50° W.')
  if (!Number.isFinite(area) || area <= 0) throw new Error('Enter a field area greater than zero.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(field.plantingDate)) throw new Error('Enter the actual planting date. The model needs its first 31 days of weather.')
  return { crop, latitude, longitude, area_ha: area, planting_date: field.plantingDate, research_only: true }
}

export async function fetchFieldForecast(payload, signal) {
  const response = await fetch('/api/field-forecast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal })
  if (response.status === 404) throw new Error('The running backend needs a restart to load location-based predictions.')
  const data = await response.json()
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'The field inputs could not be accepted.')
  if (data.location_driven !== true || data.research_only !== true || data.crop !== payload.crop || !Array.isArray(data.predictions) || !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude) || Math.abs(data.latitude - payload.latitude) > 0.00011 || Math.abs(data.longitude - payload.longitude) > 0.00011 || data.area_ha !== payload.area_ha || data.source?.days !== 31 || data.planting_date !== payload.planting_date) throw new Error('The backend returned a result for different or incomplete field inputs.')
  return data
}
