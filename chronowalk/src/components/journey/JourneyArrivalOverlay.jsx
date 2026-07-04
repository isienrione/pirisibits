import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { GoldButton, MedallionBadge, cn } from '../ui'

/**
 * Cinematic arrival overlay — auto-reveals "Open story" after a short beat.
 */
export default function JourneyArrivalOverlay({ onOpenStory }) {
  const { state, currentStop } = useJourney()
  const reducedMotion = useReducedMotion()
  const [showCta, setShowCta] = useState(false)

  const visible = state === JOURNEY_STATES.ARRIVED && Boolean(currentStop)

  useEffect(() => {
    if (!visible) {
      setShowCta(false)
      return undefined
    }

    const delay = reducedMotion ? 0 : 1400
    const timer = window.setTimeout(() => setShowCta(true), delay)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, visible, currentStop?.id])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[70] overflow-hidden"
      data-testid="journey-arrival-overlay"
      aria-live="polite"
    >
      <div
        className={cn(
          'absolute inset-0 bg-obsidian/60',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(212,175,55,0.28),transparent_58%)]',
          !reducedMotion && 'animate-arrival-vignette'
        )}
        aria-hidden="true"
      />

      <div className="flex h-full items-end justify-center px-6 pb-[min(28vh,12rem)]">
        <div
          className={cn(
            'pointer-events-auto max-w-sm rounded-3xl border border-gold/35 bg-ivory/95 px-6 py-6 text-center shadow-plaque-lg backdrop-blur-glass',
            !reducedMotion && 'animate-arrival-discover'
          )}
        >
          <MedallionBadge size="md" pulse className="mx-auto">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
            </svg>
          </MedallionBadge>
          <p className="mt-4 text-eyebrow uppercase text-bronze">Story unlocked</p>
          <p className="mt-2 font-display text-2xl font-semibold leading-tight text-deep-slate">
            {currentStop.shortTitle ?? currentStop.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            {currentStop.arrivalLine ?? 'Your story is ready.'}
          </p>
          {showCta ? (
            <GoldButton fullWidth className="mt-5" onClick={onOpenStory}>
              Open story
            </GoldButton>
          ) : (
            <p className="mt-5 text-xs text-soft-slate">Arriving…</p>
          )}
        </div>
      </div>
    </div>
  )
}
