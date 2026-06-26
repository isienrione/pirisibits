import { getModernPosterUrl } from '../../utils/sliderMedia'
import { GlassPanel, cn } from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

const STATUS_META = {
  completed: { label: 'Visited', className: 'bg-olive/15 text-olive' },
  current: { label: 'Current', className: 'bg-gold/20 text-gold' },
  upcoming: { label: 'Ahead', className: 'bg-sand text-soft-slate' },
}

function StopCard({ stop, index, waypoint, onSelect }) {
  const status = STATUS_META[stop.status] ?? STATUS_META.upcoming
  const posterUrl = waypoint ? getModernPosterUrl(waypoint) : null
  const subtitle =
    waypoint?.arrival_subtitle ?? 'Audio story and historical reveal on arrival.'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(stop.id)}
      className="w-full text-left"
    >
      <GlassPanel className="overflow-hidden rounded-3xl transition hover:border-gold/40 hover:shadow-glass-lg">
        <div className="flex gap-0 sm:gap-4">
          <div className="relative w-28 shrink-0 overflow-hidden bg-gradient-to-br from-sand to-limestone/50 sm:w-32">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt=""
                className="h-full min-h-[7rem] w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full min-h-[7rem] items-center justify-center px-2 text-center text-xs text-soft-slate">
                Preview soon
              </div>
            )}
            <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-warm-white/92 text-xs font-bold text-deep-slate shadow-sm">
              {index + 1}
            </span>
          </div>

          <div className="min-w-0 flex-1 px-4 py-4 pr-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-semibold leading-tight text-deep-slate">
                {stop.title}
              </h3>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide',
                  status.className
                )}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-soft-slate">{subtitle}</p>
          </div>
        </div>
      </GlassPanel>
    </button>
  )
}

function StopsView({ tour, mapStops, waypointsById, onSelectStop, onNavigate }) {
  const stops = mapStops?.length
    ? mapStops
    : (tour?.stopIds ?? []).map((id, index) => ({
        id,
        title: id,
        status: index === 0 ? 'current' : 'upcoming',
      }))

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-warm-white via-sand/15 to-limestone/10 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8">
      <div className="mx-auto max-w-2xl px-6 pb-safe pt-safe lg:pt-10">
        <p className="text-eyebrow uppercase text-terracotta">Route</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-deep-slate">
          {tour?.title ?? 'Tour stops'}
        </h1>
        <p className="mt-2 text-sm text-soft-slate">
          {stops.length} landmarks · tap a stop to open the map
        </p>

        <div className="mt-6 space-y-4">
          {stops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={index}
              waypoint={waypointsById?.[stop.id]}
              onSelect={(stopId) => {
                onSelectStop?.(stopId)
                onNavigate?.(NAV_TABS.MAP)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default StopsView
