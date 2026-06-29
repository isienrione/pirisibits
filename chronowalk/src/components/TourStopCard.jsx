import { getModernCoverUrl } from '../utils/sliderMedia'
import {
  BronzeButton,
  Button,
  ParchmentCard,
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
  locked: { label: 'Locked', className: statusLocked },
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
  lockedActionLabel = 'Unlock tour',
  compact = false,
}) {
  const status = STATUS_META[stop.status] ?? STATUS_META.upcoming
  const posterUrl = waypoint ? getModernCoverUrl(waypoint) : null
  const subtitle =
    stop.status === 'locked'
      ? 'Purchase the full tour to unlock this landmark, audio story, and reconstruction.'
      : waypoint?.arrival_subtitle ?? 'Audio story and historical reveal on arrival.'
  const isCurrent = stop.status === 'current'
  const isUpcoming = stop.status === 'upcoming'
  const isLocked = stop.status === 'locked'
  const isVisited = stop.status === 'completed'

  return (
    <ParchmentCard
      className={cn(
        'overflow-hidden transition hover:border-bronze/35 hover:shadow-plaque-lg',
        isCurrent && 'border-bronze/40 bg-bronze/[0.04] shadow-plaque-lg'
      )}
    >
      <div className={cn('flex', compact ? 'flex-col' : 'gap-0 sm:gap-4')}>
        <div
          className={cn(
            'relative shrink-0 overflow-hidden bg-gradient-to-br from-parchment to-limestone/50',
            compact ? 'h-36 w-full' : 'w-28 sm:w-32',
            !compact && 'min-h-[7rem]'
          )}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full min-h-[7rem] items-center justify-center px-2 text-center text-xs text-soft-slate">
              Preview soon
            </div>
          )}
          {isUpcoming || isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ivory/25">
              <LockIcon />
            </div>
          ) : null}
          <span
            className={cn(
              'absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm',
              isCurrent
                ? 'bg-bronze text-ivory ring-2 ring-bronze/30'
                : 'bg-ivory/95 text-deep-slate'
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
              {isUpcoming || isLocked ? <LockIcon /> : null}
              {status.label}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-soft-slate">{subtitle}</p>
          {isVisited || isCurrent ? (
            <BronzeButton
              size="sm"
              className={cn('mt-4', focusRing)}
              onClick={() => onOpen?.(stop.id)}
            >
              {isLocked ? lockedActionLabel : isVisited ? 'Revisit' : actionLabel}
            </BronzeButton>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className={cn('mt-4', focusRing)}
              onClick={() => onOpen?.(stop.id)}
            >
              {isLocked ? lockedActionLabel : actionLabel}
            </Button>
          )}
        </div>
      </div>
    </ParchmentCard>
  )
}

export default TourStopCard
