import { T, F, SHELL_TAB_BAR_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { Seam, Vignette, Eyebrow } from '../ui/index.js'

export default function C3Approaching({
  accent = T.actI,
  title = 'The Colosseum',
  photo = colosseumNow,
  progressPct = 35,
  subtitle = 'almost there',
}) {
  const surface60 = '#706C65'

  return (
    <div style={{ background: surface60, height: '100%', position: 'relative', overflow: 'hidden', fontFamily: F.body }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          filter: 'blur(10px) brightness(0.50)',
          opacity: 0.44,
          transform: 'scale(1.06)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,19,15,0.42)' }} />
      <Vignette />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5 }}>
        <div style={{ height: '100%', width: `${progressPct}%`, background: accent, boxShadow: `0 0 8px ${accent}80` }} />
      </div>

      <Seam />

      <div style={{ position: 'absolute', top: '40%', left: '50%', zIndex: 6 }}>
        <div
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `1px solid ${accent}`,
            top: '50%',
            left: '50%',
            animation: 'approachPulse 3.8s ease-in-out infinite 0.7s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 62,
            height: 62,
            borderRadius: '50%',
            border: `1.5px solid ${accent}`,
            top: '50%',
            left: '50%',
            animation: 'approachPulse 3.8s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            borderRadius: 4,
            background: accent,
            boxShadow: `0 0 10px ${accent}CC, 0 0 20px ${accent}66`,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: `calc(${SHELL_TAB_BAR_INSET} + 16px)`,
          left: 0,
          right: 0,
          padding: '0 32px',
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        <Eyebrow color={accent}>ALMOST THERE</Eyebrow>
        <h1
          style={{
            fontFamily: F.display,
            fontSize: 40,
            color: T.warmWhite,
            fontWeight: 300,
            lineHeight: 1.05,
            margin: '12px 0 10px',
            textShadow: '0 2px 28px rgba(0,0,0,0.65)',
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14, color: `${T.warmWhite}70`, letterSpacing: '0.08em' }}>{subtitle}</p>
      </div>
    </div>
  )
}
