import TourStopCard from '../TourStopCard'
import { PageShell } from '../ui'

function StopsView({
  tour,
  mapStops,
  waypointsById,
  isFreePreview = false,
  onOpenStop,
  onNavigate,
  onUnlockTour,
  onBack,
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
      <div className="flex items-start gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-parchment/80 bg-ivory text-deep-slate shadow-sm"
            aria-label="Back to map"
          >
            ←
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-semibold leading-tight text-deep-slate">
            All stops
          </h1>
          <p className="mt-1 text-sm text-soft-slate">
            {stops.length} stops in this tour
            {isFreePreview ? ' · Colosseum unlocked in free preview' : ''}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {stops.map((stop, index) => (
          <TourStopCard
            key={stop.id}
            stop={stop}
            index={index}
            waypoint={waypointsById?.[stop.id]}
            lockedActionLabel={isFreePreview ? 'View pricing' : 'Locked'}
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
