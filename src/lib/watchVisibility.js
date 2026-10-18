// Track the amount itself so closed details and offscreen tables wait to animate.
export function watchVisibility(element, onChange, { Observer = globalThis.IntersectionObserver, requestFrame = globalThis.requestAnimationFrame, cancelFrame = globalThis.cancelAnimationFrame } = {}) {
  if (!element) return () => {}
  let active = true
  if (typeof Observer !== 'function') {
    const frame = requestFrame(() => { if (active) onChange(true) })
    return () => { active = false; cancelFrame(frame) }
  }
  const observer = new Observer(entries => {
    if (!active) return
    const entry = entries.filter(item => item.target === element).at(-1)
    if (entry) onChange(entry.isIntersecting && entry.intersectionRatio >= 0.2)
  }, { threshold: [0, 0.2], rootMargin: '0px 0px -12px 0px' })
  observer.observe(element)
  return () => { active = false; observer.disconnect() }
}
