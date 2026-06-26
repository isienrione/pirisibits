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
  const resolvedTitle = title ?? presetCopy?.title
  const resolvedBody = body ?? presetCopy?.body
  const resolvedAction = actionLabel ?? presetCopy?.actionLabel

  return (
    <GlassPanel
      role="status"
      className={cn(
        'rounded-3xl border-limestone/70 bg-warm-white/95 text-center shadow-glass',
        compact ? 'px-4 py-3 text-left' : 'px-6 py-6',
        className
      )}
    >
      {Icon && !compact ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}

      {resolvedTitle ? (
        <p className={cn('font-semibold text-deep-slate', compact ? 'text-sm' : 'text-base')}>
          {resolvedTitle}
        </p>
      ) : null}

      {resolvedBody && !compact ? (
        <p className="mt-2 text-sm leading-relaxed text-soft-slate">{resolvedBody}</p>
      ) : null}

      {children}

      {resolvedAction && onAction ? (
        <Button
          variant="secondary"
          size={compact ? 'sm' : 'md'}
          className={cn(compact ? 'mt-3' : 'mt-5', !compact && 'w-full')}
          onClick={onAction}
        >
          {resolvedAction}
        </Button>
      ) : null}

      {secondaryActionLabel && onSecondaryAction ? (
        <Button
          variant="ghost"
          size="sm"
          className={cn('mt-2', !compact && 'w-full')}
          onClick={onSecondaryAction}
        >
          {secondaryActionLabel}
        </Button>
      ) : null}
    </GlassPanel>
  )
}

export default EmptyState
