import test from 'node:test'
import assert from 'node:assert/strict'
import { animateValue } from '../src/lib/animateValue.js'
import { formatMoney } from '../src/lib/formatMoney.js'
import { watchVisibility } from '../src/lib/watchVisibility.js'

function frameClock() {
  let next = 0
  const callbacks = new Map()
  return {
    requestFrame(callback) { const id = ++next; callbacks.set(id, callback); return id },
    cancelFrame(id) { callbacks.delete(id) },
    step(time) { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(time)) },
    pending: () => callbacks.size,
  }
}

test('currency counts reach the exact amount quickly without overshooting, including losses and zero', () => {
  for (const [from, to] of [[1, 100], [-1, -5500], [150, 0]]) {
    const clock = frameClock(), values = []
    animateValue({ from, to, duration: 650, onUpdate: value => values.push(value), ...clock })
    for (const time of [0, 130, 260, 390, 520, 650, 800]) clock.step(time)
    assert.equal(values[0], from)
    assert.equal(values.at(-1), to)
    assert.ok(values.slice(1, -1).every(value => value > Math.min(from, to) && value < Math.max(from, to)))
    assert.ok(values.slice(1).every((value, index) => to >= from ? value >= values[index] : value <= values[index]))
    assert.equal(clock.pending(), 0)
  }
})

test('changing a money target cancels the previous animation and continues from its current amount', () => {
  const clock = frameClock(), values = []
  const stop = animateValue({ from: 1, to: 100, onUpdate: value => values.push(value), ...clock })
  clock.step(0); clock.step(250)
  const current = values.at(-1)
  stop()
  clock.step(650)
  assert.equal(values.at(-1), current)
  animateValue({ from: current, to: 40, onUpdate: value => values.push(value), ...clock })
  clock.step(1000)
  assert.equal(values.at(-1), current)
  clock.step(1650)
  assert.equal(values.at(-1), 40)
  assert.equal(clock.pending(), 0)
})

test('typing progresses in character order and cancelled titles cannot continue after navigation', () => {
  const clock = frameClock(), text = 'Harvest planning', lengths = []
  const stop = animateValue({ from: 0, to: text.length, duration: 800, linear: true, onUpdate: value => lengths.push(Math.floor(value)), ...clock })
  clock.step(0); clock.step(400)
  assert.equal(lengths[0], 0)
  assert.equal(text.slice(0, lengths.at(-1)), 'Harvest ')
  stop(); clock.step(800)
  assert.equal(lengths.at(-1), 8)
  assert.equal(clock.pending(), 0)
})

test('money formatting retains losses and handles missing or zero values', () => {
  assert.equal(formatMoney(-1234), '-$1,234')
  assert.equal(formatMoney(0), '$0')
  assert.equal(formatMoney(-0), '$0')
  for (const value of [null, undefined, NaN, Infinity]) assert.equal(formatMoney(value), 'N/A')
})

test('money visibility waits for a visible amount, follows scrolling and ignores callbacks after cleanup', () => {
  const element = {}, states = []
  let observer
  class Observer {
    constructor(callback, options) { this.callback = callback; this.options = options; observer = this }
    observe(target) { this.target = target }
    disconnect() { this.disconnected = true }
    emit(isIntersecting, intersectionRatio) { this.callback([{ target: this.target, isIntersecting, intersectionRatio }]) }
  }
  const stop = watchVisibility(element, visible => states.push(visible), { Observer })
  assert.equal(observer.target, element)
  assert.deepEqual(observer.options.threshold, [0, 0.2])
  assert.deepEqual(states, [], 'Mounting offscreen must not start a count')
  observer.emit(false, 0)
  observer.emit(true, 0.1)
  observer.emit(true, 0.25)
  observer.emit(false, 0)
  observer.emit(true, 1)
  assert.deepEqual(states, [false, false, true, false, true])
  observer.callback([{ target: element, isIntersecting: false, intersectionRatio: 0 }, { target: element, isIntersecting: true, intersectionRatio: 1 }])
  assert.equal(states.at(-1), true, 'Rapid scroll batches must use the latest visibility')
  stop()
  assert.ok(observer.disconnected)
  observer.emit(true, 1)
  assert.equal(states.length, 6, 'Unmounted amounts must ignore queued observer callbacks')
})

test('browsers without IntersectionObserver show amounts on the next frame and cancel safely', () => {
  const element = {}, states = [], clock = frameClock()
  const stop = watchVisibility(element, visible => states.push(visible), { Observer: null, ...clock })
  assert.deepEqual(states, [])
  clock.step(0)
  assert.deepEqual(states, [true])
  stop()
  const cancel = watchVisibility(element, visible => states.push(visible), { Observer: null, ...clock })
  cancel(); clock.step(10)
  assert.deepEqual(states, [true])
  assert.equal(clock.pending(), 0)
})
