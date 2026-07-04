import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { GoldButton, cn } from '../ui'
import ArrivalGoldParticles from './ArrivalGoldParticles'
import ArrivalMonumentIcon from './ArrivalMonumentIcon'

const HOLD_MS = 2000

export default function JourneyArrivalMoment({
  stopTitle,
  onContinue,
  holdMs = HOLD_MS,
}) {
  const reducedMotion = useReducedMotion()
  const [showAction, setShowAction] = useState(false)

  useEffect(() => {
    const delay = reducedMotion ? 400 : holdMs
    const timer = window.setTimeout(() => setShowAction(true), delay)
    return () => window.clearTimeout(timer)
  }, [holdMs, reducedMotion])

  return (
    <div
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#080808] text-ivory"
      data-testid="journey-arrival-moment"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(212,175,55,0.14),transparent_62%)]"
        aria-hidden="true"
      />
      <ArrivalGoldParticles />

      <div className="relative z-10 flex max-w-md flex-col items-center px-8 text-center">
        <ArrivalMonumentIcon className="motion-safe:animate-arrival-discover" />

        <p
          className={cn(
            'mt-12 font-display text-[2.5rem] font-semibold leading-tight tracking-tight text-ivory sm:text-5xl',
            'motion-safe:animate-arrival-discover motion-safe:animate-arrival-title'
          )}
        >
          You&apos;ve arrived.
        </p>

        {showAction ? (
          <div
            className="mt-14 w-full max-w-xs motion-safe:animate-arrival-discover"
            data-testid="journey-arrival-action"
          >
            {stopTitle ? (
              <p className="mb-5 font-display text-xl font-medium leading-snug text-gold/90">
                {stopTitle}
              </p>
            ) : null}
            <GoldButton fullWidth showArrow onClick={onContinue}>
              Open story
            </GoldButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}
