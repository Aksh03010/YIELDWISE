const DAY_MS = 86400000

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export function dayOfYear(value) {
  const date = parseDate(value)
  return date ? Math.round((date - new Date(`${value.slice(0, 4)}-01-01T00:00:00Z`)) / DAY_MS) + 1 : null
}

export function dateFromDayOfYear(year, day) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || !Number.isInteger(day) || day < 1 || day > 366) return ''
  const first = parseDate(`${year}-01-01`)
  const date = new Date(first.getTime() + (day - 1) * DAY_MS)
  return date.getUTCFullYear() === year ? date.toISOString().slice(0, 10) : ''
}

export function calculateHarvestTiming(plantingDate, days, mae) {
  const planting = parseDate(plantingDate)
  if (!planting || !Number.isFinite(days) || days < 0 || !Number.isFinite(mae) || mae < 0) return null
  const duration = Math.round(days), errorDays = Math.ceil(mae)
  function add(count) {
    const date = new Date(planting.getTime() + count * DAY_MS)
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null
  }
  const center = add(duration), start = add(Math.max(0, duration - errorDays)), end = add(duration + errorDays)
  return center && start && end ? { center, start, end, days: duration, errorDays } : null
}

export function formatHarvestDate(value) {
  const date = parseDate(value)
  return date ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date) : 'Set planting date'
}
