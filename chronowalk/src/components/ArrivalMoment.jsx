import { useEffect, useState } from 'react'
import { GlassPanel, cn } from './ui'
import { useReducedMotion } from '../hooks/useReducedMotion'

function DiscoveryIcon() {
  return (
    <svg className="mx-auto h-12 w-12 text-gold" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <path
        d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

const ArrivalMoment = ({ waypoint, visible }) => {
  const reducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(visible)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      setExiting(false)
      return undefined
    }

    if (!mounted) return undefined

    setExiting(true)
    const timer = window.setTimeout(() => {
      setMounted(false)
      setExiting(false)
    }, reducedMotion ? 0 : 520)

    return () => window.clearTimeout(timer)
  }, [visible, mounted, reducedMotion])

  if (!mounted || !waypoint) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-30 overflow-hidden',
        !reducedMotion && exiting && 'animate-arrival-exit'
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-deep-slate/55',
          !reducedMotion && !exiting && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(217,164,65,0.34),transparent_58%)]',
          !reducedMotion && !exiting && 'animate-arrival-warm-glow'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(30vh,13rem)]">
        <GlassPanel
          className={cn(
            'max-w-sm rounded-3xl border-gold/40 bg-warm-white/96 px-6 py-6 text-center shadow-glass-lg',
            !reducedMotion && !exiting && 'animate-arrival-discover'
          )}
        >
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span
              className={cn(
                'absolute inset-0 rounded-full bg-gold/20',
                !reducedMotion && !exiting && 'animate-arrival-unlock-glow'
              )}
              aria-hidden="true"
            />
            <DiscoveryIcon />
          </div>
          <p className="mt-4 text-eyebrow uppercase text-gold">Waypoint discovered</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-deep-slate">
            {waypoint.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            Your story is ready below
          </p>
        </GlassPanel>
      </div>
    </div>
  )
}

export default ArrivalMoment
