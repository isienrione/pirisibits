import { cn } from './cn'
import { focusRing } from './focusRing'
import { motionTap } from './motion'

const variantStyles = {
  default:
    'border-limestone/70 bg-warm-white/90 text-deep-slate hover:border-terracotta/40 hover:bg-sand/70',
  ghost: 'border-transparent bg-warm-white/60 text-soft-slate hover:bg-warm-white/90 hover:text-deep-slate',
  solid: 'border-limestone bg-sand/80 text-deep-slate hover:bg-sand',
}

const sizeStyles = {
  sm: 'h-10 w-10',
  md: 'h-11 w-11',
  lg: 'h-12 w-12',
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
        'inline-flex shrink-0 items-center justify-center rounded-full border shadow-sm transition-colors duration-150 ease-motion-out',
        motionTap,
        focusRing,
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
