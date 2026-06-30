import { formatAudioTime } from '../../utils/audioTime'
import { cn } from './cn'
import { focusRing } from './focusRing'

export function AudioScrubber({
  currentTime = 0,
  duration = 0,
  onSeek,
  className,
  disabled = false,
  theme = 'light',
}) {
  const max = duration > 0 ? duration : 0
  const value = max > 0 ? Math.min(currentTime, max) : 0
  const progress = max > 0 ? (value / max) * 100 : 0
  const isDark = theme === 'dark'

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-8">
        <div
          className={cn(
            'absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full',
            isDark ? 'bg-ivory/15' : 'bg-parchment/70'
          )}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-bronze to-gold transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={max || 100}
          step={0.1}
          value={value}
          disabled={disabled || max <= 0}
          onChange={(event) => onSeek?.(Number(event.target.value))}
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${formatAudioTime(value)} of ${formatAudioTime(max)}`}
          className={cn(
            'absolute inset-0 w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ivory',
            '[&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-gold-glow',
            '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ivory [&::-moz-range-thumb]:bg-gold',
            disabled && 'cursor-not-allowed opacity-60',
            focusRing
          )}
        />
      </div>

      <div className={cn(
        'mt-2 flex items-center justify-between text-xs font-medium tabular-nums',
        isDark ? 'text-parchment/80' : 'text-soft-slate'
      )}>
        <span>{formatAudioTime(value)}</span>
        <span>{formatAudioTime(max)}</span>
      </div>
    </div>
  )
}

export default AudioScrubber
