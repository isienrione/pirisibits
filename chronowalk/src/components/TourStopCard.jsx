import { getModernCoverUrl } from '../utils/sliderMedia'
import {
  ParchmentCard,
  cn,
  statusPill,
} from './ui'

const STATUS_META = {
  completed: {
    label: 'Explore',
    className: 'text-soft-slate',
    cardClass: 'hover:border-bronze/35 hover:shadow-plaque-lg',
    watermark: 'text-parchment/80',
  },
  current: {
    label: 'Current stop',
    className: 'text-sky-blue',
    cardClass: 'border-bronze/35 bg-[#e8d4b8]/45 shadow-plaque-lg',
    watermark: 'text-bronze/20',
  },
  upcoming: {
    label: 'Next stop',
    className: 'text-soft-slate',
    cardClass: 'hover:border-bronze/35 hover:shadow-plaque-lg',
    watermark: 'text-parchment/70',
  },
  locked: {
    label: 'Locked',
    className: 'text-soft-slate',
    cardClass: 'opacity-95 hover:border-bronze/30',
    watermark: 'text-parchment/60',
  },
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-olive" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="h-4 w-4 text-bronze" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
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

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckIcon />
  if (status === 'current') return <TargetIcon />
  if (status === 'locked') return <LockIcon />
  return null
}

export function TourStopCard({
  stop,
  index,
  waypoint,
  onOpen,
  lockedActionLabel = 'Unlock tour',
}) {
  const status = STATUS_META[stop.status] ?? STATUS_META.upcoming
  const posterUrl = waypoint ? getModernCoverUrl(waypoint) : null
  const isLocked = stop.status === 'locked'
  const stopNumber = String(index + 1).padStart(2, '0')

  return (
    <ParchmentCard
      as="button"
      type="button"
      onClick={() => onOpen?.(stop.id)}
      className={cn('w-full overflow-hidden text-left transition', status.cardClass)}
    >
      <div className="flex items-stretch gap-0">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-gradient-to-br from-parchment to-limestone/50 sm:h-28 sm:w-28">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-soft-slate">
              Preview soon
            </div>
          )}
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-ivory/30">
              <LockIcon />
            </div>
          ) : null}
        </div>

        <div className="relative min-w-0 flex-1 px-4 py-4 pr-5">
          <span
            className={cn(
              'pointer-events-none absolute right-3 top-1 font-display text-5xl font-bold leading-none',
              status.watermark
            )}
            aria-hidden="true"
          >
            {stopNumber}
          </span>

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold leading-tight text-deep-slate">
                {stop.title}
              </h3>
              <p className={cn('mt-2 text-xs font-semibold uppercase tracking-[0.12em]', status.className)}>
                {status.label}
              </p>
            </div>
            <span className={cn(statusPill, 'shrink-0 bg-transparent p-0')}>
              <StatusIcon status={stop.status} />
            </span>
          </div>
        </div>
      </div>
    </ParchmentCard>
  )
}

export default TourStopCard
