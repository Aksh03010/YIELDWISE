import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const preference = window.matchMedia(QUERY)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function getSnapshot() {
  return typeof window.matchMedia !== 'function' || window.matchMedia(QUERY).matches
}

// Static/server renders remain still until the browser preference is known.
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
