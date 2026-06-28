import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import { getWaypointGeo } from '../../data/waypointGeo'
import { estimateWalkMinutes } from '../../utils/tourStats'
import { JourneyProgressPanel } from '../journey/JourneyProgressPanel'
import { JourneyTimeline } from '../journey/JourneyTimeline'
import { Button, GlassPanel, PageShell, SectionHeader, ctaInCard, cn } from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

function TourOverviewView({
  tour,
  progress,
  mapStops,
  targetStopId,
  nextWaypoint,
  state,
  distance,
  transitLegActive,
  isAwaitingFirstStop,
  firstStopTitle,
  onNavigate,
  onGetDirections,
}) {
  if (!tour) {
    return (
      <PageShell containerClassName="flex min-h-[50vh] items-center justify-center text-center">
        <p className="text-soft-slate">Single-stop mode — open the map to explore this landmark.</p>
      </PageShell>
    )
  }

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
        <GlassPanel variant="callout" className="mt-6 p-5 sm:p-6">
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

      <GlassPanel className="mt-6 p-5 sm:p-6">
        <JourneyProgressPanel tour={tour} arrivedStopIds={progress.arrivedStopIds} />

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
          <p>
            <span className="font-semibold text-deep-slate">Status:</span> {statusLabel}
          </p>
        </div>

        <Button fullWidth className={cn(ctaInCard, 'mt-5')} onClick={() => onNavigate(NAV_TABS.MAP)}>
          Open map
        </Button>
      </GlassPanel>

      <div className="mt-6">
        <SectionHeader
          align="left"
          eyebrow="Journey timeline"
          title="Your route"
          subtitle="Follow the path from landmark to landmark through the heart of Rome"
          className="mb-4"
        />
        <GlassPanel className="mb-6 p-5 sm:p-6">
          <JourneyTimeline stops={stops} />
        </GlassPanel>

        <GlassPanel className="p-5 sm:p-6">
          <p className="text-eyebrow uppercase text-terracotta">All landmarks</p>
          <p className="mt-2 text-sm leading-relaxed text-soft-slate">
            Browse every stop on the route, revisit places you&apos;ve seen, or preview landmarks
            ahead.
          </p>
          <Button
            variant="secondary"
            fullWidth
            className={cn(ctaInCard, 'mt-4')}
            onClick={() => onNavigate(NAV_TABS.STOPS)}
          >
            View all stops
          </Button>
        </GlassPanel>
      </div>

      <GlassPanel className="mt-6 p-5 sm:p-6">
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
