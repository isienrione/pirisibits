import { JOURNEY_STATE } from '../../hooks/useGeoLocation'
import { getWaypointGeo } from '../../data/waypointGeo'
import { Button, GlassPanel, ProgressPill, SectionHeader } from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

function TourOverviewView({
  tour,
  progress,
  targetStopId,
  nextWaypoint,
  state,
  distance,
  transitLegActive,
  onNavigate,
}) {
  if (!tour) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-soft-slate">
        <p>Single-stop mode — open the map to explore this landmark.</p>
      </div>
    )
  }

  const totalStops = tour.stopIds.length
  const currentStop = Math.min(progress.targetStopIndex + 1, totalStops)
  const currentTitle = getWaypointGeo(targetStopId)?.title ?? 'Current stop'
  const statusLabel =
    state === JOURNEY_STATE.ARRIVAL
      ? 'At stop'
      : transitLegActive
        ? 'Walking'
        : 'En route'

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-warm-white via-sand/20 to-limestone/15 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <div className="mx-auto max-w-2xl px-6 pb-safe pt-safe lg:pt-10">
        <SectionHeader
          align="left"
          eyebrow="Your journey"
          title={tour.title}
          subtitle={tour.subtitle}
        />

        <GlassPanel className="mt-6 rounded-3xl p-5">
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

          <Button fullWidth className="mt-5 rounded-2xl" onClick={() => onNavigate(NAV_TABS.MAP)}>
            Open map
          </Button>
        </GlassPanel>

        <GlassPanel className="mt-4 rounded-3xl p-5">
          <p className="text-eyebrow uppercase text-terracotta">Included</p>
          <ul className="mt-3 space-y-2 text-sm text-soft-slate">
            <li>GPS-guided walking between landmarks</li>
            <li>Place-aware audio stories on arrival</li>
            <li>Then-and-now visual reconstructions</li>
          </ul>
        </GlassPanel>
      </div>
    </div>
  )
}

export default TourOverviewView
