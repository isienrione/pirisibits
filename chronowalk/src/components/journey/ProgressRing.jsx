import { cn } from '../ui'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function ProgressRing({
  value = 0,
  size = 80,
  strokeWidth = 6,
  showPercent = true,
  label,
  className,
  trackClassName = 'text-limestone/55',
  progressClassName = 'text-gold',
}) {
  const reducedMotion = useReducedMotion()
  const safeValue = Math.min(Math.max(value, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeValue / 100) * circumference
  const center = size / 2

  return (
    <div
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Journey ${safeValue}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={trackClassName}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className={cn(
            progressClassName,
            !reducedMotion && 'transition-[stroke-dashoffset] duration-700 ease-out'
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {showPercent ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-lg font-semibold tabular-nums leading-none text-deep-slate">
            {safeValue}%
          </span>
          {label ? (
            <span className="mt-1 max-w-[4.5rem] text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-soft-slate">
              {label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
