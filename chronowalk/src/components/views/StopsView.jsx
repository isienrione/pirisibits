import TourStopCard from '../TourStopCard'
import { JourneyProgressPanel } from '../journey/JourneyProgressPanel'
import { GlassPanel, PageShell, SectionHeader } from '../ui'

function StopsView({ tour, progress, mapStops, waypointsById, onOpenStop, onNavigate }) {
  const stops = mapStops?.length
    ? mapStops
    : (tour?.stopIds ?? []).map((id, index) => ({
        id,
        title: id,
        status: index === 0 ? 'current' : 'upcoming',
      }))

  return (
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Route"
        title={tour?.title ?? 'Tour stops'}
        subtitle={`${stops.length} landmarks along your walking route`}
      />

      {tour && progress ? (
        <GlassPanel className="mt-6 p-5">
          <JourneyProgressPanel tour={tour} arrivedStopIds={progress.arrivedStopIds} compact />
        </GlassPanel>
      ) : null}

      <div className="mt-6 space-y-4">
        {stops.map((stop, index) => (
          <TourStopCard
            key={stop.id}
            stop={stop}
            index={index}
            waypoint={waypointsById?.[stop.id]}
            onOpen={(stopId) => {
              onOpenStop?.(stopId)
              onNavigate?.()
            }}
          />
        ))}
      </div>
    </PageShell>
  )
}

export default StopsView
