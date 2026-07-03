import { useEffect, useState } from 'react'
import { cn } from '../components/ui/cn.js'

/**
 * One-breath chromatic shimmer on the seam edge at crossing completion.
 * 600ms, var(--spectrum) at 30% opacity — subtle, then gone.
 */
export default function ThresholdBloom({ active = false, onComplete, className }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return undefined

    setVisible(true)
    const timer = window.setTimeout(() => {
      setVisible(false)
      onComplete?.()
    }, 600)

    return () => window.clearTimeout(timer)
  }, [active, onComplete])

  if (!visible) return null

  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-y-0 left-1/2 z-10 w-6 -translate-x-1/2', className)}
      style={{
        background: 'var(--spectrum)',
        opacity: 0.3,
        mixBlendMode: 'screen',
        filter: 'blur(3px)',
        animation: 'threshold-bloom 600ms ease-out forwards',
      }}
    />
  )
}
