import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from './cn'

/**
 * Premium Then & Now handle — bronze medallion on a glowing vertical time fracture.
 */
export function TimeFractureHandle({ className, size = 'md' }) {
  const reducedMotion = useReducedMotion()

  const medallionSize = {
    sm: 'h-12 w-12',
    md: 'h-[60px] w-[60px]',
    lg: 'h-16 w-16',
  }[size]

  return (
    <div className={cn('relative flex h-full w-full items-center justify-center', className)}>
      <div
        className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(212, 175, 55, 0.15) 8%, #D4AF37 22%, #F7F3EC 50%, #D4AF37 78%, rgba(212, 175, 55, 0.15) 92%, transparent 100%)',
          boxShadow:
            '0 0 24px rgba(212, 175, 55, 0.65), 0 0 48px rgba(212, 175, 55, 0.25), inset 0 0 8px rgba(255, 253, 248, 0.4)',
        }}
        aria-hidden="true"
      />
      <div className={cn('relative z-10 flex items-center justify-center', medallionSize)}>
        {!reducedMotion ? (
          <span
            className="pointer-events-none absolute inset-0 rounded-full motion-safe:animate-medallion-breathe"
            aria-hidden="true"
          />
        ) : null}
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full border-2 border-gold/60',
            medallionSize,
            'bg-gradient-to-br from-ivory via-parchment to-bronze shadow-bronze-cta'
          )}
          aria-hidden="true"
        >
          <div
            className="pointer-events-none absolute inset-[3px] rounded-full border border-gold/30"
            aria-hidden="true"
          />
          <svg className="h-5 w-5 text-bronze/90" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 8 4 12l4 4M16 8l4 4-4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default TimeFractureHandle
