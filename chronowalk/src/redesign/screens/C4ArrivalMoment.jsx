import { useState, useEffect } from 'react'
import { T, F } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Vignette, BottomScrim, Eyebrow, Seam, ArrivalPulse } from '../ui/index.js'

export default function C4ArrivalMoment({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  arrivalLine = 'Take a second.\nLook up.',
  onBeginStory,
  busy = false,
}) {
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setPulseKey((k) => k + 1), 3200)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{ background: T.obsidian, height: '100%', position: 'relative', overflow: 'hidden', fontFamily: F.body }}
      onClick={onBeginStory}
      role={onBeginStory ? 'button' : undefined}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'brightness(0.45)',
        }}
      />
      <Vignette />
      <BottomScrim strength={0.88} />
      <Seam />

      <div
        style={{
          position: 'absolute',
          top: '36%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <ArrivalPulse size={240} accent={accent} cycleKey={pulseKey} logoSize={86} />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 'max(80px, calc(env(safe-area-inset-bottom) + 56px))',
        }}
      >
        <div style={{ textAlign: 'center', padding: '0 36px' }}>
          <Eyebrow color={accent}>YOU HAVE ARRIVED</Eyebrow>
          <h1
            style={{
              fontFamily: F.display,
              fontSize: 48,
              color: T.warmWhite,
              fontWeight: 300,
              lineHeight: 1.05,
              margin: '14px 0 22px',
              textShadow: '0 2px 32px rgba(0,0,0,0.6)',
            }}
          >
            {title}
          </h1>
          <div
            style={{
              width: 1.5,
              height: 32,
              background: T.ember,
              margin: '0 auto 18px',
              boxShadow: '0 0 12px rgba(232,161,60,0.5)',
              animation: 'seamBreathe 3s ease-in-out infinite',
            }}
          />
          <p
            style={{
              fontFamily: F.display,
              fontSize: 22,
              color: T.warmWhite,
              fontStyle: 'italic',
              opacity: 0.92,
              lineHeight: 1.4,
              textShadow: '0 1px 16px rgba(0,0,0,0.5)',
              whiteSpace: 'pre-line',
            }}
          >
            {arrivalLine}
          </p>
          {onBeginStory ? (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                onBeginStory()
              }}
              style={{
                marginTop: 28,
                padding: '14px 28px',
                borderRadius: 12,
                border: 'none',
                background: T.ember,
                color: T.obsidian,
                fontFamily: F.body,
                fontWeight: 600,
                fontSize: 15,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy ? 'Opening story…' : 'Begin story'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
