import { useEffect, useState } from 'react'
import { MOTION_DURATION, MOTION_EASE } from './tokens.js'

/**
 * Gentle opacity (+ optional lift) reveal — documentary / keynote pacing.
 * No bounce, no spring, no scale pop.
 * Defaults follow Motion Design System tokens.
 */
export function FadeReveal({
  show = false,
  duration = MOTION_DURATION.reveal,
  delay = 0,
  y = 10,
  as: Tag = 'div',
  className = '',
  style,
  children,
  ...rest
}) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (!show) {
      setEntered(false)
      return undefined
    }
    const id = window.setTimeout(() => setEntered(true), 16)
    return () => window.clearTimeout(id)
  }, [show])

  return (
    <Tag
      className={`cw-fade-reveal${entered ? ' cw-fade-reveal--in' : ''}${className ? ` ${className}` : ''}`}
      style={{
        '--cw-reveal-duration': `${duration}ms`,
        '--cw-reveal-delay': `${delay}ms`,
        '--cw-reveal-y': `${y}px`,
        '--cw-reveal-ease': MOTION_EASE.exit,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
