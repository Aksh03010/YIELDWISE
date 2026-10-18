const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function formatMoney(value) {
  return Number.isFinite(value) ? currency.format(Object.is(value, -0) ? 0 : value) : 'N/A'
}
