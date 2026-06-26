import { cn } from './cn'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function LoadingPanel({
  label = 'Loading…',
  hint,
  fullScreen = false,
  className,
}) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-gradient-to-b from-warm-white via-sand/20 to-limestone/10 text-deep-slate',
        fullScreen ? 'h-screen w-full' : 'min-h-[12rem] w-full rounded-3xl',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'h-10 w-10 rounded-full bg-gold/30',
          !reducedMotion && 'animate-pulse'
        )}
        aria-hidden="true"
      />
      <p className="mt-4 text-sm font-semibold">{label}</p>
      {hint ? <p className="mt-1 max-w-xs text-center text-xs text-soft-slate">{hint}</p> : null}
    </div>
  )
}

export default LoadingPanel
