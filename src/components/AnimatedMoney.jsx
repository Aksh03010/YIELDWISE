import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { animateValue } from '../lib/animateValue.js'
import { formatMoney } from '../lib/formatMoney.js'
import { watchVisibility } from '../lib/watchVisibility.js'

export default function AnimatedMoney({ value }) {
  const reducedMotion = useReducedMotion()
  const [displayed, setDisplayed] = useState(() => Number.isFinite(value) ? Math.sign(value) * Math.min(1, Math.abs(value)) : 0)
  const [visible, setVisible] = useState(false)
  const element = useRef(null)
  const current = useRef(displayed)
  useEffect(() => watchVisibility(element.current, setVisible), [])
  useEffect(() => {
    if (!Number.isFinite(value)) return
    if (reducedMotion) { current.current = value; return }
    if (!visible) return
    return animateValue({ from: current.current, to: value, duration: current.current === value ? 0 : 650, onUpdate: next => { current.current = next; setDisplayed(next) } })
  }, [value, reducedMotion, visible])
  const final = formatMoney(value)
  return <span className="animated-money" ref={element}>
    <span className="sr-only">{final}</span>
    <span className="money-reserve" aria-hidden="true">{final}</span>
    <span className="money-value" aria-hidden="true">{reducedMotion || !Number.isFinite(value) ? final : formatMoney(displayed)}</span>
  </span>
}
