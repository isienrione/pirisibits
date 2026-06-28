import { JOURNEY_STATE, LOCATION_STATUS } from '../hooks/useGeoLocation'
import { getWaypointGeo } from '../data/waypointGeo'
import { getModernCoverUrl } from '../utils/sliderMedia'
import { getTourDirectionsOrigin } from '../utils/tourDirections'
import { estimateWalkMinutes } from '../utils/tourStats'
import { Button, GlassPanel, MediaHero, cn, ctaInCard, statusArrived, statusNeutral, statusPill, statusWalking } from './ui'
import { getJourneyProgress } from '../utils/tourStats'
import { ProgressRing } from './journey/ProgressRing'

function formatDistance(distance) {
  if (distance == null || Number.isNaN(distance)) return null
  const meters = Math.round(distance)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function MapHudTopBar({
  tourTitle,
  currentStopTitle,
  progress,
  tour,
  compact = false,
}) {
  const arrivedStopIds = progress?.arrivedStopIds ?? []
  const { visited, remaining, completionPercent, total } = getJourneyProgress(tour, arrivedStopIds)

  return (
    <GlassPanel variant="elevated" className={cn('pointer-events-auto', compact ? 'px-3 py-2.5' : 'px-4 py-3.5')}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-eyebrow uppercase text-terracotta">{tourTitle}</p>
          <p
            className={cn(
              'mt-0.5 truncate font-display font-semibold leading-tight text-deep-slate',
              compact ? 'text-base' : 'text-lg'
            )}
          >
            {currentStopTitle}
          </p>
          {!compact ? (
            <p className="mt-1 text-xs text-soft-slate">
              {visited} visited · {remaining} remaining
              {total ? <span className="text-limestone"> · </span> : null}
              {total ? <span>{completionPercent}% of route</span> : null}
            </p>
          ) : null}
        </div>

        <ProgressRing
          value={completionPercent}
          size={compact ? 50 : 58}
          strokeWidth={5}
          showPercent
          className="shrink-0"
        />
      </div>
    </GlassPanel>
  )
}

function RouteThumbnail({ posterUrl, title, compact = false }) {
  const sizeClass = compact ? 'h-12 w-12' : 'h-16 w-16'

  if (!posterUrl) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-limestone/70 bg-sand px-1 text-center text-[0.6rem] font-semibold uppercase tracking-wide text-soft-slate shadow-sm',
          sizeClass
        )}
      >
        {title?.slice(0, 2) ?? '—'}
      </div>
    )
  }

  return (
    <MediaHero
      src={posterUrl}
      alt=""
      aspect="auto"
      rounded={compact ? 'lg' : 'xl'}
      gradient="subtle"
      zoom
      fadeIn
      className={cn('shrink-0 border border-limestone/70 shadow-sm', sizeClass)}
    />
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
  compact = false,
}) {
  const statusClass =
    statusTone === 'arrived'
      ? statusArrived
      : statusTone === 'walking'
        ? statusWalking
        : statusNeutral

  return (
    <GlassPanel variant="elevated" className={cn('pointer-events-auto', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-start gap-3">
        <RouteThumbnail posterUrl={posterUrl} title={subline} compact={compact} />

        <div className="min-w-0 flex-1">
          <p className={cn('text-eyebrow uppercase text-soft-slate')}>{headline}</p>
          <p
            className={cn(
              'mt-0.5 font-display font-semibold leading-tight text-deep-slate',
              compact ? 'text-base' : 'text-lg'
            )}
          >
            {subline}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-soft-slate">
            {distanceLabel ? <span className="font-semibold text-deep-slate">{distanceLabel}</span> : null}
            {walkMinutes ? <span>~{walkMinutes} min walk</span> : null}
          </div>
          {statusLabel ? (
            <p className={cn(statusPill, 'mt-1.5', statusClass)}>{statusLabel}</p>
          ) : null}
        </div>

        {showDirections && onDirections ? (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 self-center px-3"
            onClick={onDirections}
            aria-label={`Directions to ${subline}`}
          >
            Directions
          </Button>
        ) : null}
      </div>

      {action ? <div className={compact ? 'mt-3' : 'mt-4'}>{action}</div> : null}
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
  awaitingFirstStop = false,
  firstStopTitle,
  dismissedWaypointTitle,
  onReopenWaypoint,
  onContinueTour,
  onDirections,
  hasBottomNav = false,
}) => {
  const isTourMode = Boolean(tour?.stopIds?.length)
  const currentStopTitle =
    getWaypointGeo(currentStopId ?? targetStopId)?.title ?? 'Current stop'

  if (!isTourMode && !currentStopId) return null

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
  const compactHud = Boolean(dismissedWaypointTitle) && atStop

  const routeWaypoint = transitLegActive || !atStop ? currentWaypoint : nextWaypoint
  const posterUrl = routeWaypoint ? getModernCoverUrl(routeWaypoint) : null

  let routeHeadline = 'Next stop'
  let routeSubline = nextWaypoint?.title ?? currentStopTitle
  let statusLabel = null
  let statusTone = 'default'
  let showDirections = false

  if (awaitingFirstStop) {
    routeHeadline = 'Tour begins at'
    routeSubline = firstStopTitle ?? 'Colosseum'
    statusLabel = distanceLabel
      ? `Walk ${distanceLabel} to start your journey`
      : 'Head to the starting landmark to begin'
    statusTone = 'walking'
    showDirections = true
  } else if (transitLegActive) {
    routeHeadline = 'Walking to'
    routeSubline = getWaypointGeo(targetStopId)?.title ?? routeSubline
    statusLabel = 'Follow the terracotta path'
    statusTone = 'walking'
    showDirections = true
  } else if (atStop) {
    routeHeadline = 'You have arrived'
    routeSubline = currentStopTitle
    statusLabel = dismissedWaypointTitle
      ? 'Story minimized — reopen when ready'
      : 'Explore the landmark to continue'
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
      awaitingFirstStop && tour?.stopIds?.[0]
        ? getWaypointGeo(tour.stopIds[0])?.landmark
        : getWaypointGeo(targetStopId)?.landmark ??
          getWaypointGeo(currentStopId)?.landmark ??
          null
    const origin =
      tour && progress.arrivedStopIds.length > 0
        ? getTourDirectionsOrigin(tour, progress)
        : null
    onDirections?.(landmark, awaitingFirstStop ? firstStopTitle : routeSubline, origin)
  }

  const bottomOffset = hasBottomNav ? 'max(var(--bottom-stack-inset), env(safe-area-inset-bottom))' : undefined

  const routeAction = showContinue ? (
    <div className={cn('flex flex-col gap-2', dismissedWaypointTitle && 'sm:flex-row')}>
      {dismissedWaypointTitle && onReopenWaypoint ? (
        <Button
          variant="secondary"
          fullWidth
          className={ctaInCard}
          onClick={onReopenWaypoint}
        >
          Reopen {dismissedWaypointTitle}
        </Button>
      ) : null}
      <Button fullWidth className={ctaInCard} onClick={onContinueTour}>
        Walk to {nextWaypoint.title}
      </Button>
    </div>
  ) : dismissedWaypointTitle && onReopenWaypoint && atStop ? (
    <Button fullWidth className={ctaInCard} onClick={onReopenWaypoint}>
      Reopen {dismissedWaypointTitle}
    </Button>
  ) : transitLegActive ? (
    <p className="text-xs leading-relaxed text-soft-slate">
      Transit narration is playing. Arrival unlocks when you reach {routeSubline}.
    </p>
  ) : awaitingFirstStop ? (
    <Button fullWidth className={ctaInCard} onClick={handleDirections}>
      Get walking directions
    </Button>
  ) : null

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-safe">
        <div className="mx-auto w-full max-w-md">
          <MapHudTopBar
            tourTitle={tourTitle}
            currentStopTitle={awaitingFirstStop ? (firstStopTitle ?? 'Starting point') : currentStopTitle}
            progress={progress}
            tour={tour}
            compact={compactHud}
          />
        </div>
      </div>

      {!hideRouteCard ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-safe lg:pb-safe"
          style={{ paddingBottom: bottomOffset }}
        >
          <div className="mx-auto w-full max-w-md">
            <MapHudRouteCard
              headline={routeHeadline}
              subline={routeSubline}
              statusLabel={statusLabel}
              statusTone={statusTone}
              distanceLabel={!atStop || awaitingFirstStop ? distanceLabel : null}
              walkMinutes={!atStop || awaitingFirstStop ? walkMinutes : null}
              posterUrl={posterUrl}
              showDirections={showDirections}
              onDirections={handleDirections}
              compact={compactHud}
              action={routeAction}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TourHud
