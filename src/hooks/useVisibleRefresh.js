import { useEffect, useState } from 'react'
import { startVisiblePolling } from '../services/visiblePolling.js'

export function useVisibleRefresh(intervalMs) {
  const [tick, setTick] = useState(0)
  useEffect(() => startVisiblePolling(() => setTick(value => value + 1), intervalMs), [intervalMs])
  return tick
}
