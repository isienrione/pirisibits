import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { Button, GlassPanel, ProgressPill } from './ui'

const TourHud = ({
  tour,
  progress,
  targetStopId,
  nextWaypoint,
  transitLegActive,
  state,
  waypointExploreActive,
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
    !transitLegActive &&
    !waypointExploreActive

  if (!showContinue && !transitLegActive) return null

  const progressStatus = transitLegActive ? 'en route' : 'arrived'

  return (
    <div
      className="pointer-events-none fixed left-1/2 z-40 w-[min(92vw,24rem)] -translate-x-1/2"
      style={{ bottom: 'max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
    >
      <GlassPanel className="pointer-events-auto p-4">
        <p className="text-eyebrow uppercase text-terracotta">{tour.title}</p>

        <ProgressPill
          className="mt-3"
          current={Math.min(currentIndex + 1, totalStops)}
          total={totalStops}
          status={progressStatus}
        />

        {showContinue ? (
          <Button fullWidth className="mt-4" onClick={onContinueTour}>
            Walk to {nextWaypoint.title}
          </Button>
        ) : null}

        {transitLegActive ? (
          <p className="mt-3 text-xs leading-relaxed text-soft-slate">
            Follow the gold route — transit narration is playing. Arrival unlocks when you reach{' '}
            {nextWaypoint?.title ?? 'the next stop'}.
          </p>
        ) : null}
      </GlassPanel>
    </div>
  )
}

export default TourHud
