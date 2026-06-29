import { useEffect, useRef, useState } from 'react'
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
  const wasActiveRef = useRef(active)
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

      const switchingIn = wasActiveRef.current === false

      if (reducedMotion || !switchingIn) {
        setVisible(true)
      } else {
        setVisible(false)
        const frame = requestAnimationFrame(() => setVisible(true))
        wasActiveRef.current = active
        return () => cancelAnimationFrame(frame)
      }
    } else {
      setVisible(false)

      if (!keepMounted) {
        const delay = reducedMotion ? 0 : TAB_CROSSFADE_MS
        const timer = window.setTimeout(() => setMounted(false), delay)
        wasActiveRef.current = active
        return () => window.clearTimeout(timer)
      }
    }

    wasActiveRef.current = active
    return undefined
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
