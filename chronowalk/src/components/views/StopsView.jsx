import TourStopCard from '../TourStopCard'
import { PageShell, SectionHeader } from '../ui'

function StopsView({ tour, mapStops, waypointsById, onOpenStop, onNavigate }) {
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
        subtitle={`${stops.length} landmarks · revisit visited stops or preview any landmark`}
      />

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
