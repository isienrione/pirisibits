import { FREE_PREVIEW_STOP_ID } from '../../data/freePreview'
import { getWaypointGeo } from '../../data/waypointGeo'
import { estimateWalkMinutes } from '../../utils/tourStats'
import TourStopCard from '../TourStopCard'
import { Button, GlassPanel, PageShell, ProgressPill, SectionHeader, ctaInCard, cn } from '../ui'
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
  isFreePreview = false,
  onNavigate,
  onGetDirections,
  onOpenStop,
  onUnlockTour,
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
        eyebrow={isFreePreview ? 'Free preview' : 'Your journey'}
        title={tour.title}
        subtitle={
          isFreePreview
            ? 'Full bundled route on the map — Colosseum unlocked, every other stop locked until purchase'
            : tour.subtitle
        }
      />

      {isFreePreview ? (
        <GlassPanel className="mt-6 border-gold/30 bg-gold/[0.05] p-5">
          <p className="text-eyebrow uppercase text-gold">Sample unlocked</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-deep-slate">
            Colosseum reconstruction &amp; intro audio
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-soft-slate">
            Explore the full tour map and stop list below. Tap the Colosseum to try the immersive
            experience — locked landmarks show what you get when you buy.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              fullWidth
              className={ctaInCard}
              onClick={() => onOpenStop?.(FREE_PREVIEW_STOP_ID)}
            >
              Open Colosseum preview
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

      {!isFreePreview && isAwaitingFirstStop ? (
        <GlassPanel className="mt-6 border-gold/30 bg-gold/[0.05] p-5">
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

      <GlassPanel className="mt-6 p-5">
        <ProgressPill
          current={currentStop}
          total={totalStops}
          label={
            isFreePreview
              ? `Free preview · ${totalStops} landmarks`
              : `Stop ${currentStop} of ${totalStops}`
          }
          status={isFreePreview ? 'Colosseum unlocked' : statusLabel}
        />

        {!isFreePreview ? (
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
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-soft-slate">
            The complete Rome bundle includes the Roman Forum cluster and the city loop —{' '}
            {totalStops} landmarks with audio and reconstructions at each stop.
          </p>
        )}

        <Button fullWidth className={cn(ctaInCard, 'mt-5')} onClick={() => onNavigate(NAV_TABS.MAP)}>
          Open map
        </Button>

        {isFreePreview ? (
          <Button
            variant="secondary"
            fullWidth
            className={cn(ctaInCard, 'mt-3')}
            onClick={() => onUnlockTour?.()}
          >
            View tours &amp; pricing
          </Button>
        ) : null}
      </GlassPanel>

      <div className="mt-6">
        <SectionHeader
          align="left"
          eyebrow="Complete tour"
          title="All landmarks"
          subtitle={
            isFreePreview
              ? 'Tap locked stops to see what you are missing'
              : "Revisit stops you've seen or preview any landmark on the route"
          }
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
              lockedActionLabel={isFreePreview ? 'View pricing' : 'Unlock tour'}
              onOpen={(stopId) => {
                if (stop.status === 'locked' && isFreePreview) {
                  onUnlockTour?.()
                  return
                }
                onOpenStop?.(stopId)
                onNavigate(NAV_TABS.MAP)
              }}
            />
          ))}
        </div>
      </div>

      <GlassPanel className="mt-6 p-5">
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
