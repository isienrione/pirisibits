import { getWaypointGeo } from '../../data/waypointGeo'
import { formatElapsedDuration, formatWalkedDistance, getJourneyProgress } from '../../utils/tourStats'
import TourStopCard from '../TourStopCard'
import { JourneyProgressPanel } from '../journey/JourneyProgressPanel'
import { JourneyTimeline } from '../journey/JourneyTimeline'
import { Button, GlassPanel, PageShell, SectionHeader, ctaInCard } from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

function MemoryStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-limestone/60 bg-warm-white/70 px-4 py-3 text-center">
      <p className="font-display text-xl font-semibold tabular-nums text-deep-slate">{value}</p>
      <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
        {label}
      </p>
    </div>
  )
}

function JourneySummaryView({
  tour,
  progress,
  mapStops,
  waypointsById,
  walkedMeters,
  onNavigate,
  onOpenStop,
}) {
  if (!tour) return null

  const { visited, total } = getJourneyProgress(tour, progress.arrivedStopIds)
  const startedAtMs = progress.startedAtMs
  const completedAtMs = progress.completedAtMs

  const stops = mapStops?.length
    ? mapStops
    : tour.stopIds.map((id, index) => ({
        id,
        title: getWaypointGeo(id)?.title ?? id,
        status: progress.arrivedStopIds.includes(id) ? 'completed' : 'upcoming',
        index,
      }))

  const visitedStops = stops.filter((stop) => stop.status === 'completed')

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Your journey"
        title="Rome, remembered"
        subtitle="A quiet record of the path you walked and the places that opened along the way."
      />

      <GlassPanel className="mt-6 overflow-hidden p-5 sm:p-6">
        <JourneyProgressPanel tour={tour} arrivedStopIds={progress.arrivedStopIds} />

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MemoryStat label="Distance walked" value={formatWalkedDistance(walkedMeters)} />
          <MemoryStat label="Time exploring" value={formatElapsedDuration(startedAtMs)} />
          <div className="col-span-2 sm:col-span-1">
            <MemoryStat label="Landmarks reached" value={`${visited}/${total}`} />
          </div>
        </div>
      </GlassPanel>

      <div className="mt-6">
        <SectionHeader
          align="left"
          eyebrow="Journey timeline"
          title="Stops along your route"
          subtitle="Each landmark you reached becomes part of the story you carry home."
          className="mb-4"
        />
        <GlassPanel className="p-5 sm:p-6">
          <JourneyTimeline stops={stops} />
        </GlassPanel>
      </div>

      {visitedStops.length ? (
        <div className="mt-6">
          <SectionHeader
            align="left"
            eyebrow="Memories"
            title="Places you visited"
            subtitle="Revisit any stop to hear its story again or see the historical reveal."
            className="mb-4"
          />
          <div className="space-y-4">
            {visitedStops.map((stop, index) => (
              <TourStopCard
                key={stop.id}
                stop={stop}
                index={tour.stopIds.indexOf(stop.id)}
                waypoint={waypointsById?.[stop.id]}
                compact
                actionLabel="Revisit"
                onOpen={(stopId) => {
                  onOpenStop?.(stopId)
                  onNavigate(NAV_TABS.MAP)
                }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <GlassPanel className="mt-6 p-5 text-center">
        <p className="font-display text-lg font-semibold text-deep-slate">
          Thank you for walking with ChronoWalk
        </p>
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">
          {completedAtMs
            ? 'This route is complete. The city will be here when you return.'
            : 'Your journey continues with every step.'}
        </p>
        <Button fullWidth className={ctaInCard + ' mt-5'} onClick={() => onNavigate(NAV_TABS.MAP)}>
          Return to map
        </Button>
      </GlassPanel>
    </PageShell>
  )
}

export default JourneySummaryView
