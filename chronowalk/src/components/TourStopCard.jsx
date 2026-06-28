import { getModernCoverUrl } from '../utils/sliderMedia'
import {
  Button,
  GlassPanel,
  MediaHero,
  cn,
  focusRing,
  statusArrived,
  statusCurrent,
  statusLocked,
  statusPill,
} from './ui'

const STATUS_META = {
  completed: { label: 'Visited', className: statusArrived },
  current: { label: 'Current', className: statusCurrent },
  upcoming: { label: 'Ahead', className: statusLocked },
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

export function TourStopCard({
  stop,
  index,
  waypoint,
  onOpen,
  actionLabel = 'Open',
  compact = false,
}) {
  const status = STATUS_META[stop.status] ?? STATUS_META.upcoming
  const posterUrl = waypoint ? getModernCoverUrl(waypoint) : null
  const subtitle =
    waypoint?.arrival_subtitle ?? 'Audio story and historical reveal on arrival.'
  const isCurrent = stop.status === 'current'
  const isUpcoming = stop.status === 'upcoming'
  const isVisited = stop.status === 'completed'

  return (
    <GlassPanel
      className={cn(
        'overflow-hidden transition hover:border-gold/40 hover:shadow-glass-lg',
        isCurrent && 'border-gold/40 bg-gold/[0.06] shadow-glass-lg'
      )}
    >
      <div className={cn('flex', compact ? 'flex-col' : 'gap-0 sm:gap-4')}>
        <div
          className={cn(
            'group relative shrink-0 overflow-hidden',
            compact ? 'h-40 w-full' : 'w-32 sm:w-36',
            !compact && 'min-h-[7.5rem]'
          )}
        >
          {posterUrl ? (
            <MediaHero
              src={posterUrl}
              alt=""
              aspect={compact ? '16/10' : '3/4'}
              rounded={compact ? 'none' : '2xl'}
              gradient="subtle"
              zoom
              fadeIn
              className={cn(
                'h-full w-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.02]',
                compact ? 'rounded-none' : 'm-2'
              )}
            />
          ) : (
            <div
              className={cn(
                'flex h-full min-h-[7.5rem] items-center justify-center bg-gradient-to-br from-sand to-limestone/50 px-2 text-center text-xs text-soft-slate',
                compact ? 'h-40' : 'm-2 rounded-2xl'
              )}
            >
              Preview soon
            </div>
          )}
          {isUpcoming ? (
            <div className="absolute inset-0 z-[3] flex items-center justify-center bg-warm-white/25 backdrop-blur-[1px]">
              <LockIcon />
            </div>
          ) : null}
          <span
            className={cn(
              'absolute left-3 top-3 z-[3] flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm',
              isCurrent
                ? 'bg-gold/90 text-warm-white ring-2 ring-gold/30'
                : 'bg-warm-white/92 text-deep-slate'
            )}
          >
            {index + 1}
          </span>
        </div>

        <div className={cn('min-w-0 flex-1', compact ? 'p-4' : 'px-4 py-4 pr-5')}>
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
          <Button
            variant={isVisited || isCurrent ? 'primary' : 'secondary'}
            size="sm"
            className={cn('mt-4', focusRing)}
            onClick={() => onOpen?.(stop.id)}
          >
            {isVisited ? 'Revisit' : actionLabel}
          </Button>
        </div>
      </div>
    </GlassPanel>
  )
}

export default TourStopCard
