import { JOURNEY_STATE } from '../hooks/useGeoLocation'

const TourHud = ({
  tour,
  progress,
  targetStopId,
  nextWaypoint,
  transitLegActive,
  state,
  onContinueTour,
}) => {
  if (!tour || !nextWaypoint) return null

  const currentIndex = progress.targetStopIndex
  const totalStops = tour.stopIds.length
  const atStop = state === JOURNEY_STATE.ARRIVAL
  const showContinue =
    atStop &&
    targetStopId &&
    progress.arrivedStopIds.includes(targetStopId) &&
    nextWaypoint &&
    !transitLegActive

  if (!showContinue && !transitLegActive) return null

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-[180] w-[min(92vw,24rem)] -translate-x-1/2"
      style={{ bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
    >
      <div className="pointer-events-auto rounded-2xl border border-amber-400/30 bg-stone-950/90 p-4 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">
          {tour.title}
        </p>
        <p className="mt-1 text-sm text-stone-300">
          Stop {Math.min(currentIndex + 1, totalStops)} of {totalStops}
          {transitLegActive ? ' · en route' : ' · arrived'}
        </p>

        {showContinue ? (
          <button
            type="button"
            onClick={onContinueTour}
            className="mt-3 w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-gray-900 transition hover:bg-amber-400"
          >
            Walk to {nextWaypoint.title}
          </button>
        ) : null}

        {transitLegActive ? (
          <p className="mt-2 text-xs leading-relaxed text-stone-400">
            Follow the gold route — transit narration is playing. Arrival unlocks when you reach{' '}
            {nextWaypoint?.title ?? 'the next stop'}.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default TourHud
