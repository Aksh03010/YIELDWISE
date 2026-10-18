import { HARVEST_PROFILES } from '../data/harvestProfiles.js'

export function parseGradingCsv(text, crop) {
  if (text.length > 200000) throw new Error('Use a CSV file smaller than 200 KB.')
  const rows = [], row = []
  let field = '', quoted = false
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  for (let index = 0; index <= input.length; index += 1) {
    const char = input[index]
    if (char === '"') {
      if (quoted && input[index + 1] === '"') { field += '"'; index += 1 }
      else quoted = !quoted
    } else if (!quoted && (char === ',' || char === '\n' || char === undefined)) {
      row.push(field.trim()); field = ''
      if (char !== ',') { if (row.some(value => value !== '')) rows.push([...row]); row.length = 0 }
    } else if (char !== undefined) field += char
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.')
  if (rows.length < 2 || rows.length > 201) throw new Error('Include a header and between 1 and 200 grading records.')
  const header = rows.shift().map(key => key.toLowerCase())
  if (new Set(header).size !== header.length) throw new Error('CSV column names must be unique.')
  const metrics = HARVEST_PROFILES[crop].metrics
  for (const key of ['crop', ...metrics.map(metric => metric.key)]) if (!header.includes(key)) throw new Error(`Missing CSV column: ${key}. Download the example for this crop.`)
  return rows.map((values, index) => {
    if (values.length !== header.length) throw new Error(`Row ${index + 2} has the wrong number of columns.`)
    const record = Object.fromEntries(header.map((key, column) => [key, values[column]]))
    if (record.crop.toLowerCase() !== crop) throw new Error(`Row ${index + 2}: records must match the selected crop (${crop}).`)
    const result = { crop }
    for (const metric of metrics) {
      const value = Number(record[metric.key])
      if (record[metric.key] === '' || !Number.isFinite(value) || value < 0 || value > metric.max) throw new Error(`Row ${index + 2}: invalid ${metric.key}.`)
      result[metric.key] = value
    }
    return result
  })
}

export function gradingCsv(crop, records) {
  const keys = ['crop', ...HARVEST_PROFILES[crop].metrics.map(metric => metric.key)]
  return [keys.join(','), ...records.map(record => keys.map(key => record[key]).join(','))].join('\r\n')
}

export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
