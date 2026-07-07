import { useState, useRef, useEffect, useCallback } from 'react'
import { T, F } from '../tokens.js'
import { colosseumNow, THEN_colosseum } from '../images.js'
import { Vignette } from '../ui/index.js'

const HOLD_MS = 900

const THRESHOLD_COVER_STYLE = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center',
}

function ThenMediaLayer({ thenPhoto, thenLoop, thenClip, thenFilter, useStyledThen, onFallback }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !thenLoop) return undefined
    const playPromise = video.play()
    if (playPromise?.catch) {
      playPromise.catch(() => onFallback?.())
    }
    return undefined
  }, [thenLoop, onFallback])

  const objectPosition = useStyledThen ? 'center 18%' : 'center'

  if (thenLoop) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: thenClip,
          WebkitClipPath: thenClip,
          filter: thenFilter,
        }}
      >
        <video
          ref={videoRef}
          src={thenLoop}
          poster={thenPhoto}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          style={{ ...THRESHOLD_COVER_STYLE, objectPosition }}
          onError={() => onFallback?.()}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${thenPhoto})`,
        backgroundSize: 'cover',
        backgroundPosition: objectPosition,
        filter: thenFilter,
        clipPath: thenClip,
        WebkitClipPath: thenClip,
      }}
    >
      <img
        src={thenPhoto}
        alt=""
        aria-hidden
        style={{ display: 'none' }}
        onError={() => onFallback?.()}
      />
    </div>
  )
}

function pillStyle(active) {
  return {
    fontFamily: F.body,
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '5px 10px',
    borderRadius: 999,
    background: active ? 'rgba(22,19,15,0.72)' : 'rgba(22,19,15,0.45)',
    color: active ? T.warmWhite : `${T.muted}CC`,
    border: `1px solid ${active ? `${T.ember}55` : `${T.muted}33`}`,
    backdropFilter: 'blur(6px)',
    textShadow: '0 1px 6px rgba(0,0,0,0.6)',
  }
}

/**
 * Threshold — press-and-hold or drag scrubs the seam right → left (NOW → THEN).
 * Touch-safe: pointer-first; no touchstart preventDefault (breaks iOS hold).
 */
export default function C7Threshold({
  nowPhoto = colosseumNow,
  thenPhoto = THEN_colosseum,
  thenLoop = null,
  thenLabel = 'ANCIENT ROME',
  honestyCaption = 'Statue placement evidence-based; awning colors informed conjecture',
  onCrossed,
  embedded = false,
  reserveCtaSpace = false,
}) {
  const [seamPct, setSeamPct] = useState(0)
  const [holding, setHolding] = useState(false)
  const [crossed, setCrossed] = useState(false)
  const [thenFallback, setThenFallback] = useState(false)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const holdStartRef = useRef(0)
  const pointerDownXRef = useRef(0)
  const dragModeRef = useRef(false)
  const bloomPosRef = useRef({ x: 0, y: 0 })
  const crossedNotified = useRef(false)
  const holdingRef = useRef(false)
  const seamPctRef = useRef(0)

  const useStyledThen = thenFallback || (!thenLoop && (!thenPhoto || thenPhoto === nowPhoto))
  const seamLeftPct = (1 - seamPct) * 100

  useEffect(() => {
    setThenFallback(false)
  }, [thenPhoto, thenLoop])

  useEffect(() => {
    if (crossed && !crossedNotified.current) {
      crossedNotified.current = true
      onCrossed?.()
    }
    if (!crossed) crossedNotified.current = false
  }, [crossed, onCrossed])

  const stopHold = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    holdingRef.current = false
    dragModeRef.current = false
    setHolding(false)
  }, [])

  const scrubFromClientX = useCallback((clientX) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = clientX - rect.left
    const pct = 1 - Math.max(0, Math.min(1, x / rect.width))
    seamPctRef.current = pct
    setSeamPct(pct)
    if (pct >= 0.98) {
      setCrossed(true)
      stopHold()
    }
  }, [stopHold])

  const tick = useCallback(
    (now) => {
      if (!holdingRef.current || dragModeRef.current) return
      const pct = Math.min((now - holdStartRef.current) / HOLD_MS, 1)
      seamPctRef.current = pct
      setSeamPct(pct)
      if (pct >= 1) {
        setCrossed(true)
        stopHold()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [stopHold],
  )

  const startHold = useCallback(
    (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()

      const el = containerRef.current
      if (!el) return

      if (el.setPointerCapture) {
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }

      const rect = el.getBoundingClientRect()
      bloomPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      pointerDownXRef.current = e.clientX
      dragModeRef.current = false

      if (crossed) {
        setCrossed(false)
        seamPctRef.current = 0
        setSeamPct(0)
      }

      holdingRef.current = true
      setHolding(true)
      holdStartRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
    },
    [crossed, tick],
  )

  const moveHold = useCallback(
    (e) => {
      if (!holdingRef.current) return
      if (Math.abs(e.clientX - pointerDownXRef.current) > 10) {
        dragModeRef.current = true
      }
      if (dragModeRef.current) {
        if (e.cancelable) e.preventDefault()
        const el = containerRef.current
        if (el) {
          const rect = el.getBoundingClientRect()
          bloomPosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          }
        }
        scrubFromClientX(e.clientX)
      }
    },
    [scrubFromClientX],
  )

  const endHold = useCallback(
    (e) => {
      const el = containerRef.current
      if (el?.releasePointerCapture) {
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }
      if (holdingRef.current && seamPctRef.current < 0.98 && !dragModeRef.current) {
        seamPctRef.current = 0
        setSeamPct(0)
      }
      stopHold()
    },
    [stopHold],
  )

  const crossInstant = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      stopHold()
      seamPctRef.current = 1
      setSeamPct(1)
      setCrossed(true)
    },
    [stopHold],
  )

  const returnToNow = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      stopHold()
      seamPctRef.current = 0
      setCrossed(false)
      setSeamPct(0)
    },
    [stopHold],
  )

  useEffect(() => () => stopHold(), [stopHold])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const blockContextMenu = (e) => e.preventDefault()

    el.addEventListener('contextmenu', blockContextMenu)

    return () => {
      el.removeEventListener('contextmenu', blockContextMenu)
    }
  }, [])

  const thenClip = `inset(0 ${100 - seamPct * 100}% 0 0)`
  const thenFilter = thenLoop && !thenFallback
    ? 'none'
    : useStyledThen
      ? 'sepia(72%) contrast(0.82) brightness(0.72) saturate(1.35) hue-rotate(-8deg)'
      : 'sepia(42%) contrast(0.92) brightness(0.86) saturate(1.12)'

  const surface = (
    <div
      ref={containerRef}
      className="cw-threshold-surface"
      style={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        cursor: 'pointer',
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (e.target.closest('button')) return
        startHold(e)
      }}
      onPointerMove={moveHold}
      onPointerUp={endHold}
      onPointerCancel={endHold}
      onPointerLeave={(e) => {
        if (holdingRef.current) endHold(e)
      }}
    >
      {/* NOW — today (right of seam); match THEN video cover + center framing */}
      <img
        src={nowPhoto}
        alt=""
        aria-hidden
        draggable={false}
        style={THRESHOLD_COVER_STYLE}
      />

      {/* THEN — ancient (revealed left of seam as it sweeps RTL) */}
      <ThenMediaLayer
        thenPhoto={thenPhoto}
        thenLoop={thenLoop}
        thenClip={thenClip}
        thenFilter={thenFilter}
        useStyledThen={useStyledThen}
        onFallback={() => setThenFallback(true)}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(22,19,15,${0.04 + seamPct * 0.1})`,
          pointerEvents: 'none',
        }}
      />

      <Vignette />

      {/* Hold pulse — ember bloom at touch point */}
      {holding && (
        <div
          style={{
            position: 'absolute',
            left: bloomPosRef.current.x,
            top: bloomPosRef.current.y,
            width: 280,
            height: 280,
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${0.35 + seamPct * 0.85})`,
            background: 'radial-gradient(circle, rgba(232,161,60,0.42) 0%, rgba(232,161,60,0.14) 40%, transparent 72%)',
            pointerEvents: 'none',
            zIndex: 8,
            animation: dragModeRef.current ? 'none' : 'thresholdHoldPulse 0.75s ease-in-out infinite',
          }}
        />
      )}

      {/* Seam line + handle */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${seamLeftPct}%`,
          transform: 'translateX(-50%)',
          width: 2,
          background: T.ember,
          boxShadow: holding
            ? '0 0 24px rgba(232,161,60,0.85), 0 0 48px rgba(232,161,60,0.35)'
            : '0 0 14px rgba(232,161,60,0.55)',
          zIndex: 9,
          pointerEvents: 'none',
          transition: holding ? 'none' : 'left 420ms ease-out, box-shadow 200ms',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            borderRadius: 18,
            border: `2px solid ${T.ember}`,
            background: 'rgba(22,19,15,0.55)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: holding ? '0 0 22px rgba(232,161,60,0.75)' : '0 0 16px rgba(232,161,60,0.5)',
            animation: holding ? 'none' : 'seamBreathe 3s ease-in-out infinite',
          }}
        >
          <span style={{ color: T.ember, fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>‹›</span>
        </div>
      </div>

      {!holding && !crossed && seamPct < 0.02 && (
        <div
          style={{
            position: 'absolute',
            bottom: embedded ? 52 : 72,
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <p
            style={{
              fontFamily: F.body,
              fontSize: 13,
              color: T.warmWhite,
              letterSpacing: '0.06em',
              textShadow: '0 1px 12px rgba(0,0,0,0.85)',
            }}
          >
            Press and hold — or drag the seam
          </p>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 10, pointerEvents: 'none' }}>
        <span style={pillStyle(seamPct > 0.2)}>{thenLabel}</span>
      </div>

      <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 10, pointerEvents: 'none' }}>
        <span style={pillStyle(seamPct < 0.8)}>TODAY</span>
      </div>

      {crossed && honestyCaption ? (
        <div
          style={{
            position: 'absolute',
            bottom: 44,
            left: 14,
            maxWidth: 240,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <p style={{ fontFamily: F.body, fontSize: 10, color: `${T.muted}CC`, lineHeight: 1.55 }}>
            {honestyCaption}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={crossed ? returnToNow : crossInstant}
        style={{
          position: 'absolute',
          bottom: 44,
          right: 14,
          zIndex: 11,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: F.body,
          fontSize: 12,
          color: `${T.muted}CC`,
          textShadow: '0 1px 8px rgba(0,0,0,0.8)',
          padding: '8px 4px',
        }}
      >
        {crossed ? 'Return to today' : 'Cross without holding'}
      </button>
    </div>
  )

  if (!embedded) return surface

  return (
    <div
      className={`cw-threshold-embedded${reserveCtaSpace ? ' cw-threshold-embedded--reserve-cta' : ''}`}
      style={{ background: T.obsidian, fontFamily: F.body }}
    >
      <p className="cw-threshold-embedded__eyebrow">Immersion</p>
      <div className="cw-threshold-embedded__card">
        <div className="cw-threshold-embedded__handle" aria-hidden />
        <div className="cw-threshold-embedded__surface">{surface}</div>
      </div>
      <p className="cw-threshold-embedded__footer">Then · Now</p>
    </div>
  )
}
