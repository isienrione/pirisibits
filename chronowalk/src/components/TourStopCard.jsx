import { getModernCoverUrl, getModernPosterUrl } from '../utils/sliderMedia'
import {
  Button,
  FadeImage,
  GlassPanel,
  cn,
  focusRing,
  motionCardRise,
  statusArrived,
  statusCurrent,
  statusLocked,
  statusPill,
  LockIcon,
  typeBodySm,
  typeBodySmMuted,
  typeCaption,
  typeSectionTitleSm,
} from './ui'

const STATUS_META = {
  completed: { label: 'Visited', className: statusArrived },
  current: { label: 'Current', className: statusCurrent },
  upcoming: { label: 'Ahead', className: statusLocked },
}

function LockIconWrapper() {
  return <LockIcon size="sm" className="text-soft-slate" />
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
        motionCardRise,
        'overflow-hidden transition-colors duration-250 ease-motion-out hover:border-gold/40 hover:shadow-glass-lg',
        isCurrent && 'border-gold/40 bg-gold/[0.06] shadow-glass-lg'
      )}
    >
      <div className={cn('flex', compact ? 'flex-col' : 'gap-0 sm:gap-4')}>
        <div
          className={cn(
            'relative shrink-0 overflow-hidden bg-gradient-to-br from-sand to-limestone/50',
            compact ? 'h-36 w-full' : 'w-28 sm:w-32',
            !compact && 'min-h-[7rem]'
          )}
        >
          {posterUrl ? (
            <FadeImage
              src={posterUrl}
              placeholderSrc={waypoint ? getModernPosterUrl(waypoint) : undefined}
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[7rem] items-center justify-center bg-gradient-to-br from-sand to-limestone/50 px-2 text-center">
              <p className={typeCaption}>Preview soon</p>
            </div>
          )}
          {isUpcoming ? (
            <div className="absolute inset-0 flex items-center justify-center bg-warm-white/20">
              <LockIconWrapper />
            </div>
          ) : null}
          <span
            className={cn(
              'absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-caption font-medium shadow-sm',
              isCurrent
                ? 'bg-gold/90 text-warm-white ring-2 ring-gold/30'
                : 'bg-warm-white/92 text-deep-slate'
            )}
          >
            {index + 1}
          </span>
        </div>

        <div className={cn('min-w-0 flex-1', compact ? 'p-5' : 'px-5 py-5 pr-6')}>
          <div className="flex items-start justify-between gap-3">
            <h3 className={typeSectionTitleSm}>
              {stop.title}
            </h3>
            <span
              className={cn(
                statusPill,
                'shrink-0 gap-1 px-2.5 py-1 uppercase tracking-wide',
                status.className
              )}
            >
              {isUpcoming ? <LockIconWrapper /> : null}
              {status.label}
            </span>
          </div>
          <p className={cn(typeBodySmMuted, 'mt-3 line-clamp-2')}>{subtitle}</p>
          <Button
            variant={isVisited || isCurrent ? 'primary' : 'secondary'}
            size="sm"
            className={cn('mt-5', focusRing)}
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
