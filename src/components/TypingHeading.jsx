import { useEffect, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { animateValue } from '../lib/animateValue.js'

function HeadingText({ text }) {
  const reducedMotion = useReducedMotion()
  const [length, setLength] = useState(0)
  const characterCount = Array.from(text).length
  useEffect(() => {
    if (reducedMotion) return
    return animateValue({ from: 0, to: characterCount, duration: Math.min(1400, Math.max(650, characterCount * 44)), linear: true, onUpdate: value => setLength(Math.floor(value)) })
  }, [characterCount, reducedMotion])
  const revealed = reducedMotion ? characterCount : length
  const words = Array.from(text.matchAll(/\S+|\s+/gu), match => ({ word: match[0], start: Array.from(text.slice(0, match.index)).length }))
  return <h1 className="typing-heading" aria-label={text}>
    <span className="typing-text" aria-hidden="true" data-animated={!reducedMotion} data-typing={revealed < characterCount}>
      {words.map(({ word, start }, wordIndex) => {
        const characters = Array.from(word)
        if (/^\s+$/.test(word)) return word
        return <span className="typing-word" key={wordIndex}>{characters.map((character, index) => <span className="typing-character" key={index} data-revealed={start + index < revealed} data-current={!reducedMotion && revealed < characterCount && start + index === revealed - 1}>{character}</span>)}</span>
      })}
    </span>
  </h1>
}

export default function TypingHeading({ text }) {
  return <HeadingText key={text} text={text} />
}
