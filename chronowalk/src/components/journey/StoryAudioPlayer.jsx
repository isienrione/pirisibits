import { useState } from 'react'
import tourHeroFallback from '../../assets/tour-hero.svg'
import { IconButton, cn } from '../ui'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function formatSpeed(speed) {
  return Number.isInteger(speed) ? `${speed}×` : `${speed}×`
}

function SkipIcon({ direction = 'back' }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === 'back' ? (
        <>
          <path d="M10 8 6 12l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="m14 8 4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 12h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function OfflineReadyPill() {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border border-gold/25 bg-obsidian/70 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gold/90 backdrop-blur-sm"
      role="status"
      aria-label="Available offline"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
      Offline
    </div>
  )
}

export default function StoryAudioPlayer({
  stop,
  chapterIndex,
  chapterCount,
  isOffline = false,
  isPlaying,
  duration,
  currentTime,
  progress,
  playbackSpeed,
  onTogglePlayback,
  onSeekBy,
  onSeekToProgress,
  onCycleSpeed,
  onBack,
}) {
  const [heroSrc, setHeroSrc] = useState(stop?.heroImage ?? tourHeroFallback)

  if (!stop) return null

  const progressPercent = Math.round(progress * 1000)

  return (
    <div
      className="flex min-h-dvh flex-col bg-obsidian text-ivory"
      data-testid="story-audio-player"
    >
      <header className="flex items-center justify-between px-5 pt-safe sm:px-6">
        <IconButton
          variant="ghost"
          size="md"
          label="Close audio player"
          onClick={onBack}
          className="mt-4 border-ivory/10 bg-obsidian/60 text-ivory hover:bg-ivory/10 hover:text-ivory"
        >
          <ChevronDownIcon className="h-6 w-6" />
        </IconButton>

        <div className="mt-4 flex items-center gap-3">
          {isOffline ? <OfflineReadyPill /> : null}
          <button
            type="button"
            className="min-h-11 rounded-full border border-ivory/15 px-4 text-sm font-semibold tabular-nums text-ivory/85 transition hover:border-gold/35 hover:text-gold"
            onClick={onCycleSpeed}
            aria-label={`Playback speed ${formatSpeed(playbackSpeed)}`}
          >
            {formatSpeed(playbackSpeed)}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6 pb-safe pt-8 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="relative mx-auto aspect-square w-full max-w-[min(82vw,22rem)] overflow-hidden rounded-[2rem] shadow-gold-glow">
            <img
              src={heroSrc}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
              onError={() => {
                if (heroSrc !== tourHeroFallback) {
                  setHeroSrc(tourHeroFallback)
                }
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/35 via-transparent to-obsidian/10"
              aria-hidden="true"
            />
          </div>

          <p className="mt-10 text-center text-sm font-medium uppercase tracking-[0.2em] text-gold/85">
            Chapter {chapterIndex} of {chapterCount}
          </p>

          <h1 className="mt-4 text-center font-display text-[2rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            {stop.title}
          </h1>

          {stop.subtitle ? (
            <p className="mx-auto mt-4 max-w-sm text-center text-base leading-relaxed text-ivory/65 sm:text-lg">
              {stop.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-safe pt-2 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="relative">
            <div
              className="pointer-events-none h-1.5 overflow-hidden rounded-full bg-ivory/10"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold via-gold to-bronze transition-[width] duration-150 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1000}
              value={progressPercent}
              aria-label="Story progress"
              aria-valuemin={0}
              aria-valuemax={1000}
              aria-valuenow={progressPercent}
              className={cn(
                'absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent',
                '[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none',
                '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-gold-glow'
              )}
              onChange={(event) => onSeekToProgress(Number(event.target.value) / 1000)}
            />
          </div>

          <div className="mt-2 flex justify-between text-sm tabular-nums text-ivory/55">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="mt-8 flex items-center justify-center gap-8 pb-6">
            <IconButton
              label="Rewind 15 seconds"
              variant="ghost"
              size="lg"
              onClick={() => onSeekBy(-15)}
              className="border-ivory/10 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
            >
              <SkipIcon direction="back" />
            </IconButton>

            <button
              type="button"
              aria-label={isPlaying ? 'Pause story' : 'Play story'}
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full border border-gold/40',
                'bg-gradient-to-b from-gold via-gold to-gold-dark text-obsidian shadow-gold-glow',
                'transition-transform duration-200 active:scale-[0.98]'
              )}
              onClick={onTogglePlayback}
            >
              {isPlaying ? (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg
                  className="ml-1 h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 5.14v13.72L19 12 8 5.14Z" />
                </svg>
              )}
            </button>

            <IconButton
              label="Forward 15 seconds"
              variant="ghost"
              size="lg"
              onClick={() => onSeekBy(15)}
              className="border-ivory/10 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory"
            >
              <SkipIcon direction="forward" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  )
}
