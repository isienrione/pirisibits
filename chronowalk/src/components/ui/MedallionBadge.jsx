import { cn } from './cn'

const sizeStyles = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-20 w-20 text-base',
  xl: 'h-28 w-28 text-lg',
}

/** Circular accent badge — flat surface, no medallion gradient. */
export function MedallionBadge({
  size = 'md',
  pulse: _pulse = false,
  className,
  children,
  'aria-label': ariaLabel,
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full',
        'border-2 border-accent bg-bone font-display font-semibold text-accent shadow-card',
        sizeStyles[size],
        className
      )}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      {children}
    </div>
  )
}

export default MedallionBadge
