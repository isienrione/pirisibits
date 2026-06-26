import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import { getWaypointGeo } from '../../data/waypointGeo'
import { estimateWalkMinutes } from '../../utils/tourStats'
import TourStopCard from '../TourStopCard'
import { Button, GlassPanel, PageShell, ProgressPill, SectionHeader, ctaInCard, cn, motionCardRise, typeBodySm, typeBodySmMuted, typeEyebrow, typeSectionTitleMd } from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

function TourOverviewView({
  tour,
  progress,
  mapStops,
  waypointsById,
  targetStopId,
  nextWaypoint,
  state,
  distance,
  transitLegActive,
  isAwaitingFirstStop,
  firstStopTitle,
  onNavigate,
  onGetDirections,
  onOpenStop,
}) {
  if (!tour) {
    return (
      <PageShell containerClassName="flex min-h-[50vh] items-center justify-center text-center">
        <p className={typeBodySmMuted}>Single-stop mode — open the map to explore this landmark.</p>
      </PageShell>
    )
  }

  const totalStops = tour.stopIds.length
  const currentStop = Math.min(progress.targetStopIndex + 1, totalStops)
  const currentTitle = getWaypointGeo(targetStopId)?.title ?? 'Current stop'
  const statusLabel =
    isAwaitingFirstStop
      ? 'Get to start'
      : state === JOURNEY_STATE.ARRIVAL
        ? 'At stop'
        : transitLegActive
          ? 'Walking'
          : 'En route'

  const startTitle = firstStopTitle ?? getWaypointGeo(tour.stopIds[0])?.title ?? 'Colosseum'

  const stops = mapStops?.length
    ? mapStops
    : tour.stopIds.map((id, index) => ({
        id,
        title: getWaypointGeo(id)?.title ?? id,
        status: index === 0 ? 'current' : 'upcoming',
      }))

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Your journey"
        title={tour.title}
        subtitle={tour.subtitle}
      />

      {isAwaitingFirstStop ? (
        <GlassPanel className={cn('mt-8 border-gold/30 bg-gold/[0.05] p-6', motionCardRise)}>
          <p className={typeEyebrow}>Before you begin</p>
          <h3 className={cn(typeSectionTitleMd, 'mt-4')}>
            Start at the {startTitle}
          </h3>
          <p className={cn(typeBodySmMuted, 'mt-5')}>
            Your tour does not begin until you reach the first landmark. Walk to the {startTitle},
            then your first audio story and historical reveal will unlock automatically.
          </p>
          {distance != null ? (
            <p className={cn(typeBodySm, 'mt-4')}>
              <span className="font-medium">{Math.round(distance)} m away</span>
              {estimateWalkMinutes(distance) ? (
                <span className="text-soft-slate"> · ~{estimateWalkMinutes(distance)} min walk</span>
              ) : null}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button fullWidth className={ctaInCard} onClick={() => onGetDirections?.()}>
              Get walking directions
            </Button>
            <Button
              variant="secondary"
              fullWidth
              className={ctaInCard}
              onClick={() => onNavigate(NAV_TABS.MAP)}
            >
              Open map
            </Button>
          </div>
        </GlassPanel>
      ) : null}

      <GlassPanel className={cn('mt-8 p-6', motionCardRise)}>
        <ProgressPill
          current={currentStop}
          total={totalStops}
          label={`Stop ${currentStop} of ${totalStops}`}
          status={statusLabel}
        />

        <div className={cn('mt-6 space-y-4', typeBodySmMuted)}>
          <p>
            <span className="font-medium text-deep-slate">Now:</span> {currentTitle}
          </p>
          {nextWaypoint && state !== JOURNEY_STATE.ARRIVAL ? (
            <p>
              <span className="font-medium text-deep-slate">Next:</span> {nextWaypoint.title}
            </p>
          ) : null}
          {distance != null && state !== JOURNEY_STATE.ARRIVAL ? (
            <p>
              <span className="font-medium text-deep-slate">Distance:</span>{' '}
              {Math.round(distance)} m
            </p>
          ) : null}
        </div>

        <Button fullWidth className={cn(ctaInCard, 'mt-6')} onClick={() => onNavigate(NAV_TABS.MAP)}>
          Open map
        </Button>
      </GlassPanel>

      <div className="mt-8">
        <SectionHeader
          align="left"
          eyebrow="Complete tour"
          title="All landmarks"
          subtitle="Revisit stops you've seen or preview any landmark on the route"
          className="mb-6"
        />
        <div className="space-y-5">
          {stops.map((stop, index) => (
            <TourStopCard
              key={stop.id}
              stop={stop}
              index={index}
              waypoint={waypointsById?.[stop.id]}
              compact
              onOpen={(stopId) => {
                onOpenStop?.(stopId)
                onNavigate(NAV_TABS.MAP)
              }}
            />
          ))}
        </div>
      </div>

      <GlassPanel className={cn('mt-8 p-6', motionCardRise)}>
        <p className={typeEyebrow}>Included</p>
        <ul className={cn('mt-5 space-y-3', typeBodySmMuted)}>
          <li>GPS-guided walking between landmarks</li>
          <li>Place-aware audio stories on arrival</li>
          <li>Then-and-now visual reconstructions</li>
        </ul>
      </GlassPanel>
    </PageShell>
  )
}

export default TourOverviewView
