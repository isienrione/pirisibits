import { cn } from './cn'
import { focusRing } from './focusRing'
import { motionTap } from './motion'

const variantStyles = {
  primary:
    'bg-terracotta text-warm-white shadow-cta hover:bg-terracotta/90 active:bg-terracotta/95',
  secondary:
    'border border-limestone bg-warm-white/90 text-deep-slate hover:border-gold/40 hover:bg-sand/50',
  ghost:
    'border border-terracotta/30 bg-terracotta/8 text-terracotta hover:bg-terracotta/12',
  text: 'bg-transparent text-terracotta hover:text-terracotta/80 underline-offset-2 hover:underline',
}

const sizeStyles = {
  sm: 'min-h-10 px-4 py-2 text-caption font-medium rounded-full',
  md: 'min-h-11 px-5 py-3 text-body-sm font-medium rounded-2xl',
  lg: 'min-h-[3.25rem] px-6 py-3.5 text-body font-medium rounded-full',
  pill: 'min-h-11 px-6 py-3.5 text-body-sm font-medium rounded-full',
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
        'inline-flex items-center justify-center gap-2 transition-colors duration-150 ease-motion-out',
        motionTap,
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
