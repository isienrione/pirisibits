import { cn } from './cn'

const variantStyles = {
  primary:
    'bg-terracotta text-warm-white shadow-cta hover:bg-terracotta/90 active:bg-terracotta/95',
  secondary:
    'border border-limestone bg-warm-white/80 text-deep-slate hover:border-terracotta/40 hover:bg-sand/60',
  ghost:
    'border border-terracotta/35 bg-terracotta/8 text-terracotta hover:bg-terracotta/15',
  text: 'bg-transparent text-terracotta hover:text-terracotta/80 underline-offset-2 hover:underline',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-full',
  md: 'px-4 py-3 text-sm font-semibold rounded-panel',
  lg: 'px-6 py-4 text-base font-bold rounded-panel',
  pill: 'px-6 py-3.5 text-sm font-bold rounded-full',
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
        'inline-flex items-center justify-center gap-2 transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-warm-white',
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
