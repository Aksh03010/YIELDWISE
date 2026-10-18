// A short animation shared by page titles and financial results.
export function animateValue({ from, to, duration = 650, linear = false, onUpdate, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }) {
  let started = null
  let stopped = false
  let frame
  function tick(time) {
    if (stopped) return
    started ??= time
    const progress = duration <= 0 ? 1 : Math.min(1, Math.max(0, (time - started) / duration))
    const eased = linear ? progress : 1 - (1 - progress) ** 3
    onUpdate(progress === 1 ? to : from + (to - from) * eased)
    if (progress < 1 && !stopped) frame = requestFrame(tick)
  }
  frame = requestFrame(tick)
  return () => { stopped = true; cancelFrame(frame) }
}
