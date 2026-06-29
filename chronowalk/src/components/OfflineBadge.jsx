import { cn } from './ui'

export function OfflineBadge({ className }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-limestone/70',
        'bg-warm-white/92 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]',
        'text-soft-slate shadow-sm backdrop-blur-sm',
        className
      )}
      role="status"
      aria-label="Offline"
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-bronze" aria-hidden="true" />
      Offline
    </div>
  )
}

export default OfflineBadge
