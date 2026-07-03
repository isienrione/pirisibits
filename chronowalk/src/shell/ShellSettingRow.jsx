import { Toggle } from '../components/ui'

export default function ShellSettingRow({
  icon: Icon,
  title,
  description,
  value,
  checked,
  onToggle,
  onPress,
  actionLabel,
}) {
  return (
    <div className="flex items-center gap-3 py-4 first:pt-4 last:pb-4">
      {Icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,var(--bone))] text-accent">
          <Icon />
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
        {onPress ? (
          <button
            type="button"
            onClick={onPress}
            className="mt-2 text-sm font-semibold text-accent"
          >
            {actionLabel ?? 'Try again'}
          </button>
        ) : null}
      </div>

      {onToggle ? (
        <Toggle checked={checked} onChange={onToggle} label={title} />
      ) : value ? (
        <span className="shrink-0 text-sm font-semibold text-ink-muted">{value}</span>
      ) : null}
    </div>
  )
}
