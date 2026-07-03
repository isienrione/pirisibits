import { useCallback, useEffect, useRef, useState } from 'react'
import { ThresholdAudioCrossfade } from '../audio/thresholdAudio'
import { useHideThresholdChrome } from '../context/ThresholdChromeContext'
import { THRESHOLD_HOLD_MS, THRESHOLD_RELEASE_MS } from '../data/thresholdDemo'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { track, TRACK_EVENTS } from '../lib/track'
import { hasSeenThresholdHint, markThresholdHintSeen } from '../utils/thresholdHint'
import {
  reducedMotionReveal,
  revealToClipRight,
  revealToSeamPercent,
} from '../utils/thresholdReveal'

function ThresholdLayerImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background:
            'linear-gradient(160deg, var(--ink) 0%, color-mix(in srgb, var(--ember) 22%, var(--obsidian)) 100%)',
        }}
        aria-hidden={!alt}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}

function ThresholdVideo({ src, poster, playing, className, style }) {
  const videoRef = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || failed) return

    if (playing) {
      const playPromise = video.play()
      if (playPromise?.catch) {
        playPromise.catch(() => setFailed(true))
      }
    } else {
      video.pause()
    }
  }, [playing, failed])

  if (!src || failed) {
    return (
      <ThresholdLayerImage
        src={poster}
        alt=""
        className={className}
        style={style}
      />
    )
  }

  return (
    <video
      ref={videoRef}
      className={className}
      style={style}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Press-and-hold time crossing — signature ChronoWalk interaction.
 */
export default function Threshold({
  waypoint,
  nowAmbienceUrl,
  thenSoundscapeUrl,
  thenLabel = '80 AD',
  active = true,
  className = '',
}) {
  const reducedMotion = useReducedMotion()
  const reconstruction = waypoint?.reconstruction
  const audioRef = useRef(null)
  const holdStartRef = useRef(null)
  const rafRef = useRef(null)
  const pointerIdRef = useRef(null)

  const [reveal, setReveal] = useState(0)
  const revealRef = useRef(0)
  const [holding, setHolding] = useState(false)
  const [showHint, setShowHint] = useState(() => !hasSeenThresholdHint())
  const [videoPlaying, setVideoPlaying] = useState(false)

  useHideThresholdChrome(holding)

  useEffect(() => {
    audioRef.current = new ThresholdAudioCrossfade()
    return () => {
      void audioRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (!active) return
    void audioRef.current?.start(nowAmbienceUrl, thenSoundscapeUrl)
  }, [active, nowAmbienceUrl, thenSoundscapeUrl])

  const cancelAnimation = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const animateReveal = useCallback(
    (from, to, durationMs, onDone) => {
      cancelAnimation()
      const start = performance.now()

      const step = (now) => {
        const t = Math.min(1, (now - start) / durationMs)
        const eased = 1 - (1 - t) ** 3
        const value = from + (to - from) * eased
        setReveal(value)
        revealRef.current = value

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
          onDone?.()
        }
      }

      rafRef.current = requestAnimationFrame(step)
    },
    [cancelAnimation]
  )

  const handlePointerDown = useCallback(
    (event) => {
      if (!active) return
      event.currentTarget.setPointerCapture(event.pointerId)
      pointerIdRef.current = event.pointerId
      holdStartRef.current = performance.now()
      setHolding(true)
      setVideoPlaying(true)

      if (showHint) {
        setShowHint(false)
        markThresholdHintSeen()
      }

      if (reducedMotion) {
        setReveal(1)
        revealRef.current = 1
        audioRef.current?.rampToThen(200)
        return
      }

      animateReveal(revealRef.current, 1, THRESHOLD_HOLD_MS)
      audioRef.current?.rampToThen(THRESHOLD_HOLD_MS)
    },
    [active, animateReveal, reducedMotion, showHint]
  )

  const handlePointerUp = useCallback(
    (event) => {
      if (pointerIdRef.current != null && event.pointerId !== pointerIdRef.current) return

      const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
      holdStartRef.current = null
      pointerIdRef.current = null
      setHolding(false)
      setVideoPlaying(false)

      if (waypoint?.id) {
        track(TRACK_EVENTS.THRESHOLD_HOLD, {
          duration_ms: Math.round(heldMs),
          waypoint_id: waypoint.id,
        })
      }

      if (reducedMotion) {
        setReveal(0)
        revealRef.current = 0
        audioRef.current?.rampToNow(200)
        return
      }

      animateReveal(revealRef.current, 0, THRESHOLD_RELEASE_MS)
      audioRef.current?.rampToNow(THRESHOLD_RELEASE_MS)
    },
    [animateReveal, reducedMotion, waypoint?.id]
  )

  useEffect(() => cancelAnimation, [cancelAnimation])

  if (!active || !reconstruction) return null

  const seamLeft = `${revealToSeamPercent(reveal)}%`
  const nowClip = revealToClipRight(reducedMotion ? reducedMotionReveal(holding) : reveal)
  const thenSrc = reconstruction.loop ? null : reconstruction.then

  return (
    <div
      className={`threshold-root ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100dvh',
        overflow: 'hidden',
        touchAction: 'none',
        background: 'var(--obsidian)',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="img"
      aria-label={`Press and hold to cross between now and ${thenLabel} at ${waypoint?.name ?? 'this place'}`}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        {reconstruction.loop ? (
          <ThresholdVideo
            src={reconstruction.loop}
            poster={reconstruction.then}
            playing={videoPlaying}
            className="threshold-layer"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        ) : (
          <ThresholdLayerImage
            src={thenSrc}
            alt=""
            className="threshold-layer"
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: nowClip,
          WebkitClipPath: nowClip,
          transition: reducedMotion ? 'clip-path 200ms var(--ease), opacity 200ms var(--ease)' : undefined,
        }}
      >
        <ThresholdLayerImage
          src={reconstruction.now}
          alt=""
          className="threshold-layer"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: seamLeft,
          width: 3,
          transform: 'translateX(-50%)',
          background: 'var(--ember)',
          boxShadow: '0 0 18px 4px var(--ember-glow)',
          opacity: reveal > 0.02 && reveal < 0.98 ? 1 : 0,
          transition: 'opacity 150ms var(--ease)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 'max(1rem, env(safe-area-inset-top))',
          left: 'var(--edge)',
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'color-mix(in srgb, var(--warm-white) 60%, transparent)',
          pointerEvents: 'none',
        }}
      >
        Now
      </div>

      <div
        style={{
          position: 'absolute',
          top: 'max(1rem, env(safe-area-inset-top))',
          right: 'var(--edge)',
          fontSize: 'var(--fs-caption)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'color-mix(in srgb, var(--warm-white) 60%, transparent)',
          pointerEvents: 'none',
        }}
      >
        {thenLabel}
      </div>

      {reconstruction.caption ? (
        <p
          style={{
            position: 'absolute',
            left: 'var(--edge)',
            right: 'var(--edge)',
            bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 4rem))',
            margin: 0,
            textAlign: 'center',
            fontSize: 10,
            lineHeight: 1.5,
            color: 'color-mix(in srgb, var(--warm-white) 70%, transparent)',
            pointerEvents: 'none',
          }}
        >
          {reconstruction.caption}
        </p>
      ) : null}

      {showHint ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 'max(2rem, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 20,
            background: 'color-mix(in srgb, var(--obsidian) 60%, transparent)',
            fontSize: 'var(--fs-meta)',
            fontWeight: 500,
            color: 'var(--warm-white)',
            pointerEvents: 'none',
          }}
        >
          Press and hold to cross
        </div>
      ) : null}
    </div>
  )
}
