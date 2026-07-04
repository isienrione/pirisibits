import { useNavigate } from 'react-router-dom'
import { formatDistanceToNext, formatWalkingTime } from '../../content/journeyProgress'
import { JOURNEY_STATES } from '../../state/journeyState'
import { useJourney } from '../../hooks/useJourney'
import { walkingDirectionsPath } from '../../routes/paths'
import { Button, cn, statusArrived, statusWalking } from '../ui'
import { metaLabel } from '../ui/styles'

const STATE_LABELS = {
  [JOURNEY_STATES.WALKING]: 'Walking',
  [JOURNEY_STATES.APPROACHING]: 'Approaching',
  [JOURNEY_STATES.ARRIVED]: 'Arrived',
}

export default function JourneyBottomCard({ onSimulateArrival }) {
  const navigate = useNavigate()
  const { state, currentStop, nextStop, distanceToNextM } = useJourney()

  const showCard = [JOURNEY_STATES.WALKING, JOURNEY_STATES.APPROACHING, JOURNEY_STATES.ARRIVED].includes(
    state
  )

  if (!showCard || !currentStop) return null

  const isArrived = state === JOURNEY_STATES.ARRIVED
  const isApproaching = state === JOURNEY_STATES.APPROACHING
  const canRequestDirections = !isArrived && Boolean(nextStop)
  const destination = isArrived ? currentStop : nextStop ?? currentStop
  const distanceLabel = !isArrived ? formatDistanceToNext(distanceToNextM) : null
  const walkTime = !isArrived ? formatWalkingTime(distanceToNextM) : null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-safe"
      data-testid="journey-bottom-card"
    >
      <div
        className={cn(
          'pointer-events-auto mx-auto max-w-lg rounded-[1.75rem] border bg-ivory/95 p-5 shadow-plaque-lg backdrop-blur-glass',
          'motion-safe:transition-[border-color,box-shadow] motion-safe:duration-spring motion-safe:ease-spring',
          isArrived ? 'border-olive/30' : isApproaching ? 'border-gold/35' : 'border-parchment/80'
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
                isArrived ? statusArrived : statusWalking
              )}
            >
              {STATE_LABELS[state]}
            </span>

            <p className="mt-3 font-display text-2xl font-semibold leading-tight text-deep-slate">
              {destination.shortTitle ?? destination.title}
            </p>

            <p className="mt-2 text-base leading-relaxed text-soft-slate">
              {isArrived
                ? currentStop.arrivalLine
                : currentStop.approachLine ??
                  `Continue toward ${destination.shortTitle ?? destination.title}.`}
            </p>

            {distanceLabel ? (
              <p className="mt-2 text-sm text-soft-slate">
                About {distanceLabel}
                {walkTime ? ` · ${walkTime}` : ''}
              </p>
            ) : null}

            {canRequestDirections ? (
              <Button
                variant="text"
                className="mt-4 h-auto min-h-11 justify-start px-0 text-base font-medium text-bronze"
                onClick={() => navigate(walkingDirectionsPath())}
              >
                Walking directions
              </Button>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2">
            {destination.heroImage ? (
              <img
                src={destination.heroImage}
                alt=""
                aria-hidden="true"
                className="h-16 w-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-parchment/60 font-display text-xl font-semibold text-bronze">
                {destination.number}
              </span>
            )}
            <p className={cn(metaLabel, 'text-bronze')}>Stop {destination.number}</p>
          </div>
        </div>

        {import.meta.env.DEV && onSimulateArrival && !isArrived ? (
          <button
            type="button"
            className="mt-4 flex min-h-11 w-full items-center justify-center text-sm text-soft-slate underline"
            onClick={onSimulateArrival}
          >
            Dev: simulate arrival
          </button>
        ) : null}
      </div>
    </div>
  )
}
