import { cn } from './cn'

const sizeStyles = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-14 w-14 text-sm',
  lg: 'h-20 w-20 text-base',
  xl: 'h-28 w-28 text-lg',
}

/**
 * Engraved bronze medallion — inspired by the ChronoWalk logo mark.
 */
export function MedallionBadge({
  size = 'md',
  pulse = false,
  className,
  children,
  'aria-label': ariaLabel,
}) {
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-full',
        'border-2 border-gold/50 bg-gradient-to-br from-ivory via-parchment to-bronze/90',
        'font-display font-semibold text-bronze shadow-bronze-cta',
        pulse && 'animate-medallion-breathe',
        sizeStyles[size],
        className
      )}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <div
        className="pointer-events-none absolute inset-[3px] rounded-full border border-gold/25"
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

export default MedallionBadge
