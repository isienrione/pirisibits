import { useState, useEffect, useRef } from 'react'
import { T, F } from '../tokens.js'
import { colosseumNow, THEN_colosseum } from '../images.js'
import { Vignette, ElectricSeam } from '../ui/index.js'

export default function C7Threshold({
  nowPhoto = colosseumNow,
  thenPhoto = THEN_colosseum,
  honestyCaption = 'Statue placement evidence-based; awning colors informed conjecture',
  onDismiss,
}) {
  const [state, setState] = useState('idle')
  const [introPct, setIntroPct] = useState(0)
  const [erasePct, setErasePct] = useState(0)
  const [bloomPos, setBloomPos] = useState({ x: 195, y: 422 })
  const [bloomR, setBloomR] = useState(0)
  const holdTimer = useRef(null)
  const bloomRAF = useRef(null)
  const introRAF = useRef(null)
  const eraseRAF = useRef(null)

  const isThen = state === 'crossed' || state === 'returning'
  const introComplete = introPct >= 1

  useEffect(() => {
    let start = 0
    const duration = 920

    const tick = (now) => {
      if (!start) start = now
      const p = Math.min((now - start) / duration, 1)
      setIntroPct(p)
      if (p < 1) introRAF.current = requestAnimationFrame(tick)
    }

    introRAF.current = requestAnimationFrame(tick)
    return () => {
      if (introRAF.current) cancelAnimationFrame(introRAF.current)
    }
  }, [])

  useEffect(() => {
    if (state !== 'crossed') {
      setErasePct(0)
      return undefined
    }

    let start = 0
    const duration = 1200

    const tick = (now) => {
      if (!start) start = now
      const p = Math.min((now - start) / duration, 1)
      setErasePct(p)
      if (p < 1) eraseRAF.current = requestAnimationFrame(tick)
    }

    eraseRAF.current = requestAnimationFrame(tick)
    return () => {
      if (eraseRAF.current) cancelAnimationFrame(eraseRAF.current)
    }
  }, [state])

  const cleanup = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
    if (bloomRAF.current) {
      cancelAnimationFrame(bloomRAF.current)
      bloomRAF.current = null
    }
  }

  const handleDown = (e) => {
    if (!introComplete) return
    const rect = e.currentTarget.getBoundingClientRect()
    setBloomPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setState('holding')
    setBloomR(0)
    const start = performance.now()
    const tick = (now) => {
      const pct = Math.min((now - start) / 700, 1)
      setBloomR(pct)
      if (pct < 1) bloomRAF.current = requestAnimationFrame(tick)
      else setState('crossed')
    }
    bloomRAF.current = requestAnimationFrame(tick)
  }

  const handleUp = () => {
    cleanup()
    if (state === 'crossed') {
      setState('returning')
      setTimeout(() => {
        setState('idle')
        setErasePct(0)
      }, 420)
    } else if (state === 'holding') {
      setState('idle')
      setBloomR(0)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: introComplete ? 'pointer' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        fontFamily: F.body,
      }}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${nowPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          transition: 'opacity 600ms ease',
          opacity: isThen ? 0 : 1,
          filter: 'brightness(0.75)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${thenPhoto})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'sepia(60%) contrast(0.85) brightness(0.75) saturate(1.3)',
          transition: 'opacity 600ms ease',
          opacity: isThen ? 1 : 0,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(22,19,15,${isThen ? 0.18 : 0.1})`,
          transition: 'background 500ms',
        }}
      />

      <Vignette />

      <ElectricSeam
        revealPct={introPct}
        erasePct={erasePct}
        holding={state === 'holding'}
        crossed={state === 'crossed' || state === 'returning'}
      />

      {(state === 'holding' || state === 'crossed') && (
        <div
          style={{
            position: 'absolute',
            left: bloomPos.x,
            top: bloomPos.y,
            width: 700,
            height: 700,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(232,161,60,0.32) 0%, rgba(232,161,60,0.12) 35%, transparent 70%)',
            transform: `translate(-50%, -50%) scale(${bloomR})`,
            transition: state === 'crossed' ? 'transform 600ms ease-out' : 'none',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {state === 'idle' && introComplete && (
        <div style={{ position: 'absolute', bottom: 64, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
          <p
            style={{
              fontFamily: F.body,
              fontSize: 14,
              color: T.warmWhite,
              letterSpacing: '0.06em',
              textShadow: '0 1px 12px rgba(0,0,0,0.8)',
            }}
          >
            Press and hold to cross.
          </p>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 22, right: 18, zIndex: 10 }}>
        <span
          style={{
            fontFamily: F.body,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isThen ? T.ember : T.muted,
            transition: 'color 400ms',
            textShadow: '0 1px 8px rgba(0,0,0,0.8)',
          }}
        >
          {isThen ? 'c. 80 AD' : 'TODAY'}
        </span>
      </div>

      {isThen && honestyCaption ? (
        <div style={{ position: 'absolute', bottom: 22, left: 16, maxWidth: 210, zIndex: 10 }}>
          <p style={{ fontFamily: F.body, fontSize: 10, color: `${T.muted}BB`, lineHeight: 1.55 }}>
            {honestyCaption}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          cleanup()
          if (isThen) {
            setState('returning')
            setTimeout(() => {
              setState('idle')
              setErasePct(0)
            }, 400)
          } else if (introComplete) {
            setState('crossed')
          }
        }}
        style={{
          position: 'absolute',
          bottom: 48,
          right: 18,
          zIndex: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: F.body,
          fontSize: 12,
          color: `${T.muted}CC`,
          textShadow: '0 1px 8px rgba(0,0,0,0.8)',
          letterSpacing: '0.03em',
          padding: 0,
        }}
      >
        {isThen ? 'Return' : 'Cross without holding'}
      </button>
    </div>
  )
}
