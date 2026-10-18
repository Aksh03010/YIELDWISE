import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEconomics, compareMeasurement } from '../src/services/planningCalculator.js'

test('returns use only explicit quantities, saleable fractions, prices and expenses', () => {
  const a = { quantity: '100', saleable: '90', price: '250', cost: '10000' }
  assert.deepEqual(calculateEconomics(a).result, { saleableQuantity: 90, gross: 22500, net: 12500 })
  assert.deepEqual(calculateEconomics({ ...a, date: '2026-11-20' }), calculateEconomics(a))
  const b = calculateEconomics({ quantity: 110, saleable: 85, price: 240, cost: 10500 }).result
  assert.equal(b.net - calculateEconomics(a).result.net, -560)
})

test('missing and invalid assumptions never create a sample return', () => {
  assert.equal(calculateEconomics({}).result, null)
  for (const patch of [{ quantity: -1 }, { saleable: 101 }, { price: Infinity }, { cost: 'wrong' }, { quantity: 1e308, price: 1e308 }]) {
    const calculation = calculateEconomics({ quantity: 100, saleable: 90, price: 250, cost: 10000, ...patch })
    assert.equal(calculation.result, null)
    assert.ok(Object.keys(calculation.errors).length)
  }
  assert.equal(calculateEconomics({ quantity: 0, saleable: 0, price: 0, cost: 100 }).result.net, -100)
})

test('measured-factor checks honor threshold direction and keep missing evidence unknown', () => {
  assert.equal(compareMeasurement(13, 13, 'max'), true)
  assert.equal(compareMeasurement(14, 13, 'max'), false)
  assert.equal(compareMeasurement(14, 13, 'min'), true)
  for (const input of ['', undefined, -1, Infinity, 'bad']) assert.equal(compareMeasurement(input, 13, 'max'), null)
})
