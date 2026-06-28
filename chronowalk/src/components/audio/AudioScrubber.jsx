import { useCallback, useRef } from 'react'
import { cn, focusRing } from '../ui'
import { triggerHaptic, HAPTIC_KIND } from '../../utils/haptics'

export function AudioScrubber({
  currentTime = 0,
  duration = 0,
  onSeek,
  className,
  compact = false,
}) {
  const scrubbingRef = useRef(false)
  const progress = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0

  const seekFromClientX = useCallback(
    (clientX, target) => {
      if (!duration || duration <= 0 || !onSeek) return
      const rect = target.getBoundingClientRect()
      const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
      onSeek(ratio * duration)
    },
    [duration, onSeek]
  )

  const handlePointerDown = (event) => {
    if (!duration || duration <= 0) return
    scrubbingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromClientX(event.clientX, event.currentTarget)
    triggerHaptic(HAPTIC_KIND.SOFT_TAP)
  }

  const handlePointerMove = (event) => {
    if (!scrubbingRef.current) return
    seekFromClientX(event.clientX, event.currentTarget)
  }

  const handlePointerUp = (event) => {
    if (!scrubbingRef.current) return
    scrubbingRef.current = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div
      role="slider"
      aria-label="Audio timeline"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={currentTime}
      aria-disabled={!duration || duration <= 0}
      tabIndex={duration > 0 ? 0 : -1}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={(event) => {
        if (!duration || duration <= 0 || !onSeek) return
        const step = event.shiftKey ? 15 : 5
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          onSeek(Math.min(currentTime + step, duration))
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          onSeek(Math.max(currentTime - step, 0))
        }
      }}
      className={cn(
        'group relative w-full touch-none',
        compact ? 'h-2' : 'h-3',
        duration > 0 ? 'cursor-pointer' : 'cursor-default',
        focusRing,
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-warm-white/20',
          compact ? 'h-1' : 'h-1.5'
        )}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold via-terracotta to-gold transition-[width] duration-150 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 rounded-full bg-warm-white shadow-glass transition-[left] duration-150 ease-linear',
          compact ? 'h-3 w-3' : 'h-4 w-4',
          duration > 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{ left: `calc(${progress * 100}% - ${compact ? 6 : 8}px)` }}
        aria-hidden="true"
      />
    </div>
  )
}
