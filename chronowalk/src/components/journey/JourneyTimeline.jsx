import { cn } from '../ui'

const STATUS_STYLES = {
  completed: {
    dot: 'border-olive bg-olive',
    line: 'bg-olive/50',
    title: 'text-deep-slate',
    caption: 'Visited',
    captionClass: 'text-olive',
  },
  current: {
    dot: 'border-gold bg-gold/20 ring-4 ring-gold/15',
    line: 'bg-gold/35',
    title: 'text-deep-slate',
    caption: 'You are here',
    captionClass: 'text-gold',
  },
  upcoming: {
    dot: 'border-limestone bg-warm-white',
    line: 'bg-limestone/60',
    title: 'text-soft-slate',
    caption: 'Ahead on route',
    captionClass: 'text-soft-slate',
  },
}

export function JourneyTimeline({ stops = [], className, compact = false }) {
  if (!stops.length) return null

  return (
    <ol className={cn('space-y-0', className)} aria-label="Journey timeline">
      {stops.map((stop, index) => {
        const palette = STATUS_STYLES[stop.status] ?? STATUS_STYLES.upcoming
        const isLast = index === stops.length - 1

        return (
          <li key={stop.id} className="relative flex gap-3 sm:gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'relative z-[1] mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2',
                  palette.dot,
                  stop.status === 'current' && 'animate-journey-current-pulse'
                )}
                aria-hidden="true"
              />
              {!isLast ? (
                <span
                  className={cn('my-1 w-0.5 flex-1 min-h-[2.5rem] rounded-full', palette.line)}
                  aria-hidden="true"
                />
              ) : null}
            </div>

            <div className={cn('min-w-0 flex-1', !isLast && (compact ? 'pb-4' : 'pb-5'))}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      'font-display font-semibold leading-tight',
                      compact ? 'text-base' : 'text-lg',
                      palette.title
                    )}
                  >
                    {stop.title}
                  </p>
                  <p className={cn('mt-1 text-xs font-medium uppercase tracking-[0.12em]', palette.captionClass)}>
                    {palette.caption}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-soft-slate/80">
                  {index + 1}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
