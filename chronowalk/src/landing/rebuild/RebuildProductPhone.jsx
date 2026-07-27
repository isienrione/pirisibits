import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { SHELL_TAB_META, SHELL_TAB_ORDER } from '../../shell/config.js'
import { NAV_ITEMS } from '../../components/navigation/navConfig.jsx'
import { mediaUrl } from '../../lib/mediaUrl.js'
import { pantheonNow } from '../../redesign/images.js'
import {
  trackLandingThresholdCancelled,
  trackLandingThresholdComplete,
  trackLandingThresholdStart,
} from '../landingAnalytics.js'
import RebuildPhoneChrome from './RebuildPhoneChrome.jsx'

const PANTHEON_THEN = mediaUrl('/waypoints/pantheon/ancient-reconstruction.jpg')
const PANTHEON_NOW = pantheonNow
const TEASER_FILE = 'w17_ch1.mp3'
const TRANSCRIPT =
  'You’re standing before the Pantheon. Look up at the porch—the columns, the pediment, the weight of the stone.'

/** Calm continuous product demo — one full breath of the app. */
const DEMO_LOOP_MS = 9000
const DEMO_AUDIO_SPAN_S = 42
const DEMO_DURATION_LABEL = '3:57'

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

function buildWaveBars(count = 36) {
  return Array.from({ length: count }, (_, i) => 18 + ((i * 17) % 62))
}

/**
 * Sample the demo timeline (0–1) into visual state.
 * Designed to feel like the product waking — not a marketing sting.
 */
function sampleDemo(phase) {
  // 0.00–0.08 settle
  // 0.08–0.48 seam opens + audio breathes
  // 0.48–0.62 hold reconstruction
  // 0.62–0.88 soft return
  // 0.88–1.00 quiet reset
  let reveal
  if (phase < 0.08) {
    reveal = 0.14 + (phase / 0.08) * 0.04
  } else if (phase < 0.48) {
    const t = easeInOutCubic((phase - 0.08) / 0.4)
    reveal = 0.18 + t * 0.7
  } else if (phase < 0.62) {
    reveal = 0.88
  } else if (phase < 0.88) {
    const t = easeInOutCubic((phase - 0.62) / 0.26)
    reveal = 0.88 - t * 0.68
  } else {
    const t = (phase - 0.88) / 0.12
    reveal = 0.2 - t * 0.06
  }

  const audioPhase = Math.min(1, Math.max(0, (phase - 0.06) / 0.82))
  const demoElapsed = audioPhase * DEMO_AUDIO_SPAN_S
  const demoPlaying = phase > 0.07 && phase < 0.9
  const uiGlow = phase > 0.12 && phase < 0.85 ? 0.35 + reveal * 0.4 : 0.15

  return {
    reveal: Math.min(0.92, Math.max(0.08, reveal)),
    demoElapsed,
    demoPlaying,
    uiGlow,
    thenEmphasis: reveal > 0.45,
  }
}

/**
 * Interactive ChronoWalk product phone with a continuous calm demo loop.
 * @param {{
 *   onPlayingChange?: (playing: boolean) => void
 *   autoAnimate?: boolean
 *   compactAudio?: boolean
 *   className?: string
 * }} props
 */
export default function RebuildProductPhone({
  onPlayingChange,
  autoAnimate = true,
  compactAudio = false,
  className = '',
}) {
  const reducedMotion = useReducedMotion()
  const stageRef = useRef(null)
  const rootRef = useRef(null)
  const audioRef = useRef(null)
  const srcReadyRef = useRef(false)
  const draggingRef = useRef(false)
  const userLockedRef = useRef(false)
  const realAudioRef = useRef(false)
  const bars = useMemo(() => buildWaveBars(), [])

  const [inView, setInView] = useState(true)
  const [reveal, setReveal] = useState(0.16)
  const [demoElapsed, setDemoElapsed] = useState(0)
  const [demoPlaying, setDemoPlaying] = useState(true)
  const [thenEmphasis, setThenEmphasis] = useState(false)
  const [uiGlow, setUiGlow] = useState(0.2)
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
    const node = rootRef.current
    if (!node || typeof IntersectionObserver !== 'function') return undefined
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.2)),
      { threshold: [0, 0.2, 0.5] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    const onPlay = () => {
      realAudioRef.current = true
      userLockedRef.current = true
      setPlayingBoth(true)
    }
    const onPause = () => setPlayingBoth(false)
    const onEnded = () => {
      setPlayingBoth(false)
      setElapsed(0)
      realAudioRef.current = false
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

  // Continuous product demo — seam, reconstruction, waveform, playhead.
  useEffect(() => {
    if (!autoAnimate || reducedMotion || !inView) {
      if (reducedMotion) {
        const still = sampleDemo(0.5)
        setReveal(still.reveal)
        setDemoElapsed(still.demoElapsed)
        setDemoPlaying(false)
        setThenEmphasis(still.thenEmphasis)
        setUiGlow(0.25)
      }
      return undefined
    }

    let raf = 0
    const start = performance.now()
    let pausedForUser = false

    const tick = (now) => {
      if (draggingRef.current || userLockedRef.current || realAudioRef.current) {
        if (!pausedForUser) {
          pausedForUser = true
          setDemoPlaying(false)
        }
        raf = requestAnimationFrame(tick)
        return
      }
      pausedForUser = false
      const phase = ((now - start) % DEMO_LOOP_MS) / DEMO_LOOP_MS
      const sample = sampleDemo(phase)
      setReveal(sample.reveal)
      setDemoElapsed(sample.demoElapsed)
      setDemoPlaying(sample.demoPlaying)
      setThenEmphasis(sample.thenEmphasis)
      setUiGlow(sample.uiGlow)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoAnimate, inView, reducedMotion])

  // Soft resume after the traveler stops interacting.
  useEffect(() => {
    if (playing || realAudioRef.current) return undefined
    if (!userLockedRef.current) return undefined
    const timer = window.setTimeout(() => {
      if (!draggingRef.current && !realAudioRef.current && !playing) {
        userLockedRef.current = false
      }
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [playing, reveal])

  const setRevealFromClientX = useCallback((clientX) => {
    const node = stageRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (rect.width <= 0) return
    const next = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    setReveal(next)
    setThenEmphasis(next > 0.45)
  }, [])

  const onPointerDown = useCallback(
    (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      draggingRef.current = true
      userLockedRef.current = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
      trackLandingThresholdStart({ via: 'drag' })
      setRevealFromClientX(event.clientX)
    },
    [setRevealFromClientX],
  )

  const onPointerMove = useCallback(
    (event) => {
      if (!draggingRef.current) return
      setRevealFromClientX(event.clientX)
    },
    [setRevealFromClientX],
  )

  const onPointerUp = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    if (reveal >= 0.92) {
      trackLandingThresholdComplete({ via: 'drag', duration_ms: 0 })
      setReveal(1)
    } else if (reveal <= 0.08) {
      trackLandingThresholdCancelled({ duration_ms: 0, via: 'drag' })
      setReveal(0)
    }
  }, [reveal])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    userLockedRef.current = true
    if (!srcReadyRef.current) {
      const url = resolvePreviewUrl(TEASER_FILE)
      if (!url) return
      audio.src = url
      srcReadyRef.current = true
    }
    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        setPlayingBoth(false)
        realAudioRef.current = false
      }
    } else {
      audio.pause()
      realAudioRef.current = false
    }
  }, [setPlayingBoth])

  const showPlaying = playing || demoPlaying
  const displayElapsed = playing ? elapsed : demoElapsed
  const progress = playing
    ? duration > 0
      ? Math.min(1, elapsed / duration)
      : 0
    : Math.min(1, demoElapsed / DEMO_AUDIO_SPAN_S)
  const playedBars = Math.round(progress * bars.length)
  const revealPct = Math.round(reveal * 100)

  const tabs = useMemo(() => {
    const icons = Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item.Icon]))
    return SHELL_TAB_ORDER.map((id) => ({
      id,
      label: SHELL_TAB_META[id].label,
      Icon: icons[id],
      active: id === 'walk',
    }))
  }, [])

  return (
    <div ref={rootRef} className={`cw-rb-product-phone-wrap ${className}`.trim()}>
      <RebuildPhoneChrome label="ChronoWalk at the Pantheon" size="xl">
        <div
          className="cw-rb-product-phone"
          data-playing={showPlaying ? 'true' : 'false'}
          data-demo={autoAnimate && !reducedMotion ? 'true' : 'false'}
          data-then={thenEmphasis ? 'true' : 'false'}
          style={{ '--rb-phone-glow': String(uiGlow) }}
        >
          <header className="cw-rb-product-phone__status">
            <div className="cw-rb-product-phone__place">
              <span className="cw-rb-product-phone__gps" aria-hidden="true" />
              <div>
                <p className="cw-rb-product-phone__loc">Piazza della Rotonda</p>
                <h3 className="cw-rb-product-phone__title">The Pantheon</h3>
              </div>
            </div>
            <ul className="cw-rb-product-phone__signals" aria-hidden="true">
              <li className="is-live" title="GPS active">
                <span />
              </li>
              <li className="is-offline" title="Offline ready">
                <span />
              </li>
              <li className={`is-audio${showPlaying ? ' is-active' : ''}`} title="Headphones">
                <span />
              </li>
              <li className="is-saved" title="Progress saved">
                <span />
              </li>
            </ul>
          </header>

          <div
            ref={stageRef}
            className="cw-rb-product-phone__threshold"
            role="slider"
            aria-label="Then versus Now"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={revealPct}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                userLockedRef.current = true
                setReveal((v) => Math.min(1, v + 0.08))
              }
              if (event.key === 'ArrowLeft') {
                event.preventDefault()
                userLockedRef.current = true
                setReveal((v) => Math.max(0, v - 0.08))
              }
            }}
          >
            <img
              className="cw-rb-product-phone__then"
              src={PANTHEON_THEN}
              alt=""
              draggable={false}
              decoding="async"
            />
            <div
              className="cw-rb-product-phone__now"
              style={{ clipPath: `inset(0 ${revealPct}% 0 0)` }}
            >
              <img src={PANTHEON_NOW} alt="" draggable={false} decoding="async" />
            </div>
            <div
              className="cw-rb-product-phone__seam"
              style={{ left: `${revealPct}%` }}
              aria-hidden="true"
            />
            <div
              className="cw-rb-product-phone__progress"
              aria-hidden="true"
              style={{ '--threshold-progress': `${revealPct}%` }}
            >
              <span />
            </div>
            <div className="cw-rb-product-phone__labels" aria-hidden="true">
              <span>Now</span>
              <span className={thenEmphasis ? 'is-on' : undefined}>Then</span>
            </div>
          </div>

          <div className={`cw-rb-product-phone__audio${compactAudio ? ' is-compact' : ''}`}>
            <button
              type="button"
              className={`cw-rb-product-phone__play${showPlaying ? ' is-on' : ''}`}
              onClick={togglePlay}
              aria-label={playing ? 'Pause narration' : 'Play narration'}
            >
              {showPlaying ? (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="3" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="0.5" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 2.4v11.2L13 8 4 2.4Z" fill="currentColor" />
                </svg>
              )}
            </button>
            <div className="cw-rb-product-phone__transport">
              <div className="cw-rb-product-phone__wave" aria-hidden="true">
                {bars.map((height, index) => (
                  <span
                    key={index}
                    className={index < playedBars ? 'is-played' : undefined}
                    style={{
                      height: `${height}%`,
                      animationDelay: `${(index % 8) * 70}ms`,
                    }}
                  />
                ))}
              </div>
              <div
                className="cw-rb-product-phone__scrub"
                aria-hidden="true"
                style={{ '--playhead': `${Math.round(progress * 100)}%` }}
              >
                <span className="cw-rb-product-phone__scrub-fill" />
                <span className="cw-rb-product-phone__scrub-knob" />
              </div>
            </div>
            <p className="cw-rb-product-phone__time">
              {formatTime(displayElapsed)}
              <span>/</span>
              {duration ? formatTime(duration) : DEMO_DURATION_LABEL}
            </p>
          </div>

          {!compactAudio ? (
            <p className="cw-rb-product-phone__transcript">{TRANSCRIPT}</p>
          ) : null}

          <nav className="cw-rb-product-phone__tabbar" aria-label="ChronoWalk navigation">
            {tabs.map((tab) => {
              const Icon = tab.Icon
              return (
                <span
                  key={tab.id}
                  className={`cw-rb-product-phone__tab${tab.active ? ' is-active' : ''}`}
                >
                  {Icon ? <Icon /> : null}
                  <em>{tab.label}</em>
                </span>
              )
            })}
          </nav>

          <audio ref={audioRef} preload="none" playsInline />
        </div>
      </RebuildPhoneChrome>
    </div>
  )
}

export { TRANSCRIPT as PRODUCT_PHONE_TRANSCRIPT }
