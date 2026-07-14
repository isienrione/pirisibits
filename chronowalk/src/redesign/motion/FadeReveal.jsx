import { useEffect, useState } from 'react'

/**
 * Gentle opacity (+ optional lift) reveal — documentary / keynote pacing.
 * No bounce, no spring, no scale pop.
 */
export function FadeReveal({
  show = false,
  duration = 900,
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
    // One tick so the hidden paint lands before the transition class.
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
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
