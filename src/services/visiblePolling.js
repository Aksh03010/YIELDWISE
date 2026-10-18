// Suspend scheduled requests in background tabs and check immediately on return.
export function startVisiblePolling(callback, intervalMs, visibility = document, timers = globalThis) {
  if (!intervalMs) return () => {}
  let timer
  function schedule() {
    if (timer !== undefined) timers.clearInterval(timer)
    timer = undefined
    if (visibility.visibilityState === 'visible') timer = timers.setInterval(callback, intervalMs)
  }
  function onVisibilityChange() {
    schedule()
    if (visibility.visibilityState === 'visible') callback()
  }
  schedule()
  visibility.addEventListener('visibilitychange', onVisibilityChange)
  return () => {
    if (timer !== undefined) timers.clearInterval(timer)
    visibility.removeEventListener('visibilitychange', onVisibilityChange)
  }
}
