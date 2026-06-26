import { Button } from './Button'
import { GlassPanel } from './GlassPanel'
import { cn } from './cn'
import { EMPTY_STATE_ICONS } from './emptyStateIcons'
import { EMPTY_STATE_PRESETS } from './emptyStatePresets'

export function EmptyState({
  icon: IconProp,
  preset,
  title,
  body,
  eyebrow,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  className,
  children,
}) {
  const presetCopy = preset ? EMPTY_STATE_PRESETS[preset] : null
  const Icon = IconProp ?? (presetCopy?.icon ? EMPTY_STATE_ICONS[presetCopy.icon] : null)
  const resolvedEyebrow = eyebrow ?? presetCopy?.eyebrow ?? null
  const resolvedTitle = title ?? presetCopy?.title
  const resolvedBody = body ?? presetCopy?.body
  const resolvedAction = actionLabel ?? presetCopy?.actionLabel
  const resolvedSecondary = secondaryActionLabel ?? presetCopy?.secondaryActionLabel

  if (compact) {
    return (
      <GlassPanel
        role="status"
        className={cn(
          'rounded-2xl border-limestone/70 bg-warm-white/95 shadow-glass',
          'px-4 py-3 text-left',
          className
        )}
      >
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
              <Icon className="h-4 w-4" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            {resolvedTitle ? (
              <p className="text-sm font-semibold text-deep-slate">{resolvedTitle}</p>
            ) : null}
            {resolvedBody ? (
              <p className="mt-1 text-xs leading-relaxed text-soft-slate">{resolvedBody}</p>
            ) : null}
            {children}
            {resolvedAction && onAction ? (
              <Button variant="secondary" size="sm" className="mt-3" onClick={onAction}>
                {resolvedAction}
              </Button>
            ) : null}
          </div>
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel
      role="status"
      className={cn(
        'rounded-3xl border-limestone/70 bg-warm-white/95 text-center shadow-glass',
        'px-6 py-6',
        className
      )}
    >
      {Icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}

      {resolvedEyebrow ? (
        <p className="text-eyebrow uppercase text-gold">{resolvedEyebrow}</p>
      ) : null}

      {resolvedTitle ? (
        <p
          className={cn(
            'font-semibold text-deep-slate',
            resolvedEyebrow ? 'mt-2 font-display text-2xl leading-tight' : 'text-base'
          )}
        >
          {resolvedTitle}
        </p>
      ) : null}

      {resolvedBody ? (
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">{resolvedBody}</p>
      ) : null}

      {children}

      {resolvedAction && onAction ? (
        <Button
          variant={preset === 'tourCompleted' ? 'primary' : 'secondary'}
          size={preset === 'tourCompleted' ? 'lg' : 'md'}
          className={cn('mt-5 w-full')}
          onClick={onAction}
        >
          {resolvedAction}
        </Button>
      ) : null}

      {resolvedSecondary && onSecondaryAction ? (
        <Button variant="secondary" size="md" className="mt-2 w-full" onClick={onSecondaryAction}>
          {resolvedSecondary}
        </Button>
      ) : null}
    </GlassPanel>
  )
}

export default EmptyState
