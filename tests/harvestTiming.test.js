import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateHarvestTiming, dayOfYear, dateFromDayOfYear } from '../src/services/harvestTiming.js'

test('harvest timing converts model days and typical error into reproducible calendar dates', () => {
  assert.deepEqual(calculateHarvestTiming('2021-05-22', 184.43054, 10.5667), {
    center: '2021-11-22', start: '2021-11-11', end: '2021-12-03', days: 184, errorDays: 11,
  })
})
test('calendar arithmetic survives leap days, year boundaries and daylight saving changes', () => {
  assert.equal(calculateHarvestTiming('2024-02-28', 2, 0).center, '2024-03-01')
  assert.equal(calculateHarvestTiming('2026-12-30', 3, 1).center, '2027-01-02')
  assert.equal(calculateHarvestTiming('2026-03-07', 3, 0).center, '2026-03-10')
  assert.equal(dayOfYear('2024-02-29'), 60)
  assert.equal(dateFromDayOfYear(2013, 145), '2013-05-25')
  assert.equal(dateFromDayOfYear(2023, 366), '')
})
test('missing dates, missing model outputs and invalid calendar dates never create a window', () => {
  for (const date of ['', '2026-02-30', 'bad']) assert.equal(calculateHarvestTiming(date, 184, 11), null)
  for (const value of [undefined, null, -1, Infinity]) assert.equal(calculateHarvestTiming('2021-05-22', value, 11), null)
  assert.equal(calculateHarvestTiming('2021-05-22', 184, undefined), null)
})
