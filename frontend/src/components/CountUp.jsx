import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number towards its target. Used for the SGPA figure and the stat cards.
 *
 * On mount it counts up from zero. On later changes it eases from whatever is
 * currently on screen to the new value, so the live preview in marks entry
 * updates smoothly instead of snapping back to zero on every keystroke.
 * Honours prefers-reduced-motion by jumping straight to the final value.
 */
export function CountUp({ value, decimals = 2, duration = 900, suffix = '', className = '' }) {
  const target = Number(value) || 0
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? target : 0))
  const displayRef = useRef(display)
  const frame = useRef(0)

  useEffect(() => {
    displayRef.current = display
  }, [display])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(target)
      return undefined
    }

    const from = displayRef.current
    if (from === target) return undefined

    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      // easeOutCubic: quick to move, gentle to settle, never overshoots.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (target - from) * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return (
    <span className={`tnum ${className}`}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
