import { getModernPosterUrl } from '../../utils/sliderMedia'
import {
  GlassPanel,
  PageShell,
  SectionHeader,
  cn,
  focusRing,
  statusArrived,
  statusCurrent,
  statusLocked,
  statusPill,
} from '../ui'
import { NAV_TABS } from '../navigation/navConfig'

const STATUS_META = {
  completed: { label: 'Visited', className: statusArrived },
  current: { label: 'Current', className: statusCurrent },
  upcoming: { label: 'Locked', className: statusLocked },
}

function LockIcon() {
  return (
    <svg className="h-4 w-4 text-soft-slate" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StopCard({ stop, index, waypoint, onSelect }) {
  const status = STATUS_META[stop.status] ?? STATUS_META.upcoming
  const posterUrl = waypoint ? getModernPosterUrl(waypoint) : null
  const subtitle =
    waypoint?.arrival_subtitle ?? 'Audio story and historical reveal on arrival.'
  const isCurrent = stop.status === 'current'
  const isUpcoming = stop.status === 'upcoming'

  return (
    <button
      type="button"
      onClick={() => onSelect?.(stop.id)}
      aria-label={`View ${stop.title} on map`}
      className={cn('w-full rounded-3xl text-left', focusRing)}
    >
      <GlassPanel
        className={cn(
          'overflow-hidden transition hover:border-gold/40 hover:shadow-glass-lg',
          isCurrent && 'border-gold/40 bg-gold/[0.06] shadow-glass-lg',
          isUpcoming && 'opacity-90'
        )}
      >
        <div className="flex gap-0 sm:gap-4">
          <div
            className={cn(
              'relative w-28 shrink-0 overflow-hidden bg-gradient-to-br from-sand to-limestone/50 sm:w-32',
              isUpcoming && 'grayscale-[0.35]'
            )}
          >
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
            {isUpcoming ? (
              <div className="absolute inset-0 flex items-center justify-center bg-warm-white/35">
                <LockIcon />
              </div>
            ) : null}
            <span
              className={cn(
                'absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm',
                isCurrent
                  ? 'bg-gold/90 text-warm-white ring-2 ring-gold/30'
                  : 'bg-warm-white/92 text-deep-slate'
              )}
            >
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
                  statusPill,
                  'shrink-0 gap-1 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide',
                  status.className
                )}
              >
                {isUpcoming ? <LockIcon /> : null}
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
    <PageShell>
      <SectionHeader
        align="left"
        eyebrow="Route"
        title={tour?.title ?? 'Tour stops'}
        subtitle={`${stops.length} landmarks · tap a stop to open the map`}
      />

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
    </PageShell>
  )
}

export default StopsView
