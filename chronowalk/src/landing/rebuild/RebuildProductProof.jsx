import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { LANDING_PANTHEON_NOW } from '../landingVisualAssets.js'
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
 * Interactive product proof — three tabs, one demo at a time.
 * @param {{ onPlayingChange?: (playing: boolean) => void }} props
 */
export default function RebuildProductProof({ onPlayingChange }) {
  const copy = REBUILD_PROOF
  const [tab, setTab] = useState('reveal')
  const baseId = useId()
  const audioRef = useRef(null)
  const srcReadyRef = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)

  const hear = copy.tabs.find((t) => t.id === 'hear')
  const place = copy.tabs.find((t) => t.id === 'place')
  const reveal = copy.tabs.find((t) => t.id === 'reveal')

  const setPlayingBoth = useCallback(
    (next) => {
      setPlaying(next)
      onPlayingChange?.(next)
    },
    [onPlayingChange],
  )

  useEffect(() => {
    if (tab !== 'hear') {
      const audio = audioRef.current
      if (audio && !audio.paused) audio.pause()
      setPlayingBoth(false)
    }
  }, [tab, setPlayingBoth])

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

  const onTabKeyDown = useCallback(
    (event, index) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
        return
      }
      event.preventDefault()
      const tabs = copy.tabs
      let next = index
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
      if (event.key === 'Home') next = 0
      if (event.key === 'End') next = tabs.length - 1
      setTab(tabs[next].id)
      const btn = document.getElementById(`${baseId}-tab-${tabs[next].id}`)
      btn?.focus()
    },
    [baseId, copy.tabs],
  )

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-proof cw-rb-surface--dark"
      aria-labelledby="product-proof-heading"
      data-rb-compete-cta="true"
    >
      {/* Legacy anchors */}
      <div id="threshold" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="audio-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />

      <div className="cw-rb-wrap">
        <header className="cw-rb-proof__header">
          <h2 id="product-proof-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.support}</p>
        </header>

        <div
          className="cw-rb-proof__tabs"
          role="tablist"
          aria-label="Product demonstrations"
        >
          {copy.tabs.map((item, index) => {
            const selected = tab === item.id
            return (
              <button
                key={item.id}
                id={`${baseId}-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                className={`cw-rb-proof__tab${selected ? ' is-active' : ''}`}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        <div
          id={`${baseId}-panel-reveal`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-reveal`}
          hidden={tab !== 'reveal'}
          className="cw-rb-proof__panel"
        >
          <h3 className="cw-rb-proof__panel-title">{reveal.title}</h3>
          <p className="cw-rb-proof__panel-body">{reveal.body}</p>
          <ThresholdStage
            hint={REBUILD_THRESHOLD.instruction}
            tapLabel={REBUILD_THRESHOLD.tapAlternative}
            showProgress
            track
            className="cw-rb-proof__threshold"
          />
          <p className="cw-rb-proof__method">{reveal.methodology}</p>
        </div>

        <div
          id={`${baseId}-panel-hear`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-hear`}
          hidden={tab !== 'hear'}
          className="cw-rb-proof__panel"
        >
          <h3 className="cw-rb-proof__panel-title">{hear.title}</h3>
          <p className="cw-rb-proof__panel-body">{hear.body}</p>
          <figure className="cw-rb-proof__media">
            <img
              src={LANDING_PANTHEON_NOW}
              alt=""
              width={960}
              height={640}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="cw-rb-proof__audio">
            <button
              type="button"
              className="cw-rb-proof__play"
              onClick={togglePlay}
              aria-label={playing ? 'Pause excerpt' : 'Play excerpt'}
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
          <details className="cw-rb-proof__transcript">
            <summary>Show transcript</summary>
            <p>{hear.transcript}</p>
          </details>
        </div>

        <div
          id={`${baseId}-panel-place`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-place`}
          hidden={tab !== 'place'}
          className="cw-rb-proof__panel"
        >
          <h3 className="cw-rb-proof__panel-title">{place.title}</h3>
          <p className="cw-rb-proof__panel-body">{place.body}</p>
          <div className="cw-rb-proof__progress" aria-hidden="true">
            <div className="cw-rb-proof__progress-card">
              <p className="cw-rb-proof__progress-kicker">Last stop</p>
              <p className="cw-rb-proof__progress-name">Pantheon</p>
              <p className="cw-rb-proof__progress-meta">Completed · Chapter saved</p>
            </div>
            <div className="cw-rb-proof__progress-card cw-rb-proof__progress-card--next">
              <p className="cw-rb-proof__progress-kicker">Continue</p>
              <p className="cw-rb-proof__progress-name">Piazza Navona</p>
              <p className="cw-rb-proof__progress-meta">Nearby on your route</p>
            </div>
          </div>
          <figure className="cw-rb-proof__media cw-rb-proof__media--crop">
            <img
              src="/landing/phone-screens/journey.jpg"
              alt=""
              width={720}
              height={480}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
