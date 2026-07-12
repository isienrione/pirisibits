import { cn } from './ui'

export function formatStepDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function DirectionsStepList({
  steps = [],
  currentStepIndex = 0,
  className,
  compact = false,
}) {
  if (!steps.length) return null

  return (
    <ol className={cn(compact ? 'space-y-2' : 'space-y-3', className)}>
      {steps.map((step, index) => {
        const isCurrent = index === currentStepIndex
        const isPast = index < currentStepIndex

        return (
          <li
            key={`${step.instruction}-${index}`}
            className={cn(
              'flex gap-3 rounded-2xl border px-3 py-3',
              isCurrent
                ? 'border-ember/50 bg-ember/10'
                : isPast
                  ? 'border-ink800/50 bg-ink900/60 opacity-80'
                  : 'border-ink800/70 bg-ink900/80'
            )}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isCurrent
                  ? 'bg-ember text-obsidian'
                  : isPast
                    ? 'bg-ember/15 text-ember'
                    : 'bg-ember/15 text-ember'
              )}
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p
                className={cn(
                  'text-sm leading-relaxed',
                  isCurrent ? 'font-semibold text-ink900' : 'text-ink900'
                )}
              >
                {step.instruction}
              </p>
              {step.distanceM > 0 ? (
                <p className="mt-1 text-xs text-muted">
                  {formatStepDistance(step.distanceM)}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
