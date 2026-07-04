import { cn, metaLabel } from '../ui'

const STATUS_LABELS = {
  visited: 'Visited',
  current: 'Current',
  upcoming: 'Upcoming',
}

/**
 * Minimal launch stop row — reference list, not a quest card.
 */
export default function JourneyStopCard({ stop, status = 'upcoming', onPress, className }) {
  const isVisited = status === 'visited'
  const isCurrent = status === 'current'
  const isUpcoming = status === 'upcoming'
  const interactive = Boolean(onPress) && (isVisited || isCurrent)

  const content = (
    <>
      <div
        className={cn(
          'relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-parchment/60',
          isUpcoming && 'opacity-70'
        )}
      >
        {stop.heroImage ? (
          <img
            src={stop.heroImage}
            alt=""
            className={cn('h-full w-full object-cover', isUpcoming && 'grayscale-[0.15]')}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-soft-slate">
            —
          </div>
        )}
        <span
          className={cn(
            'absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-bold',
            isCurrent
              ? 'bg-gold text-obsidian ring-2 ring-gold/35'
              : isVisited
                ? 'bg-ivory/95 text-deep-slate'
                : 'bg-ivory/90 text-soft-slate'
          )}
        >
          {stop.number}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              'font-display text-base font-semibold leading-snug',
              isCurrent ? 'text-deep-slate' : isUpcoming ? 'text-soft-slate' : 'text-deep-slate'
            )}
          >
            {stop.shortTitle ?? stop.title}
          </p>
          <span
            className={cn(
              metaLabel,
              'shrink-0 pt-0.5',
              isCurrent && 'text-gold',
              isVisited && 'text-olive',
              isUpcoming && 'text-soft-slate/80'
            )}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
        {isVisited ? (
          <p className="mt-1 text-xs text-soft-slate">Tap to reopen</p>
        ) : null}
      </div>
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onPress}
        className={cn(
          'flex w-full items-center gap-4 rounded-2xl border px-3 py-3 text-left transition-colors',
          isCurrent
            ? 'border-gold/45 bg-gold/[0.06] shadow-sm'
            : 'border-parchment/80 bg-ivory hover:border-bronze/25 hover:bg-parchment/20',
          className
        )}
        data-testid={`journey-stop-card-${stop.id}`}
        data-status={status}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-2xl border border-parchment/60 bg-ivory/70 px-3 py-3',
        isUpcoming && 'opacity-75',
        className
      )}
      data-testid={`journey-stop-card-${stop.id}`}
      data-status={status}
      aria-disabled={isUpcoming}
    >
      {content}
    </div>
  )
}
