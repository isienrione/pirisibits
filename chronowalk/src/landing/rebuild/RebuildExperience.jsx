import { useCallback, useEffect, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { REBUILD_EXPERIENCE } from '../rebuildCopy.js'
import ThresholdStage from './ThresholdStage.jsx'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * One connected product experience:
 * Then vs Now → audio → transcript → confidence note.
 * @param {{ onPlayingChange?: (playing: boolean) => void }} props
 */
export default function RebuildExperience({ onPlayingChange }) {
  const copy = REBUILD_EXPERIENCE
  const audioRef = useRef(null)
  const srcReadyRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)

  const setPlayingBoth = useCallback(
    (next) => {
      setPlaying(next)
      onPlayingChange?.(next)
    },
    [onPlayingChange],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    const onPlay = () => setPlayingBoth(true)
    const onPause = () => setPlayingBoth(false)
    const onEnded = () => {
      setPlayingBoth(false)
      setElapsed(0)
    }
    const onTime = () => setElapsed(audio.currentTime || 0)
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      onPlayingChange?.(false)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
    }
  }, [onPlayingChange, setPlayingBoth])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    if (!srcReadyRef.current) {
      const url = resolvePreviewUrl(copy.teaserFile)
      if (!url) return
      audio.src = url
      srcReadyRef.current = true
    }
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setPlayingBoth(false)
      }
    } else {
      audio.pause()
    }
  }, [copy.teaserFile, setPlayingBoth])

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-experience cw-rb-surface--dark"
      aria-label="Try ChronoWalk"
    >
      <div id="threshold" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="product-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="audio-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />

      <div className="cw-rb-wrap cw-rb-experience__stack">
        <div className="cw-rb-experience__beat" id="then-vs-now">
          <ThresholdStage
            hint={copy.thresholdHint}
            tapLabel={copy.tapAlternative}
            showProgress
            track
            className="cw-rb-experience__threshold"
          />
        </div>

        <div className="cw-rb-experience__beat" id="audio-demo" data-rb-compete-cta="true">
          <div className="cw-rb-proof__audio cw-rb-experience__audio">
            <button
              type="button"
              className="cw-rb-proof__play"
              onClick={togglePlay}
              aria-label={playing ? 'Pause narration' : 'Play narration'}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="3" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 2.4v11.2L13 8 4 2.4Z" fill="currentColor" />
                </svg>
              )}
            </button>
            <div>
              <p className="cw-rb-proof__audio-title">{copy.playerLabel}</p>
              <p className="cw-rb-proof__audio-time">
                {formatTime(elapsed)} / {duration ? formatTime(duration) : '—:—'}
              </p>
            </div>
          </div>
          <audio ref={audioRef} preload="none" playsInline />

          <details className="cw-rb-proof__transcript cw-rb-experience__transcript">
            <summary>Transcript</summary>
            <p>{copy.transcript}</p>
          </details>

          <p className="cw-rb-proof__method cw-rb-experience__confidence">{copy.confidence}</p>
        </div>
      </div>
    </section>
  )
}
