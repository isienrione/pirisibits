import { useEffect, useState } from 'react'
import { cn } from '../ui/cn'
import { useReducedMotion } from '../../hooks/useReducedMotion'

const TAB_CROSSFADE_MS = 200

export function TabCrossFadePanel({
  active,
  keepMounted = false,
  className,
  id,
  children,
}) {
  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(active || keepMounted)
  const [visible, setVisible] = useState(active)

  useEffect(() => {
    if (keepMounted) {
      setMounted(true)
    }
  }, [keepMounted])

  useEffect(() => {
    if (active) {
      if (!keepMounted) {
        setMounted(true)
      }

      if (reducedMotion) {
        setVisible(true)
        return undefined
      }

      setVisible(false)
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }

    setVisible(false)

    if (keepMounted) {
      return undefined
    }

    const delay = reducedMotion ? 0 : TAB_CROSSFADE_MS
    const timer = window.setTimeout(() => setMounted(false), delay)
    return () => window.clearTimeout(timer)
  }, [active, keepMounted, reducedMotion])

  if (!mounted) {
    return null
  }

  return (
    <div
      id={id}
      className={cn(
        'tab-panel-motion',
        active && visible ? 'tab-panel-motion--active' : 'tab-panel-motion--inactive',
        className
      )}
      aria-hidden={!active}
    >
      {children}
    </div>
  )
}
