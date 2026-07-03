import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from './cn'

/** Then & Now handle — ember seam line, flat token handle (threshold moment). */
export function TimeFractureHandle({ className, size = 'md' }) {
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
          background: 'var(--spectrum)',
          boxShadow: '0 0 24px var(--ember-glow)',
        }}
        aria-hidden="true"
      />
      <div className={cn('relative z-10 flex items-center justify-center', medallionSize)}>
        <div
          className={cn(
            'relative flex items-center justify-center rounded-full border-2 border-ember bg-bone shadow-card',
            medallionSize
          )}
          aria-hidden="true"
        >
          <svg className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none">
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
