import test from 'node:test'
import assert from 'node:assert/strict'
import { startVisiblePolling } from '../src/services/visiblePolling.js'

function harness(initialVisibility = 'visible') {
  const callbacks = new Map(), listeners = new Set()
  let nextId = 0
  const visibility = {
    visibilityState: initialVisibility,
    addEventListener: (_, callback) => listeners.add(callback),
    removeEventListener: (_, callback) => listeners.delete(callback),
  }
  const timers = {
    setInterval(callback, interval) { assert.equal(interval, 60000); callbacks.set(++nextId, callback); return nextId },
    clearInterval(id) { callbacks.delete(id) },
  }
  return {
    callbacks, listeners, visibility, timers,
    change(value) { visibility.visibilityState = value; for (const callback of listeners) callback() },
    minute() { for (const callback of callbacks.values()) callback() },
  }
}

test('continuous checks pause in background, resume immediately, and clean up on unmount', () => {
  const env = harness()
  let requests = 0
  const stop = startVisiblePolling(() => requests++, 60000, env.visibility, env.timers)
  env.minute()
  assert.equal(requests, 1)
  env.change('hidden')
  env.minute()
  assert.equal(requests, 1)
  assert.equal(env.callbacks.size, 0)
  env.change('visible')
  assert.equal(requests, 2)
  env.minute()
  assert.equal(requests, 3)
  stop()
  assert.equal(env.listeners.size, 0)
  env.change('visible')
  env.minute()
  assert.equal(requests, 3)
})

test('paused checks create no timers or visibility listeners', () => {
  const env = harness()
  const stop = startVisiblePolling(() => assert.fail('Paused polling ran'), 0, env.visibility, env.timers)
  env.minute()
  env.change('visible')
  assert.equal(env.callbacks.size, 0)
  assert.equal(env.listeners.size, 0)
  stop()
})

test('a background page waits until visible before starting its interval', () => {
  const env = harness('hidden')
  let requests = 0
  const stop = startVisiblePolling(() => requests++, 60000, env.visibility, env.timers)
  assert.equal(env.callbacks.size, 0)
  env.minute()
  assert.equal(requests, 0)
  env.change('visible')
  assert.equal(requests, 1)
  assert.equal(env.callbacks.size, 1)
  stop()
})
