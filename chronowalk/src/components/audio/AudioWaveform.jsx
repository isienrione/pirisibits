import { useMemo } from 'react'
import { cn } from '../ui'

function seededHeight(index, seed = 1) {
  const value = Math.sin((index + 1) * 12.9898 + seed * 78.233) * 43758.5453
  return 0.28 + (value - Math.floor(value)) * 0.72
}

export function AudioWaveform({
  barCount = 48,
  progress = 0,
  className,
  seed = 1,
  animated = true,
}) {
  const bars = useMemo(
    () => Array.from({ length: barCount }, (_, index) => seededHeight(index, seed)),
    [barCount, seed]
  )

  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const activeBars = Math.floor(clampedProgress * barCount)

  return (
    <div
      className={cn('flex h-14 items-end gap-[3px]', className)}
      aria-hidden="true"
    >
      {bars.map((height, index) => {
        const isActive = index <= activeBars
        return (
          <span
            key={index}
            className={cn(
              'w-[3px] rounded-full transition-all duration-300',
              animated && isActive && 'animate-audio-wave-bar',
              isActive ? 'bg-gold/90' : 'bg-warm-white/25'
            )}
            style={{
              height: `${height * 100}%`,
              animationDelay: animated ? `${(index % 8) * 60}ms` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
