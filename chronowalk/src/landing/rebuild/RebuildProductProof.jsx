import { useCallback, useEffect, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { getModernPosterUrl } from '../../content/modernPhotoRegistry.js'
import { REBUILD_PROOF, REBUILD_THRESHOLD } from '../rebuildCopy.js'
import ThresholdStage from './ThresholdStage.jsx'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Product proof — three stacked cards (no tabs, no horizontal scroll).
 * @param {{ onPlayingChange?: (playing: boolean) => void }} props
 */
export default function RebuildProductProof({ onPlayingChange }) {
  const copy = REBUILD_PROOF
  const reveal = copy.cards.find((c) => c.id === 'reveal')
  const hear = copy.cards.find((c) => c.id === 'hear')
  const place = copy.cards.find((c) => c.id === 'place')
  const treviSrc = getModernPosterUrl('fontana-di-trevi')

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
      const url = resolvePreviewUrl(hear?.teaserFile || 'w17_ch1.mp3')
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
  }, [hear?.teaserFile, setPlayingBoth])

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-proof cw-rb-surface--dark"
      aria-labelledby="product-proof-heading"
    >
      <div id="threshold" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="audio-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />

      <div className="cw-rb-wrap">
        <h2 id="product-proof-heading" className="cw-rb-title cw-rb-proof__heading">
          {copy.headline}
        </h2>

        <article className="cw-rb-proof__card" aria-labelledby="proof-reveal-title">
          <h3 id="proof-reveal-title" className="cw-rb-proof__card-title">
            {reveal.title}
          </h3>
          <p className="cw-rb-proof__card-body">{reveal.body}</p>
          <ThresholdStage
            hint={REBUILD_THRESHOLD.instruction}
            tapLabel={REBUILD_THRESHOLD.tapAlternative}
            showProgress
            track
            className="cw-rb-proof__threshold"
          />
          <p className="cw-rb-proof__method">{reveal.methodology}</p>
        </article>

        <article className="cw-rb-proof__card" aria-labelledby="proof-hear-title">
          <h3 id="proof-hear-title" className="cw-rb-proof__card-title">
            {hear.title}
          </h3>
          <p className="cw-rb-proof__card-body">{hear.body}</p>

          <div className="cw-rb-proof__audio" data-rb-compete-cta="true">
            <button
              type="button"
              className="cw-rb-proof__play"
              onClick={togglePlay}
              aria-label={playing ? 'Pause excerpt' : 'Play real audio excerpt'}
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
            <div className="cw-rb-proof__audio-meta">
              <p className="cw-rb-proof__audio-title">{hear.playerLabel}</p>
              <p className="cw-rb-proof__audio-time">
                {formatTime(elapsed)} / {duration ? formatTime(duration) : '—:—'}
              </p>
            </div>
          </div>
          <audio ref={audioRef} preload="none" playsInline />

          {treviSrc ? (
            <figure className="cw-rb-proof__media">
              <img
                src={treviSrc}
                alt=""
                width={960}
                height={640}
                loading="lazy"
                decoding="async"
              />
            </figure>
          ) : null}

          <details className="cw-rb-proof__transcript">
            <summary>Read transcript</summary>
            <p>{hear.transcript}</p>
          </details>
        </article>

        <article className="cw-rb-proof__card" aria-labelledby="proof-place-title">
          <h3 id="proof-place-title" className="cw-rb-proof__card-title">
            {place.title}
          </h3>
          <p className="cw-rb-proof__card-body">{place.body}</p>
          <div className="cw-rb-proof__progress" aria-hidden="true">
            <div className="cw-rb-proof__progress-card">
              <p className="cw-rb-proof__progress-kicker">Last stop</p>
              <p className="cw-rb-proof__progress-name">Trevi Fountain</p>
              <p className="cw-rb-proof__progress-meta">Saved</p>
            </div>
            <div className="cw-rb-proof__progress-card cw-rb-proof__progress-card--next">
              <p className="cw-rb-proof__progress-kicker">Continue</p>
              <p className="cw-rb-proof__progress-name">Pantheon</p>
              <p className="cw-rb-proof__progress-meta">Nearby</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
