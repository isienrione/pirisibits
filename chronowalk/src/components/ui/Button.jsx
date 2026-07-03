import { cn } from './cn'
import { focusRing, tapAction } from './focusRing'
import { usePressHandlers } from './usePressHandlers'

const variantStyles = {
  primary:
    'border border-[color-mix(in_srgb,var(--accent)_35%,var(--bone))] bg-accent text-bone hover:opacity-95 active:opacity-90',
  secondary:
    'border border-border-daylight bg-bone text-ink hover:border-[color-mix(in_srgb,var(--accent)_25%,var(--bone))]',
  ghost:
    'border border-border-daylight bg-transparent text-accent hover:bg-[color-mix(in_srgb,var(--accent)_8%,var(--bone))]',
  'outline-dark':
    'border border-border-immersion bg-transparent font-display text-warm-white hover:bg-[color-mix(in_srgb,var(--warm-white)_8%,var(--obsidian))]',
  text: 'bg-transparent text-accent hover:opacity-80 underline-offset-2 hover:underline',
}

const sizeStyles = {
  sm: 'min-h-12 px-5 py-3 text-sm font-semibold rounded-full',
  md: 'min-h-12 px-6 py-3.5 text-sm font-semibold rounded-2xl',
  lg: 'min-h-14 px-6 py-4 text-base font-bold rounded-full',
  pill: 'min-h-12 px-6 py-3.5 text-sm font-bold rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  onClick,
  onPointerUp,
  onPointerDown,
  onPointerCancel,
  ...props
}) {
  const pressHandlers = usePressHandlers(onClick, {
    onPointerUp,
    onPointerDown,
    onPointerCancel,
  })

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-[family-name:var(--font-ui)] transition-[color,background-color,border-color,opacity] duration-200',
        tapAction,
        focusRing,
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
      {...pressHandlers}
    >
      {children}
    </button>
  )
}
