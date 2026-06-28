import { getJourneyProgress } from '../../utils/tourStats'
import { ProgressRing } from './ProgressRing'
import { cn, metaLabel } from '../ui'

function JourneyStat({ label, value, className }) {
  return (
    <div className={cn('text-center', className)}>
      <p className="font-display text-2xl font-semibold tabular-nums text-deep-slate">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-soft-slate')}>{label}</p>
    </div>
  )
}

export function JourneyProgressPanel({
  tour,
  arrivedStopIds = [],
  compact = false,
  ringSize,
  className,
}) {
  const { total, visited, remaining, completionPercent } = getJourneyProgress(tour, arrivedStopIds)

  if (!total) return null

  return (
    <div
      className={cn(
        'flex items-center gap-4',
        compact ? 'gap-3' : 'gap-5 sm:gap-6',
        className
      )}
    >
      <ProgressRing
        value={completionPercent}
        size={ringSize ?? (compact ? 64 : 88)}
        strokeWidth={compact ? 5 : 6}
        label={compact ? undefined : 'Complete'}
      />

      <div
        className={cn(
          'grid min-w-0 flex-1 grid-cols-3 gap-2',
          compact ? 'gap-1.5' : 'gap-3'
        )}
      >
        <JourneyStat label="Visited" value={visited} />
        <JourneyStat label="Remaining" value={remaining} />
        <JourneyStat label="Of route" value={total} />
      </div>
    </div>
  )
}
