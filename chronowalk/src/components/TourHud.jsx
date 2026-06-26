import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { getWaypointGeo } from '../data/waypointGeo'
import { Button, GlassPanel, cn } from './ui'

function formatDistance(distance) {
  if (distance == null || Number.isNaN(distance)) return null
  const meters = Math.round(distance)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function MapHudTopBar({ tourTitle, currentStopTitle, currentStop, totalStops }) {
  return (
    <GlassPanel
      className={cn(
        'pointer-events-auto rounded-3xl px-4 py-3 shadow-glass-lg',
        'border-limestone/70 bg-warm-white/92'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-eyebrow uppercase text-terracotta">{tourTitle}</p>
          <p className="mt-1 truncate font-display text-lg font-semibold leading-tight text-deep-slate">
            {currentStopTitle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
            Stop
          </p>
          <p className="font-display text-xl font-semibold tabular-nums text-deep-slate">
            <span className="text-terracotta">{currentStop}</span>
            <span className="text-soft-slate/60"> / </span>
            <span>{totalStops}</span>
          </p>
        </div>
      </div>
    </GlassPanel>
  )
}

function MapHudRouteCard({
  headline,
  subline,
  statusLabel,
  statusTone = 'default',
  distanceLabel,
  action,
}) {
  const statusClass =
    statusTone === 'arrived'
      ? 'bg-olive/15 text-olive'
      : statusTone === 'walking'
        ? 'bg-gold/15 text-gold'
        : 'bg-sand/80 text-soft-slate'

  return (
    <GlassPanel
      className={cn(
        'pointer-events-auto rounded-3xl p-4 shadow-glass-lg',
        'border-limestone/70 bg-warm-white/92'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-eyebrow uppercase text-soft-slate">{headline}</p>
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-deep-slate">
            {subline}
          </p>
        </div>
        {distanceLabel ? (
          <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-deep-slate">
            {distanceLabel}
          </p>
        ) : null}
      </div>

      {statusLabel ? (
        <p
          className={cn(
            'mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
            statusClass
          )}
        >
          {statusLabel}
        </p>
      ) : null}

      {action ? <div className="mt-4">{action}</div> : null}
    </GlassPanel>
  )
}

const TourHud = ({
  tour,
  currentStopId,
  progress,
  targetStopId,
  nextWaypoint,
  transitLegActive,
  state,
  distance,
  waypointExploreActive,
  onContinueTour,
}) => {
  const isTourMode = Boolean(tour?.stopIds?.length)
  const currentStopTitle =
    getWaypointGeo(currentStopId ?? targetStopId)?.title ?? 'Current stop'

  if (!isTourMode && !currentStopId) return null

  const totalStops = tour?.stopIds?.length ?? 1
  const currentStopNumber = isTourMode
    ? Math.min(progress.targetStopIndex + 1, totalStops)
    : 1
  const tourTitle = tour?.title ?? 'ChronoWalk'

  const atStop = state === JOURNEY_STATE.ARRIVAL
  const showContinue =
    isTourMode &&
    atStop &&
    targetStopId &&
    progress.arrivedStopIds.includes(targetStopId) &&
    nextWaypoint &&
    !transitLegActive &&
    !waypointExploreActive

  const distanceLabel = formatDistance(distance)
  const hideRouteCard = waypointExploreActive

  let routeHeadline = 'Next destination'
  let routeSubline = nextWaypoint?.title ?? currentStopTitle
  let statusLabel = null
  let statusTone = 'default'

  if (transitLegActive) {
    routeHeadline = 'Walking to'
    routeSubline = getWaypointGeo(targetStopId)?.title ?? routeSubline
    statusLabel = 'En route — follow the gold path'
    statusTone = 'walking'
  } else if (atStop) {
    routeHeadline = 'You have arrived'
    routeSubline = currentStopTitle
    statusLabel = 'Explore the landmark to continue'
    statusTone = 'arrived'
  } else {
    routeHeadline = 'Heading to'
    routeSubline = currentStopTitle
    statusLabel = distanceLabel ? 'Walking' : 'Locating you…'
    statusTone = 'walking'
  }

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-safe"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto w-full max-w-md">
          <MapHudTopBar
            tourTitle={tourTitle}
            currentStopTitle={currentStopTitle}
            currentStop={currentStopNumber}
            totalStops={totalStops}
          />
        </div>
      </div>

      {!hideRouteCard ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-safe"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto w-full max-w-md">
            <MapHudRouteCard
              headline={routeHeadline}
              subline={routeSubline}
              statusLabel={statusLabel}
              statusTone={statusTone}
              distanceLabel={!atStop ? distanceLabel : null}
              action={
                showContinue ? (
                  <Button fullWidth className="rounded-2xl" onClick={onContinueTour}>
                    Walk to {nextWaypoint.title}
                  </Button>
                ) : transitLegActive ? (
                  <p className="text-xs leading-relaxed text-soft-slate">
                    Transit narration is playing. Arrival unlocks when you reach{' '}
                    {routeSubline}.
                  </p>
                ) : null
              }
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TourHud
