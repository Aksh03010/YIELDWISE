export function calculateEconomics(input) {
  const values = {}, errors = {}
  let missing = false
  for (const key of ['quantity', 'saleable', 'price', 'cost']) {
    const raw = input[key]
    if (raw === '' || raw == null) { missing = true; continue }
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0 || (key === 'saleable' && value > 100)) {
      errors[key] = key === 'saleable' ? 'Use a percentage from 0 to 100.' : 'Use a finite amount of zero or more.'
    } else values[key] = value
  }
  if (missing || Object.keys(errors).length) return { result: null, errors }
  const saleableQuantity = values.quantity * values.saleable / 100
  const gross = saleableQuantity * values.price
  const net = gross - values.cost
  if (![saleableQuantity, gross, net].every(Number.isFinite)) return { result: null, errors: { quantity: 'These amounts are too large to calculate.' } }
  return { result: { saleableQuantity, gross, net }, errors }
}

export function compareMeasurement(measured, threshold, direction) {
  if (measured === '' || threshold === '' || measured == null || threshold == null) return null
  const value = Number(measured), target = Number(threshold)
  if (![value, target].every(Number.isFinite) || value < 0 || target < 0 || !['min', 'max'].includes(direction)) return null
  return direction === 'min' ? value >= target : value <= target
}
