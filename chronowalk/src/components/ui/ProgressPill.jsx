import { cn } from './cn'
import { metaLabel, statusNeutral } from './styles'

export function ProgressPill({
  current,
  total,
  label,
  status,
  className,
}) {
  const safeCurrent = Math.min(Math.max(current, 0), total)
  const progress = total > 0 ? (safeCurrent / total) * 100 : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn(metaLabel, 'text-soft-slate')}>
          {label ?? `Stop ${safeCurrent} of ${total}`}
        </span>
        {status ? (
          <span className={cn('rounded-full px-2 py-0.5', metaLabel, statusNeutral)}>
            {status}
          </span>
        ) : null}
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-limestone/60"
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={label ?? `Tour progress: stop ${safeCurrent} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-terracotta motion-reduce:transition-none transition-[width] duration-350 ease-motion-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
