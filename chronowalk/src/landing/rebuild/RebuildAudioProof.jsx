import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { REBUILD_AUDIO } from '../rebuildCopy.js'

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Warm daylight audio proof — lazy src, no autoplay.
 * @param {{ onPreview?: () => void, onPlayingChange?: (playing: boolean) => void }} props
 */
export default function RebuildAudioProof({ onPreview, onPlayingChange }) {
  const copy = REBUILD_AUDIO
  const audioRef = useRef(null)
  const srcReadyRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [durationLabel, setDurationLabel] = useState(null)
  const reactId = useId()
  const transcriptId = `${reactId}-transcript`

  const setPlayingBoth = useCallback(
    (next) => {
      setPlaying(next)
      onPlayingChange?.(next)
    },
    [onPlayingChange],
  )

  const ensureSrc = useCallback(() => {
    const audio = audioRef.current
    if (!audio || srcReadyRef.current) return
    const url = resolvePreviewUrl(copy.teaserFile)
    if (!url) return
    audio.src = url
    srcReadyRef.current = true
  }, [copy.teaserFile])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return

    ensureSrc()

    try {
      if (audio.paused) {
        await audio.play()
        setPlayingBoth(true)
      } else {
        audio.pause()
        setPlayingBoth(false)
      }
    } catch {
      setPlayingBoth(false)
    }
  }, [ensureSrc, setPlayingBoth])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const onEnded = () => setPlayingBoth(false)
    const onPause = () => setPlayingBoth(false)
    const onPlay = () => setPlayingBoth(true)
    const onMeta = () => {
      const label = formatDuration(audio.duration)
      if (label) setDurationLabel(label)
    }

    audio.addEventListener('ended', onEnded)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('loadedmetadata', onMeta)

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      onPlayingChange?.(false)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('loadedmetadata', onMeta)
    }
  }, [onPlayingChange, setPlayingBoth])
  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-audio cw-rb-surface--light"
      aria-labelledby="audio-proof-heading"
      data-rb-compete-cta="true"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header>
          <h2 id="audio-proof-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.body}</p>
        </header>

        <div className="cw-rb-audio__player">
          <button
            type="button"
            className="cw-rb-audio__play"
            onClick={togglePlay}
            aria-label={playing ? 'Pause excerpt' : 'Play excerpt'}
          >
            {playing ? (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <rect x="4" y="3" width="3.5" height="12" rx="0.5" fill="currentColor" />
                <rect x="10.5" y="3" width="3.5" height="12" rx="0.5" fill="currentColor" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M5 3.2v11.6L14.5 9 5 3.2Z" fill="currentColor" />
              </svg>
            )}
          </button>

          <div className="cw-rb-audio__meta">
            <p className="cw-rb-audio__label">{copy.playerLabel}</p>
            {durationLabel ? <p className="cw-rb-audio__duration">{durationLabel}</p> : null}
          </div>
        </div>

        {/* Lazy: src set only on first play */}
        <audio ref={audioRef} preload="none" playsInline />

        <p className="cw-rb-audio__headphones">{copy.headphones}</p>

        <details className="cw-rb-audio__transcript">
          <summary>Show transcript</summary>
          <p id={transcriptId}>{copy.transcript}</p>
        </details>

        <div className="cw-rb-audio__cta-block">
          <p className="cw-rb-audio__want">{copy.wantComplete}</p>
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary"
            onClick={onPreview}
          >
            {copy.previewCta}
          </button>
          <p className="cw-rb-audio__note">{copy.previewNote}</p>
        </div>
      </div>
    </section>
  )
}
