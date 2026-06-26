import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import { getWaypointGeo } from '../../data/waypointGeo'
import { estimateWalkMinutes } from '../../utils/tourStats'
import TourStopCard from '../TourStopCard'
import { Button, GlassPanel, PageShell, ProgressPill, SectionHeader, ctaInCard, cn, motionCardRise } from '../ui'
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
        <p className="text-soft-slate">Single-stop mode — open the map to explore this landmark.</p>
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
        <GlassPanel className={cn('mt-6 border-gold/30 bg-gold/[0.05] p-5', motionCardRise)}>
          <p className="text-eyebrow uppercase text-gold">Before you begin</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-deep-slate">
            Start at the {startTitle}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-soft-slate">
            Your tour does not begin until you reach the first landmark. Walk to the {startTitle},
            then your first audio story and historical reveal will unlock automatically.
          </p>
          {distance != null ? (
            <p className="mt-3 text-sm text-deep-slate">
              <span className="font-semibold">{Math.round(distance)} m away</span>
              {estimateWalkMinutes(distance) ? (
                <span className="text-soft-slate"> · ~{estimateWalkMinutes(distance)} min walk</span>
              ) : null}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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

      <GlassPanel className={cn('mt-6 p-5', motionCardRise)}>
        <ProgressPill
          current={currentStop}
          total={totalStops}
          label={`Stop ${currentStop} of ${totalStops}`}
          status={statusLabel}
        />

        <div className="mt-5 space-y-3 text-sm text-soft-slate">
          <p>
            <span className="font-semibold text-deep-slate">Now:</span> {currentTitle}
          </p>
          {nextWaypoint && state !== JOURNEY_STATE.ARRIVAL ? (
            <p>
              <span className="font-semibold text-deep-slate">Next:</span> {nextWaypoint.title}
            </p>
          ) : null}
          {distance != null && state !== JOURNEY_STATE.ARRIVAL ? (
            <p>
              <span className="font-semibold text-deep-slate">Distance:</span>{' '}
              {Math.round(distance)} m
            </p>
          ) : null}
        </div>

        <Button fullWidth className={cn(ctaInCard, 'mt-5')} onClick={() => onNavigate(NAV_TABS.MAP)}>
          Open map
        </Button>
      </GlassPanel>

      <div className="mt-6">
        <SectionHeader
          align="left"
          eyebrow="Complete tour"
          title="All landmarks"
          subtitle="Revisit stops you've seen or preview any landmark on the route"
          className="mb-4"
        />
        <div className="space-y-4">
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

      <GlassPanel className={cn('mt-6 p-5', motionCardRise)}>
        <p className="text-eyebrow uppercase text-terracotta">Included</p>
        <ul className="mt-3 space-y-2 text-sm text-soft-slate">
          <li>GPS-guided walking between landmarks</li>
          <li>Place-aware audio stories on arrival</li>
          <li>Then-and-now visual reconstructions</li>
        </ul>
      </GlassPanel>
    </PageShell>
  )
}

export default TourOverviewView
