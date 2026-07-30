import { formatDistanceToNext } from '../../content/journeyProgress'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { GoldButton } from '../ui'

/**
 * Post-threshold forward transition — advance to the next stop or tour completion.
 */
export default function ContinueWalkingTransition({ open = true, className = '' }) {
  const { state, currentStop, nextStop, distanceToNextM, isLastStop, continueWalking } =
    useJourney()

  const visible = open && state === JOURNEY_STATES.THRESHOLD && Boolean(currentStop)
  if (!visible) return null

  const distanceLabel = formatDistanceToNext(distanceToNextM)
  const heading = isLastStop ? 'Tour complete' : 'Up next'
  const targetTitle = isLastStop
    ? 'You have visited every stop on this route'
    : (nextStop?.shortTitle ?? nextStop?.title ?? 'Next landmark')

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[80] px-4 pb-safe ${className}`.trim()}
      data-testid="continue-walking-transition"
    >
      <div className="pointer-events-auto mx-auto mb-4 max-w-lg rounded-3xl border border-gold/25 bg-ivory/95 p-5 shadow-plaque-lg backdrop-blur-glass">
        <p className="text-eyebrow uppercase text-bronze">{heading}</p>
        <p className="mt-2 font-display text-xl font-semibold leading-tight text-deep-slate">
          {targetTitle}
        </p>
        {!isLastStop && distanceLabel ? (
          <p className="mt-1.5 text-sm text-soft-slate">About {distanceLabel} away</p>
        ) : null}
        {isLastStop ? (
          <p className="mt-1.5 text-sm text-soft-slate">
            Continue to see your journey summary.
          </p>
        ) : null}

        <GoldButton fullWidth className="mt-5" onClick={continueWalking}>
          Continue walking
        </GoldButton>
      </div>
    </div>
  )
}
