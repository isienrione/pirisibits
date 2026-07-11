import { useCallback, useEffect, useRef, useState } from 'react'
import { ThresholdAudioCrossfade } from '../audio/thresholdAudio'
import { useHideThresholdChrome } from '../context/ThresholdChromeContext'
import { THRESHOLD_HOLD_MS, THRESHOLD_RELEASE_MS } from '../data/thresholdDemo'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { track, TRACK_EVENTS } from '../lib/track'
import {
  reducedMotionReveal,
  revealToClipRight,
  revealToSeamPercent,
} from '../utils/thresholdReveal'
import ThresholdSourceBadge, {
  AI_NOW_DISCLOSURE_COPY,
} from './threshold/ThresholdSourceBadge.jsx'
import ThresholdHoldHint from '../redesign/ui/ThresholdHoldHint.jsx'

const REVEAL_COMPLETE = 0.98

/** Shared framing for both eras — same box, same scale, minimal crop. */
const THRESHOLD_LAYER_CONTAIN = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center center',
  display: 'block',
}

const THRESHOLD_LAYER_COVER = {
  ...THRESHOLD_LAYER_CONTAIN,
  objectFit: 'cover',
  objectPosition: 'center 28%',
}

function ThresholdMediaCanvas({ thenLayer, nowLayer, nowClip, reducedMotion, immersive = false }) {
  return (
    <div className={`threshold-media-canvas${immersive ? ' threshold-media-canvas--immersive' : ''}`}>
      <div className={`threshold-media-canvas__frame${immersive ? ' threshold-media-canvas__frame--immersive' : ''}`}>
        {thenLayer}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: nowClip,
            WebkitClipPath: nowClip,
            transition: reducedMotion ? 'clip-path 200ms var(--ease), opacity 200ms var(--ease)' : undefined,
          }}
        >
          {nowLayer}
        </div>
      </div>
    </div>
  )
}

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
      draggable={false}
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

function eraPillStyle(active) {
  return {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '5px 10px',
    borderRadius: 999,
    background: active ? 'color-mix(in srgb, var(--obsidian) 72%, transparent)' : 'color-mix(in srgb, var(--obsidian) 45%, transparent)',
    color: active ? 'var(--warm-white)' : 'color-mix(in srgb, var(--muted-warm) 80%, transparent)',
    border: `1px solid ${active ? 'color-mix(in srgb, var(--ember) 33%, transparent)' : 'color-mix(in srgb, var(--muted-warm) 20%, transparent)'}`,
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
  }
}

/**
 * Press-and-hold time crossing — signature ChronoWalk interaction.
 * Single canonical implementation for journey, preview, and landing demo.
 */
export default function Threshold({
  waypoint,
  nowAmbienceUrl,
  thenSoundscapeUrl,
  thenLabel = 'Then',
  active = true,
  embedded = false,
  immersive = false,
  className = '',
  onDismiss = null,
  dismissLabel = 'Return to story',
  onHoldStart = null,
  onHoldEnd = null,
  onFullyRevealed = null,
  hideUi = false,
}) {
  const reducedMotion = useReducedMotion()
  const reconstruction = waypoint?.reconstruction
  const audioRef = useRef(null)
  const holdStartRef = useRef(null)
  const rafRef = useRef(null)
  const pointerIdRef = useRef(null)
  const fullyRevealedHoldRef = useRef(false)
  const holdSessionRef = useRef(false)

  const [reveal, setReveal] = useState(0)
  const revealRef = useRef(0)
  const [holding, setHolding] = useState(false)
  const [latchedToThen, setLatchedToThen] = useState(false)
  const latchedRef = useRef(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const showHoldHint = !hideUi && !holding && !latchedToThen && !immersive

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

  const notifyFullyRevealed = useCallback(() => {
    if (fullyRevealedHoldRef.current) return
    fullyRevealedHoldRef.current = true
    onFullyRevealed?.()
  }, [onFullyRevealed])

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

        if (to >= REVEAL_COMPLETE && value >= REVEAL_COMPLETE) {
          notifyFullyRevealed()
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step)
        } else {
          rafRef.current = null
          onDone?.()
        }
      }

      rafRef.current = requestAnimationFrame(step)
    },
    [cancelAnimation, notifyFullyRevealed]
  )

  const handlePointerDown = useCallback(
    (event) => {
      if (!active) return
      if (event.target.closest('button')) return

      if (latchedRef.current) {
        latchedRef.current = false
        setLatchedToThen(false)
        setHolding(false)
        setVideoPlaying(false)
        cancelAnimation()
        setReveal(0)
        revealRef.current = 0
        audioRef.current?.rampToNow(reducedMotion ? 200 : THRESHOLD_RELEASE_MS)
        return
      }

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // jsdom and some browsers may reject capture
      }
      pointerIdRef.current = event.pointerId
      holdStartRef.current = performance.now()
      fullyRevealedHoldRef.current = false
      holdSessionRef.current = true
      setHolding(true)
      setVideoPlaying(true)

      onHoldStart?.()

      if (reducedMotion) {
        setReveal(1)
        revealRef.current = 1
        notifyFullyRevealed()
        audioRef.current?.rampToThen(200)
        return
      }

      animateReveal(revealRef.current, 1, THRESHOLD_HOLD_MS)
      audioRef.current?.rampToThen(THRESHOLD_HOLD_MS)
    },
    [active, animateReveal, cancelAnimation, notifyFullyRevealed, onHoldStart, reducedMotion]
  )

  const endHoldSession = useCallback(
    (detail) => {
      if (!holdSessionRef.current) return
      holdSessionRef.current = false
      onHoldEnd?.(detail)
    },
    [onHoldEnd],
  )

  const handlePointerUp = useCallback(
    (event) => {
      if (pointerIdRef.current != null && event.pointerId !== pointerIdRef.current) return

      const heldMs = holdStartRef.current ? performance.now() - holdStartRef.current : 0
      const hadHoldSession = holdSessionRef.current
      holdStartRef.current = null
      pointerIdRef.current = null
      setHolding(false)

      if (waypoint?.id && heldMs > 0) {
        track(TRACK_EVENTS.THRESHOLD_HOLD, {
          duration_ms: Math.round(heldMs),
          waypoint_id: waypoint.id,
          latched: revealRef.current >= REVEAL_COMPLETE,
        })
      }

      if (reducedMotion) {
        if (revealRef.current >= REVEAL_COMPLETE) {
          latchedRef.current = true
          setLatchedToThen(true)
          setVideoPlaying(true)
          if (hadHoldSession) endHoldSession({ reveal: revealRef.current, latched: true })
          return
        }
        setReveal(0)
        revealRef.current = 0
        setVideoPlaying(false)
        audioRef.current?.rampToNow(200)
        if (hadHoldSession) endHoldSession({ reveal: 0, latched: false })
        return
      }

      if (revealRef.current >= REVEAL_COMPLETE) {
        latchedRef.current = true
        setLatchedToThen(true)
        cancelAnimation()
        setReveal(1)
        revealRef.current = 1
        setVideoPlaying(true)
        if (hadHoldSession) endHoldSession({ reveal: revealRef.current, latched: true })
        return
      }

      setVideoPlaying(false)
      animateReveal(revealRef.current, 0, THRESHOLD_RELEASE_MS)
      audioRef.current?.rampToNow(THRESHOLD_RELEASE_MS)
      if (hadHoldSession) endHoldSession({ reveal: revealRef.current, latched: false })
    },
    [animateReveal, cancelAnimation, endHoldSession, reducedMotion, waypoint?.id]
  )

  const handlePointerLeave = useCallback(
    (event) => {
      if (latchedRef.current) return
      handlePointerUp(event)
    },
    [handlePointerUp]
  )

  useEffect(() => cancelAnimation, [cancelAnimation])

  if (!active || !reconstruction) return null

  const thenCaption = reconstruction.caption ?? null
  const showNowAiBadge = waypoint?.now_image?.source === 'ai_generated'

  const seamLeft = `${revealToSeamPercent(reveal)}%`
  const nowClip = revealToClipRight(reducedMotion ? reducedMotionReveal(holding) : reveal)
  const thenSrc = reconstruction.loop ? null : reconstruction.then

  const layerStyle = immersive ? THRESHOLD_LAYER_COVER : THRESHOLD_LAYER_CONTAIN

  const thenLayer =
    reconstruction.loop ? (
      <ThresholdVideo
        src={reconstruction.loop}
        poster={reconstruction.then}
        playing={videoPlaying}
        className="threshold-layer"
        style={layerStyle}
      />
    ) : (
      <ThresholdLayerImage
        src={thenSrc}
        alt=""
        className="threshold-layer"
        style={layerStyle}
      />
    )

  const nowLayer = (
    <ThresholdLayerImage
      src={reconstruction.now}
      alt=""
      className="threshold-layer"
      style={layerStyle}
    />
  )

  return (
    <div
      className={`threshold-root ${immersive ? 'threshold-root--immersive' : ''} ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: embedded ? '100%' : '100dvh',
        overflow: 'hidden',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        background: 'var(--obsidian)',
        userSelect: 'none',
      }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      role="img"
      aria-label={
        latchedToThen
          ? `Showing ${thenLabel}. Tap to return to today at ${waypoint?.name ?? 'this place'}.`
          : `Press and hold to cross between now and ${thenLabel} at ${waypoint?.name ?? 'this place'}`
      }
    >
      <ThresholdMediaCanvas
        thenLayer={thenLayer}
        nowLayer={nowLayer}
        nowClip={nowClip}
        reducedMotion={reducedMotion}
        immersive={immersive}
      />

      {embedded && !hideUi ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(8,8,8,0.28) 100%)',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {!hideUi ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: seamLeft,
            width: embedded ? 2 : 3,
            transform: 'translateX(-50%)',
            background: 'var(--ember)',
            boxShadow: holding
              ? '0 0 24px rgba(232,161,60,0.85), 0 0 48px rgba(232,161,60,0.35)'
              : '0 0 18px 4px var(--ember-glow)',
            opacity: reveal > 0.02 && reveal < REVEAL_COMPLETE ? 1 : 0,
            transition: holding ? 'none' : 'left 420ms ease-out, opacity 150ms var(--ease)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          {embedded ? (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                borderRadius: 18,
                border: '2px solid var(--ember)',
                background: 'color-mix(in srgb, var(--obsidian) 55%, transparent)',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: holding ? '0 0 22px rgba(232,161,60,0.75)' : '0 0 16px rgba(232,161,60,0.5)',
              }}
            >
              <span style={{ color: 'var(--ember)', fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>‹›</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {!hideUi && !embedded ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 'max(1rem, env(safe-area-inset-top))',
              left: 'var(--edge)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              zIndex: 2,
            }}
          >
            {onDismiss ? (
              <button
                type="button"
                aria-label="Close threshold"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={onDismiss}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid color-mix(in srgb, var(--warm-white) 20%, transparent)',
                  background: 'color-mix(in srgb, var(--obsidian) 70%, transparent)',
                  color: 'var(--warm-white)',
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            ) : null}
            <span
              style={{
                fontSize: 'var(--fs-caption)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'color-mix(in srgb, var(--warm-white) 60%, transparent)',
                pointerEvents: 'none',
              }}
            >
              Now
            </span>
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
        </>
      ) : !hideUi && embedded && !immersive ? (
        <>
          <div style={{ position: 'absolute', bottom: embedded ? 14 : 14, left: 14, zIndex: 3, pointerEvents: 'none' }}>
            <span style={eraPillStyle(reveal > 0.2)}>{thenLabel}</span>
          </div>
          <div style={{ position: 'absolute', bottom: embedded ? 14 : 14, right: 14, zIndex: 3, pointerEvents: 'none' }}>
            <span style={eraPillStyle(reveal < 0.8)}>Today</span>
          </div>
        </>
      ) : null}

      {!hideUi && !immersive && showNowAiBadge ? (
        <ThresholdSourceBadge
          align="left"
          label="About this present-day view"
          caption={AI_NOW_DISCLOSURE_COPY}
        />
      ) : null}

      {!hideUi && !immersive && thenCaption ? (
        <ThresholdSourceBadge
          align="right"
          label="About this reconstruction"
          caption={thenCaption}
        />
      ) : null}

      {!hideUi && showHoldHint ? (
        <ThresholdHoldHint
          className={embedded ? 'cw-threshold-hold-hint--embedded' : undefined}
        />
      ) : null}

      {!hideUi && latchedToThen ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: embedded
              ? 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1.5rem))'
              : 'max(2rem, env(safe-area-inset-bottom))',
            transform: 'translateX(-50%)',
            padding: '8px 16px',
            borderRadius: 20,
            background: 'color-mix(in srgb, var(--obsidian) 60%, transparent)',
            fontSize: 'var(--fs-meta)',
            fontWeight: 500,
            color: 'var(--warm-white)',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          Tap to return to today
        </div>
      ) : null}

      {onDismiss ? (
        <div
          style={{
            position: 'absolute',
            left: 'var(--edge)',
            right: 'var(--edge)',
            bottom: 'max(1.25rem, env(safe-area-inset-bottom))',
            display: 'grid',
            gap: 10,
            zIndex: 2,
          }}
        >
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onDismiss}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: 'none',
              borderRadius: 999,
              background: 'color-mix(in srgb, var(--obsidian) 72%, transparent)',
              color: 'var(--warm-white)',
              fontSize: 'var(--fs-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            {dismissLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
