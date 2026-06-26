import { cn } from './cn'
import { motionShimmer } from './motion'

export function AudioLoadingIndicator({ className, label = 'Loading audio…' }) {
  return (
    <div
      className={cn('flex items-center gap-2 text-gold', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span
            key={bar}
            className={cn('w-1 rounded-full bg-current motion-shimmer', bar === 1 ? 'h-3' : 'h-2')}
            style={{ animationDelay: `${bar * 80}ms` }}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-sand/85">{label}</span>
    </div>
  )
}

export default AudioLoadingIndicator
