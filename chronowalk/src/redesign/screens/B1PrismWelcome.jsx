import { useState, useEffect } from 'react'
import { T, F } from '../tokens.js'
import { severusNow } from '../images.js'
import { Vignette, ChronoWalkLogo } from '../ui/index.js'

export default function B1PrismWelcome({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)

  useEffect(() => {
    setPhase(0)
    const t1 = setTimeout(() => setPhase(1), 1300)
    const t2 = setTimeout(() => setPhase(2), 2600)
    const t3 = setTimeout(() => setCycleKey((k) => k + 1), 5800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [cycleKey])

  return (
    <div
      style={{
        background: '#000000',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: F.body,
      }}
      onClick={() => (onComplete ? onComplete() : setCycleKey((k) => k + 1))}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${severusNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.04) saturate(0.2)',
          pointerEvents: 'none',
        }}
      />
      <Vignette />

      <div
        style={{
          position: 'absolute',
          top: 'max(52px, env(safe-area-inset-top))',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <span style={{ fontSize: 10, color: `${T.muted}88`, letterSpacing: '0.16em' }}>TAP TO CONTINUE</span>
      </div>

      <ChronoWalkLogo
        size={148}
        mode="welcome"
        phase={phase}
        monumentPhoto={severusNow}
        monumentOpacity={0.09}
      />

      <div
        style={{
          marginTop: 40,
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 700ms ease 200ms',
        }}
      >
        <span
          style={{
            fontFamily: F.display,
            fontSize: 36,
            color: T.warmWhite,
            fontWeight: 300,
            letterSpacing: '0.38em',
            textShadow: '0 0 32px rgba(245,239,227,0.25)',
          }}
        >
          ROME
        </span>
      </div>

      <div style={{ position: 'absolute', bottom: 52, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ fontSize: 12, color: T.muted, letterSpacing: '0.08em' }}>tap to skip</span>
      </div>
    </div>
  )
}
