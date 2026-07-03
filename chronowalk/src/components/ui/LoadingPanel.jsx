import { cn } from './cn'
import { LoadingSpinner } from './LoadingSpinner'
import { pageShellStyle } from './styles'

export function LoadingPanel({
  label = 'Loading…',
  hint,
  fullScreen = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-ink',
        fullScreen ? 'h-screen w-full' : 'min-h-[12rem] w-full rounded-[var(--r-card)]',
        className
      )}
      style={pageShellStyle}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner />
      <p className="mt-4 text-sm font-semibold">{label}</p>
      {hint ? <p className="mt-1 max-w-xs text-center text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

export default LoadingPanel
