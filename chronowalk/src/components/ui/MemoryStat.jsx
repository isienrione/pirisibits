import { cn } from './cn'
import { metaLabel } from './styles'

export function MemoryStat({ label, value, variant = 'inline', className }) {
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-2xl border border-limestone/60 bg-warm-white/70 px-4 py-3 text-center',
          className
        )}
      >
        <p className="font-display text-xl font-semibold tabular-nums text-deep-slate">{value}</p>
        <p className={cn(metaLabel, 'mt-1 text-soft-slate')}>{label}</p>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 text-center', className)}>
      <p className="font-display text-2xl font-semibold tabular-nums text-deep-slate">{value}</p>
      <p className={cn(metaLabel, 'mt-1 text-soft-slate')}>{label}</p>
    </div>
  )
}
