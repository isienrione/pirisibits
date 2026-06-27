import { cn } from './cn'
import { focusRing } from './focusRing'

const variantStyles = {
  primary:
    'bg-terracotta text-warm-white shadow-cta hover:bg-terracotta/90 hover:shadow-cta/90 active:bg-terracotta/95 active:scale-[0.97] active:shadow-sm',
  secondary:
    'border border-limestone bg-warm-white/90 text-deep-slate shadow-glass hover:border-gold/40 hover:bg-sand/50 hover:shadow-glass-lg active:scale-[0.98] active:bg-sand/70',
  ghost:
    'border border-terracotta/30 bg-terracotta/8 text-terracotta shadow-sm hover:bg-terracotta/12 hover:shadow-glass active:scale-[0.98]',
  text: 'bg-transparent text-terracotta hover:text-terracotta/80 underline-offset-2 hover:underline',
}

const sizeStyles = {
  sm: 'min-h-11 px-4 py-2 text-xs font-semibold rounded-full',
  md: 'min-h-11 px-5 py-3 text-sm font-semibold rounded-2xl',
  lg: 'min-h-[3.25rem] px-6 py-3.5 text-base font-bold rounded-full',
  pill: 'min-h-11 px-6 py-3.5 text-sm font-bold rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 motion-reduce:transition-none motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        focusRing,
        'disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
