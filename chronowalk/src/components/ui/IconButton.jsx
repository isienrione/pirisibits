import { cn } from './cn'
import { focusRing, tapAction, touchTarget } from './focusRing'

const variantStyles = {
  default:
    'border-ink800 bg-bone text-ink900 hover:border-[color-mix(in_srgb,var(--accent)_40%,var(--bone))] hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--bone))]',
  ghost: 'border-transparent bg-[color-mix(in_srgb,var(--bone)_60%,transparent)] text-muted hover:bg-bone hover:text-ink900',
  solid: 'border-ink800 bg-ink800 text-ink900 hover:bg-border-daylight',
}

const sizeStyles = {
  sm: 'h-11 w-11 min-h-11 min-w-11',
  md: 'h-12 w-12 min-h-12 min-w-12',
  lg: 'h-14 w-14 min-h-14 min-w-14',
}

export function IconButton({
  variant = 'default',
  size = 'md',
  label,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border shadow-card transition-colors duration-200',
        focusRing,
        touchTarget,
        tapAction,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
