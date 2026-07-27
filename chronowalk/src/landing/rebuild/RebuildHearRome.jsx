import { useCallback, useEffect, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { REBUILD_HEAR } from '../rebuildCopy.js'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Section 3 — Hear Rome. Continue the product experience with audio + transcript.
 * @param {{ onPlayingChange?: (playing: boolean) => void }} props
 */
export default function RebuildHearRome({ onPlayingChange }) {
  const copy = REBUILD_HEAR
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
      const url = resolvePreviewUrl('w17_ch1.mp3')
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
  }, [setPlayingBoth])

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-hear cw-rb-surface--light"
      aria-labelledby="hear-heading"
    >
      <div id="audio-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="experience" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <h2 id="hear-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        {copy.body ? <p className="cw-rb-lead">{copy.body}</p> : null}

        <div className="cw-rb-hear__player" data-rb-compete-cta="true">
          <button
            type="button"
            className="cw-rb-hear__play"
            onClick={togglePlay}
            aria-label={playing ? 'Pause narration' : 'Play narration'}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <div>
            <p className="cw-rb-hear__label">The Pantheon — Exterior</p>
            <p className="cw-rb-hear__time">
              {formatTime(elapsed)} / {duration ? formatTime(duration) : '3:57'}
            </p>
          </div>
          <audio ref={audioRef} preload="none" playsInline />
        </div>

        {copy.transcript ? (
          <blockquote className="cw-rb-hear__transcript">{copy.transcript}</blockquote>
        ) : null}
      </div>
    </section>
  )
}
