import { cn } from './cn'
import { LoadingSpinner } from './LoadingSpinner'
import { typeBodySm, typeCaption } from './typography'

export function LoadingPanel({
  label = 'Loading…',
  hint,
  fullScreen = false,
  className,
}) {
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
      <LoadingSpinner />
      <p className={cn(typeBodySm, 'mt-5 font-medium')}>{label}</p>
      {hint ? <p className={cn(typeCaption, 'mt-2 max-w-xs text-center')}>{hint}</p> : null}
    </div>
  )
}

export default LoadingPanel
