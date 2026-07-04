import { useCallback } from 'react'
import { formatDistanceToNext } from '../../content/journeyProgress'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { GoldButton, cn, statusArrived, statusWalking } from '../ui'

function formatWalkingTime(meters) {
  if (!meters || meters <= 0) return null
  const minutes = Math.max(1, Math.round(meters / 80))
  return `${minutes} min walk`
}

/**
 * Bottom glass card for walking / arrived / post-story states on the journey map.
 */
export default function JourneyBottomCard({ onSimulateArrival, onOpenStory }) {
  const { state, currentStop, nextStop, distanceToNextM, setState, states } = useJourney()

  const showCard = [
    JOURNEY_STATES.WALKING,
    JOURNEY_STATES.APPROACHING,
    JOURNEY_STATES.ARRIVED,
  ].includes(state)

  if (!showCard || !currentStop) return null

  const distanceLabel = formatDistanceToNext(distanceToNextM)
  const walkTime = formatWalkingTime(distanceToNextM)
  const isArrived = state === JOURNEY_STATES.ARRIVED
  const isApproaching = state === JOURNEY_STATES.APPROACHING

  const handleOpenStory = useCallback(() => {
    setState(states.STORY)
    onOpenStory?.()
  }, [onOpenStory, setState, states.STORY])

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[50] px-4 pb-safe"
      data-testid="journey-bottom-card"
    >
      <div className="pointer-events-auto mx-auto mb-4 max-w-lg rounded-3xl border border-gold/20 bg-ivory/95 p-5 shadow-plaque-lg backdrop-blur-glass">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                isArrived ? statusArrived : statusWalking
              )}
            >
              {isArrived ? 'Arrived' : isApproaching ? 'Approaching' : 'Walking'}
            </span>
            <p className="mt-2 font-display text-xl font-semibold leading-tight text-deep-slate">
              {isArrived
                ? (currentStop.shortTitle ?? currentStop.title)
                : (nextStop?.shortTitle ?? currentStop.shortTitle ?? currentStop.title)}
            </p>
            <p className="mt-1.5 text-sm text-soft-slate">
              {isArrived
                ? (currentStop.arrivalLine ?? 'You have arrived.')
                : (currentStop.approachLine ??
                  `Continue toward ${nextStop?.shortTitle ?? currentStop.shortTitle}.`)}
            </p>
            {!isArrived && distanceLabel ? (
              <p className="mt-1 text-xs text-soft-slate">
                About {distanceLabel}
                {walkTime ? ` · ${walkTime}` : ''}
              </p>
            ) : null}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-lg font-semibold text-gold">
            {currentStop.number}
          </span>
        </div>

        {isArrived ? (
          <GoldButton fullWidth className="mt-4" onClick={handleOpenStory}>
            Open story
          </GoldButton>
        ) : null}

        {import.meta.env.DEV && onSimulateArrival && !isArrived ? (
          <button
            type="button"
            className="mt-3 w-full text-center text-xs text-soft-slate underline"
            onClick={onSimulateArrival}
          >
            Dev: simulate arrival
          </button>
        ) : null}
      </div>
    </div>
  )
}
