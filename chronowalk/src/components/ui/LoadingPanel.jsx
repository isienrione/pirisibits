import { cn } from './cn'
import { LoadingSpinner } from './LoadingSpinner'

export function LoadingPanel({
  label = 'Loading…',
  hint,
  fullScreen = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-obsidian text-bone',
        fullScreen ? 'h-screen w-full' : 'min-h-[12rem] w-full rounded-card',
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner />
      <p className="mt-4 text-sm font-semibold">{label}</p>
      {hint ? <p className="mt-1 max-w-xs text-center text-xs text-muted">{hint}</p> : null}
    </div>
  )
}

export default LoadingPanel
