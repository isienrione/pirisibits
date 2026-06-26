import { cn } from './cn'

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
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold uppercase tracking-[0.16em] text-soft-slate">
          {label ?? `Stop ${safeCurrent} of ${total}`}
        </span>
        {status ? (
          <span className="rounded-full bg-sand/80 px-2 py-0.5 text-[0.65rem] font-medium text-soft-slate">
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
          className="h-full rounded-full bg-gradient-to-r from-gold to-terracotta motion-reduce:transition-none transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
