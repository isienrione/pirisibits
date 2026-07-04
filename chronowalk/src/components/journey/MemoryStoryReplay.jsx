import { useStoryAudio } from '../../hooks/useStoryAudio'
import { MediaPlayerControls, cn } from '../ui'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export default function MemoryStoryReplay({ story }) {
  const { isPlaying, duration, currentTime, progress, toggle, seekToProgress } = useStoryAudio({
    src: story.audioUrl,
    initialProgress: 0,
  })

  const progressPercent = Math.round(progress * 1000)

  return (
    <div
      className="mt-4 rounded-[1.25rem] border border-parchment/90 bg-parchment/35 px-4 py-4"
      data-testid={`memory-story-replay-${story.id}`}
    >
      <div className="relative">
        <div
          className="pointer-events-none h-1.5 overflow-hidden rounded-full bg-parchment"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-bronze via-bronze to-bronze-dark transition-[width] duration-150 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          value={progressPercent}
          aria-label={`${story.title} story progress`}
          aria-valuemin={0}
          aria-valuemax={1000}
          aria-valuenow={progressPercent}
          className={cn(
            'absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent',
            '[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-bronze'
          )}
          onChange={(event) => seekToProgress(Number(event.target.value) / 1000)}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <div className="text-sm tabular-nums text-soft-slate">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
        </div>
        <MediaPlayerControls isPlaying={isPlaying} onToggle={toggle} theme="light" showStop={false} />
      </div>
    </div>
  )
}
