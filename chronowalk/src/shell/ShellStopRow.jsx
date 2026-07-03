import { ParchmentCard, cn, statusArrived, statusCurrent, statusLocked, statusPill } from '../components/ui'

const STATUS_COPY = {
  completed: { label: 'Explore', pill: statusArrived },
  current: { label: 'Current Stop', pill: statusCurrent },
  upcoming: { label: 'Next Stop', pill: statusLocked },
  locked: { label: 'Locked', pill: statusLocked },
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-verdigris" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="h-5 w-5 text-ink-muted" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Presentational stop row — all content via props; no manifest imports.
 */
export default function ShellStopRow({
  index,
  title,
  subtitle,
  imageUrl,
  status = 'upcoming',
  onPress,
  disabled = false,
}) {
  const meta = STATUS_COPY[status] ?? STATUS_COPY.upcoming
  const isCurrent = status === 'current'

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled || !onPress}
      className="w-full text-left disabled:cursor-default"
    >
      <ParchmentCard
        className={cn(
          'overflow-hidden transition',
          isCurrent && 'border-[color-mix(in_srgb,var(--accent)_35%,var(--bone))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--bone))]',
          onPress && !disabled && 'hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--bone))]'
        )}
      >
        <div className="flex items-center gap-3 p-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-track-daylight">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Stop
              </div>
            )}
            <span className="absolute left-1.5 top-1.5 rounded-full bg-bone px-1.5 py-0.5 text-[11px] font-bold text-ink shadow-card">
              {index + 1}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-medium text-ink">{title}</p>
            <p className="mt-0.5 text-sm text-ink-muted">{subtitle ?? meta.label}</p>
          </div>

          <div className="shrink-0">
            {status === 'completed' ? (
              <CheckIcon />
            ) : status === 'locked' ? (
              <LockIcon />
            ) : status === 'current' ? (
              <TargetIcon />
            ) : (
              <span className={cn(statusPill, meta.pill)}>{meta.label}</span>
            )}
          </div>
        </div>
      </ParchmentCard>
    </button>
  )
}
