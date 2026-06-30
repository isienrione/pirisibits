import { JOURNEY_STATE } from '../hooks/useGeoLocation'
import { getWaypointGeo } from '../data/waypointGeo'
import { getModernCoverUrl } from '../utils/sliderMedia'
import { getTourDirectionsOrigin } from '../utils/tourDirections'
import { estimateWalkMinutes } from '../utils/tourStats'
import {
  Button,
  GlassPanel,
  GoldButton,
  IconButton,
  cn,
  metaLabel,
} from './ui'

function formatDistance(distance) {
  if (distance == null || Number.isNaN(distance)) return null
  const meters = Math.round(distance)
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function TempleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10h16M6 10V8l6-4 6 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10v8M17 10v8M10 18h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function LocateIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CompassIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="m12 7 2 5-5 2-2-5 5-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function MapHudHeader({
  tourTitle,
  completedStops,
  totalStops,
  onOpenProfile,
  compact = false,
}) {
  return (
    <GlassPanel className={cn('pointer-events-auto shadow-plaque-lg', compact ? 'px-3 py-2.5' : 'px-4 py-3')}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-parchment/70 bg-parchment/50 text-bronze">
          <TempleIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate font-display font-semibold leading-tight text-deep-slate',
              compact ? 'text-base' : 'text-lg'
            )}
          >
            {tourTitle}
          </p>
          <p className="mt-0.5 text-xs text-soft-slate">
            <span className="font-semibold text-deep-slate">{completedStops}</span>
            <span className="text-soft-slate/70"> / </span>
            <span>{totalStops} stops completed</span>
          </p>
        </div>
        {onOpenProfile ? (
          <IconButton
            variant="ghost"
            size="md"
            label="Open profile and settings"
            onClick={onOpenProfile}
            className="shrink-0 border-parchment/70 bg-ivory/90"
          >
            <MenuIcon className="h-5 w-5" />
          </IconButton>
        ) : null}
      </div>
    </GlassPanel>
  )
}

function RouteThumbnail({ posterUrl, title }) {
  return (
    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-parchment/70 bg-parchment shadow-sm">
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

function MapHudNextStopCard({
  headline,
  subline,
  distanceLabel,
  walkMinutes,
  posterUrl,
  onDirections,
  action,
}) {
  return (
    <GlassPanel className="pointer-events-auto relative shadow-plaque-lg">
      <div className="flex items-start gap-3 p-4">
        <RouteThumbnail posterUrl={posterUrl} title={subline} />
        <div className="min-w-0 flex-1">
          <p className={cn(metaLabel, 'text-bronze')}>{headline}</p>
          <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-deep-slate">
            {subline}
          </p>
          {distanceLabel || walkMinutes ? (
            <p className="mt-1.5 text-sm text-soft-slate">
              {distanceLabel ? <span className="font-semibold text-deep-slate">{distanceLabel}</span> : null}
              {distanceLabel && walkMinutes ? <span className="text-limestone"> · </span> : null}
              {walkMinutes ? <span>{walkMinutes} min walk</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      {action ? <div className="border-t border-parchment/60 px-4 pb-4 pt-3">{action}</div> : null}

      {onDirections ? (
        <div className="border-t border-parchment/60 px-4 py-3">
          <Button variant="text" fullWidth onClick={onDirections}>
            Walking directions
          </Button>
        </div>
      ) : null}
    </GlassPanel>
  )
}

function MapFloatingControls({ onRecenter }) {
  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      {onRecenter ? (
        <IconButton
          variant="solid"
          size="md"
          label="Center map on your location"
          onClick={onRecenter}
          className="border-parchment/80 bg-ivory shadow-plaque"
        >
          <LocateIcon className="h-5 w-5" />
        </IconButton>
      ) : null}
      <IconButton
        variant="solid"
        size="md"
        label="Map compass"
        className="border-parchment/80 bg-ivory shadow-plaque"
        aria-hidden="true"
        tabIndex={-1}
      >
        <CompassIcon className="h-5 w-5" />
      </IconButton>
    </div>
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
  isFreePreview = false,
  onReopenWaypoint,
  onContinueTour,
  onDirections,
  onUnlockTour,
  onOpenProfile,
  onRecenter,
  hasBottomNav = false,
}) => {
  const isTourMode = Boolean(tour?.stopIds?.length)

  if (!isTourMode && !currentStopId) return null

  const totalStops = tour?.stopIds?.length ?? 1
  const completedStops = isTourMode ? Math.max(0, progress.arrivedStopIds.length) : 0
  const tourTitle = isFreePreview ? 'Free preview' : tour?.title ?? 'ChronoWalk'

  const atStop = state === JOURNEY_STATE.ARRIVAL
  const showContinue =
    !isFreePreview &&
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
  const currentStopTitle =
    getWaypointGeo(currentStopId ?? targetStopId)?.title ?? 'Current stop'

  let routeHeadline = 'Next stop'
  let routeSubline = nextWaypoint?.title ?? currentStopTitle
  let showDirections = false

  if (isFreePreview) {
    routeHeadline = 'Complete Rome tour'
    routeSubline = `${totalStops} landmarks on the map`
  } else if (awaitingFirstStop) {
    routeHeadline = 'Tour begins at'
    routeSubline = firstStopTitle ?? 'Colosseum'
    showDirections = true
  } else if (transitLegActive) {
    routeHeadline = 'Walking to'
    routeSubline = getWaypointGeo(targetStopId)?.title ?? routeSubline
    showDirections = true
  } else if (atStop) {
    routeHeadline = 'You have arrived'
    routeSubline = currentStopTitle
  } else {
    routeHeadline = 'Walking to'
    routeSubline = currentStopTitle
    showDirections = true
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

  const routeAction = isFreePreview ? (
    <GoldButton fullWidth onClick={onUnlockTour}>
      View tours &amp; pricing
    </GoldButton>
  ) : showContinue ? (
    <div className="flex flex-col gap-2">
      {dismissedWaypointTitle && onReopenWaypoint ? (
        <Button variant="outline-gold" fullWidth onClick={onReopenWaypoint}>
          Reopen {dismissedWaypointTitle}
        </Button>
      ) : null}
      <GoldButton fullWidth showArrow onClick={onContinueTour}>
        Continue
      </GoldButton>
    </div>
  ) : dismissedWaypointTitle && onReopenWaypoint && atStop ? (
    <GoldButton fullWidth onClick={onReopenWaypoint}>
      Reopen {dismissedWaypointTitle}
    </GoldButton>
  ) : awaitingFirstStop || transitLegActive || (!atStop && showDirections) ? (
    <GoldButton fullWidth showArrow onClick={handleDirections}>
      {awaitingFirstStop ? 'Get directions' : 'Continue'}
    </GoldButton>
  ) : null

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-40 px-4 pt-safe"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="mx-auto w-full max-w-md">
          <MapHudHeader
            tourTitle={tourTitle}
            completedStops={completedStops}
            totalStops={totalStops}
            onOpenProfile={onOpenProfile}
            compact={compactHud}
          />
        </div>
      </div>

      <div className="pointer-events-none fixed right-4 top-[calc(env(safe-area-inset-top)+5.25rem)] z-40">
        <MapFloatingControls onRecenter={onRecenter} />
      </div>

      {!hideRouteCard ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-safe lg:pb-safe"
          style={{ paddingBottom: bottomOffset }}
        >
          <div className="mx-auto w-full max-w-md">
            <MapHudNextStopCard
              headline={routeHeadline}
              subline={routeSubline}
              distanceLabel={!atStop || awaitingFirstStop || transitLegActive ? distanceLabel : null}
              walkMinutes={!atStop || awaitingFirstStop || transitLegActive ? walkMinutes : null}
              posterUrl={posterUrl}
              onDirections={showDirections && !routeAction ? handleDirections : null}
              action={routeAction}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default TourHud
