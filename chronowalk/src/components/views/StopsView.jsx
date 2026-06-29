import TourStopCard from '../TourStopCard'
import { PageShell, SectionHeader } from '../ui'

function StopsView({
  tour,
  mapStops,
  waypointsById,
  isFreePreview = false,
  onOpenStop,
  onNavigate,
  onUnlockTour,
}) {
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
        eyebrow={isFreePreview ? 'Free preview' : 'Route'}
        title={tour?.title ?? 'Tour stops'}
        subtitle={
          isFreePreview
            ? `${stops.length} landmarks on the map · Colosseum unlocked · tap locked stops to see what you are missing`
            : `${stops.length} landmarks · revisit visited stops or preview any landmark`
        }
      />

      <div className="mt-6 space-y-4">
        {stops.map((stop, index) => (
          <TourStopCard
            key={stop.id}
            stop={stop}
            index={index}
            waypoint={waypointsById?.[stop.id]}
            lockedActionLabel={isFreePreview ? 'View pricing' : 'Unlock tour'}
            onOpen={(stopId) => {
              if (stop.status === 'locked' && isFreePreview) {
                onUnlockTour?.()
                return
              }
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
