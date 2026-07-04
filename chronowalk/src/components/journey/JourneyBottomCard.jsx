import { useCallback } from 'react'
import { formatDistanceToNext } from '../../content/journeyProgress'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { GoldButton, cn, statusWalking } from '../ui'

function formatWalkingTime(meters) {
  if (!meters || meters <= 0) return null
  const minutes = Math.max(1, Math.round(meters / 80))
  return `${minutes} min walk`
}

/**
 * Bottom glass card for walking / approaching states on the journey map.
 * Arrival is handled by JourneyArrivalOverlay to avoid duplicate bottom sheets.
 */
export default function JourneyBottomCard({ onSimulateArrival }) {
  const { state, currentStop, nextStop, distanceToNextM } = useJourney()

  const showCard = [JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING].includes(state)

  if (!showCard || !currentStop) return null

  const distanceLabel = formatDistanceToNext(distanceToNextM)
  const walkTime = formatWalkingTime(distanceToNextM)
  const isApproaching = state === JOURNEY_STATES.APPROACHING

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[50] px-4 pb-launch-bottom"
      data-testid="journey-bottom-card"
    >
      <div className="pointer-events-auto mx-auto mb-launch-bottom max-w-lg rounded-3xl border border-gold/20 bg-ivory/95 p-5 shadow-plaque-lg backdrop-blur-glass motion-safe:transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                statusWalking
              )}
            >
              {isApproaching ? 'Approaching' : 'Walking'}
            </span>
            <p className="mt-2 font-display text-xl font-semibold leading-tight text-deep-slate">
              {nextStop?.shortTitle ?? currentStop.shortTitle ?? currentStop.title}
            </p>
            <p className="mt-1.5 text-sm text-soft-slate">
              {currentStop.approachLine ??
                `Continue toward ${nextStop?.shortTitle ?? currentStop.shortTitle}.`}
            </p>
            {distanceLabel ? (
              <p className="mt-1 text-sm text-soft-slate">
                About {distanceLabel}
                {walkTime ? ` · ${walkTime}` : ''}
              </p>
            ) : null}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-lg font-semibold text-gold">
            {currentStop.number}
          </span>
        </div>

        {import.meta.env.DEV && onSimulateArrival ? (
          <button
            type="button"
            className="mt-3 flex min-h-11 w-full items-center justify-center text-sm text-soft-slate underline"
            onClick={onSimulateArrival}
          >
            Dev: simulate arrival
          </button>
        ) : null}
      </div>
    </div>
  )
}
