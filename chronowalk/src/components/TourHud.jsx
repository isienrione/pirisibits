import { JOURNEY_STATE, LOCATION_STATUS } from '../hooks/useGeoLocation'
import { getWaypointGeo } from '../data/waypointGeo'
import { getModernPosterUrl } from '../utils/sliderMedia'
import { estimateWalkMinutes } from '../utils/tourStats'
import { Button, GlassPanel, cn, ctaInCard } from './ui'

function formatDistance(distance) {
  if (distance == null || Number.isNaN(distance)) return null
  const meters = Math.round(distance)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function MapHudTopBar({ tourTitle, currentStopTitle, currentStop, totalStops }) {
  const completed = Math.max(0, currentStop - 1)

  return (
    <GlassPanel className="pointer-events-auto px-4 py-3.5 shadow-glass-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-eyebrow uppercase text-terracotta">{tourTitle}</p>
          <p className="mt-1 truncate font-display text-lg font-semibold leading-tight text-deep-slate">
            {currentStopTitle}
          </p>
          <p className="mt-1 text-xs text-soft-slate">
            {completed} of {totalStops} stops visited
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
            Progress
          </p>
          <p className="font-display text-xl font-semibold tabular-nums text-deep-slate">
            <span className="text-gold">{currentStop}</span>
            <span className="text-soft-slate/60"> / </span>
            <span>{totalStops}</span>
          </p>
        </div>
      </div>
    </GlassPanel>
  )
}

function RouteThumbnail({ posterUrl, title }) {
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-limestone/70 bg-sand shadow-sm">
      {posterUrl ? (
        <img
          src={posterUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-soft-slate">
          {title?.slice(0, 2) ?? '—'}
        </div>
      )}
    </div>
  )
}

function MapHudRouteCard({
  headline,
  subline,
  statusLabel,
  statusTone = 'default',
  distanceLabel,
  walkMinutes,
  posterUrl,
  showDirections,
  onDirections,
  action,
}) {
  const statusClass =
    statusTone === 'arrived'
      ? 'bg-olive/15 text-olive'
      : statusTone === 'walking'
        ? 'bg-gold/15 text-gold'
        : 'bg-sand/80 text-soft-slate'

  return (
    <GlassPanel className="pointer-events-auto p-4 shadow-glass-lg">
      <div className="flex items-start gap-3">
        <RouteThumbnail posterUrl={posterUrl} title={subline} />

        <div className="min-w-0 flex-1">
          <p className="text-eyebrow uppercase text-soft-slate">{headline}</p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-deep-slate">
            {subline}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-soft-slate">
            {distanceLabel ? <span className="font-semibold text-deep-slate">{distanceLabel}</span> : null}
            {walkMinutes ? <span>~{walkMinutes} min walk</span> : null}
          </div>
          {statusLabel ? (
            <p
              className={cn(
                'mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusClass
              )}
            >
              {statusLabel}
            </p>
          ) : null}
        </div>

        {showDirections && onDirections ? (
          <Button
            size="sm"
            className="shrink-0 self-center px-4"
            onClick={onDirections}
            aria-label={`Directions to ${subline}`}
          >
            Directions
          </Button>
        ) : null}
      </div>

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
  currentWaypoint,
  transitLegActive,
  state,
  distance,
  locationStatus,
  waypointExploreActive,
  onContinueTour,
  onDirections,
  hasBottomNav = false,
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
  const walkMinutes = estimateWalkMinutes(distance)
  const hideRouteCard = waypointExploreActive

  const routeWaypoint = transitLegActive || !atStop ? currentWaypoint : nextWaypoint
  const posterUrl = routeWaypoint ? getModernPosterUrl(routeWaypoint) : null

  let routeHeadline = 'Next stop'
  let routeSubline = nextWaypoint?.title ?? currentStopTitle
  let statusLabel = null
  let statusTone = 'default'
  let showDirections = false

  if (transitLegActive) {
    routeHeadline = 'Walking to'
    routeSubline = getWaypointGeo(targetStopId)?.title ?? routeSubline
    statusLabel = 'Follow the terracotta path'
    statusTone = 'walking'
    showDirections = true
  } else if (atStop) {
    routeHeadline = 'You have arrived'
    routeSubline = currentStopTitle
    statusLabel = 'Explore the landmark to continue'
    statusTone = 'arrived'
  } else {
    routeHeadline = 'Heading to'
    routeSubline = currentStopTitle
    showDirections = true
    if (locationStatus === LOCATION_STATUS.DENIED) {
      statusLabel = 'Location access needed'
    } else if (locationStatus === LOCATION_STATUS.UNAVAILABLE) {
      statusLabel = 'GPS unavailable'
    } else if (locationStatus === LOCATION_STATUS.WAITING) {
      statusLabel = 'Locating you…'
    } else {
      statusLabel = distanceLabel ? 'Walking' : 'Locating you…'
    }
    statusTone = 'walking'
  }

  const handleDirections = () => {
    const landmark =
      getWaypointGeo(targetStopId)?.landmark ??
      getWaypointGeo(currentStopId)?.landmark ??
      null
    onDirections?.(landmark)
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
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-safe lg:pb-safe"
          style={{ paddingBottom: hasBottomNav ? 'max(5.5rem, env(safe-area-inset-bottom))' : undefined }}
        >
          <div className="mx-auto w-full max-w-md">
            <MapHudRouteCard
              headline={routeHeadline}
              subline={routeSubline}
              statusLabel={statusLabel}
              statusTone={statusTone}
              distanceLabel={!atStop ? distanceLabel : null}
              walkMinutes={!atStop ? walkMinutes : null}
              posterUrl={posterUrl}
              showDirections={showDirections}
              onDirections={handleDirections}
              action={
                showContinue ? (
                  <Button fullWidth className={ctaInCard} onClick={onContinueTour}>
                    Walk to {nextWaypoint.title}
                  </Button>
                ) : transitLegActive ? (
                  <p className="text-xs leading-relaxed text-soft-slate">
                    Transit narration is playing. Arrival unlocks when you reach {routeSubline}.
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
