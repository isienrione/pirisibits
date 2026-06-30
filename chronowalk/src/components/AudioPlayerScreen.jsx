import { useEffect, useState } from 'react'
import { AUDIO_MODES } from '../audio/AudioOrchestrator'
import { useAudioPlaybackState } from '../hooks/useAudioPlaybackState'
import { useAudioProgress } from '../hooks/useAudioProgress'
import { cyclePlaybackSpeed, writePlaybackSpeed } from '../utils/appPreferences'
import AudioTranscriptSection from './AudioTranscriptSection'
import { AudioScrubber, GoldButton, cn, focusRing } from './ui'

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72L19 12 8 5.14Z" />
    </svg>
  )
}

function PauseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function SkipIcon({ direction = 'back', className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {direction === 'back' ? (
        <>
          <path d="M11 7 6 12l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M18 7v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M13 7l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M6 7v10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

function UtilityButton({ label, value, onClick, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-center transition',
        active ? 'bg-parchment/70 text-deep-slate' : 'text-soft-slate hover:bg-parchment/45 hover:text-deep-slate',
        focusRing
      )}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em]">{label}</span>
      <span className="text-sm font-semibold text-deep-slate">{value}</span>
    </button>
  )
}

function AudioPlayerScreen({
  open,
  title,
  subtitle,
  posterUrl,
  waypoint,
  onClose,
  onTogglePlayback,
  onStop,
}) {
  const { isTourNarrationPlaying, currentMode } = useAudioPlaybackState()
  const { currentTime, duration, playbackRate, seekTo, skipBy, setPlaybackRate } = useAudioProgress()
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setTranscriptOpen(false)
    }
  }, [open])

  if (!open) return null

  const modeLabel =
    currentMode === AUDIO_MODES.TRANSIT
      ? 'Walking narration'
      : currentMode === AUDIO_MODES.ARRIVAL
        ? 'Audio story'
        : 'Tour audio'

  const handleSpeedChange = () => {
    const next = cyclePlaybackSpeed(playbackRate)
    setPlaybackRate(next)
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-ivory">
      <div className="shrink-0 border-b border-parchment/70 bg-obsidian/95 px-4 pb-3 pt-safe text-ivory backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Minimize audio player"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/15 bg-ivory/5 text-ivory',
              focusRing
            )}
          >
            <ChevronDownIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-lg font-semibold leading-tight">{title ?? 'Landmark story'}</p>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-parchment/80">{subtitle}</p>
            ) : (
              <p className="mt-0.5 text-xs text-gold/90">{modeLabel}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onStop}
            aria-label="Stop audio"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/15 bg-ivory/5 text-xs font-semibold text-parchment/85',
              focusRing
            )}
          >
            Stop
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-safe pt-6">
        <div className="mx-auto w-full max-w-md">
          <div className="mx-auto aspect-square w-full max-w-[18rem] overflow-hidden rounded-3xl border border-parchment/80 bg-parchment shadow-plaque-lg">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-parchment to-limestone/50 text-5xl text-bronze">
                ♪
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-bronze">
              {modeLabel}
            </p>
            <h2 className="mt-1 text-center font-display text-2xl font-semibold leading-tight text-deep-slate">
              {title ?? 'Landmark story'}
            </h2>
            {subtitle ? <p className="mt-2 text-center text-sm text-soft-slate">{subtitle}</p> : null}
          </div>

          <div className="mt-8">
            <AudioScrubber
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
              disabled={duration <= 0}
            />
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => skipBy(-15)}
              aria-label="Rewind 15 seconds"
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full border border-parchment/80 bg-ivory text-deep-slate shadow-sm',
                focusRing
              )}
            >
              <SkipIcon direction="back" className="h-6 w-6" />
              <span className="sr-only">15 seconds</span>
            </button>

            <GoldButton
              size="lg"
              onClick={onTogglePlayback}
              aria-label={isTourNarrationPlaying ? 'Pause audio' : 'Play audio'}
              className="h-16 w-16 min-h-16 min-w-16 rounded-full p-0 shadow-gold-glow"
            >
              {isTourNarrationPlaying ? (
                <PauseIcon className="h-7 w-7" />
              ) : (
                <PlayIcon className="ml-1 h-7 w-7" />
              )}
            </GoldButton>

            <button
              type="button"
              onClick={() => skipBy(15)}
              aria-label="Forward 15 seconds"
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-full border border-parchment/80 bg-ivory text-deep-slate shadow-sm',
                focusRing
              )}
            >
              <SkipIcon direction="forward" className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-8 flex gap-2 rounded-3xl border border-parchment/70 bg-parchment/25 p-2">
            <UtilityButton
              label="Speed"
              value={`${playbackRate}x`}
              onClick={handleSpeedChange}
            />
            <UtilityButton label="Chapters" value="Soon" onClick={() => {}} />
            <UtilityButton
              label="Transcript"
              value={transcriptOpen ? 'On' : 'Off'}
              active={transcriptOpen}
              onClick={() => setTranscriptOpen((current) => !current)}
            />
            <UtilityButton label="Timer" value="Off" onClick={() => {}} />
          </div>

          {transcriptOpen ? (
            <div className="mt-4 rounded-3xl border border-parchment/70 bg-ivory px-4 py-4 shadow-plaque">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bronze">Transcript</p>
              <AudioTranscriptSection waypoint={waypoint} className="mt-3" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AudioPlayerScreen
