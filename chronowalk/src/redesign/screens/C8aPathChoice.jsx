import { useContext } from 'react'
import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { RedesignNavCtx } from '../nav.js'
import { Vignette, BottomScrim } from '../ui/index.js'

export default function C8aPathChoice({ onChoose, busy = false }) {
  const { navigate } = useContext(RedesignNavCtx)

  const inkPanel = 'rgba(33,28,21,0.70)'
  const hairline = 'rgba(245,239,227,0.13)'

  const paths = [
    {
      key: 'A',
      label: 'Path A — The Forum Direct',
      chip: '~45 min shorter',
      chipStyle: { background: T.ember, color: T.obsidian },
      body: 'Straight through the gate of triumphs and down into the heart. The Palatine stays available as an optional climb.',
      cta: 'Take The Forum Direct',
    },
    {
      key: 'B',
      label: "Path B — The Emperor's Approach",
      chip: 'The full hill',
      chipStyle: { border: `1px solid ${hairline}`, color: T.warmWhite, background: 'transparent' },
      body: "Past Constantine's arch, up the Palatine the way power went — palace, Circus Maximus View, then descend into the Forum from above.",
      cta: "Take The Emperor's Approach",
    },
  ]

  const choosePath = (key) => {
    if (busy) return
    if (onChoose) onChoose(key)
    else navigate('C2')
  }

  return (
    <div
      data-testid="path-choice-screen"
      style={{ background: T.obsidian, height: '100%', position: 'relative', overflow: 'hidden', fontFamily: F.body, display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${colosseumNow})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 25%',
          filter: 'brightness(0.42) sepia(18%) saturate(1.4)',
        }}
      />
      <Vignette />
      <BottomScrim strength={0.82} />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'max(56px, calc(env(safe-area-inset-top) + 24px)) 24px 0',
        }}
      >
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <h2
            style={{
              fontFamily: F.display,
              fontSize: 30,
              color: T.warmWhite,
              fontWeight: 300,
              lineHeight: 1.12,
              marginBottom: 6,
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            Two doors into ancient Rome.
          </h2>
          <p style={{ fontSize: 15, color: T.muted }}>Pick your appetite.</p>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
          {paths.map((path) => (
            <button
              key={path.key}
              type="button"
              data-testid={`path-choice-${path.key.toLowerCase()}`}
              disabled={busy}
              onClick={() => choosePath(path.key)}
              style={{
                textAlign: 'left',
                background: inkPanel,
                border: `1px solid ${hairline}`,
                borderRadius: 14,
                padding: '20px 18px',
                cursor: busy ? 'wait' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'border-color 250ms, background 250ms',
                backdropFilter: 'blur(6px)',
                opacity: busy ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <span
                  style={{
                    fontFamily: F.body,
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: T.warmWhite,
                    fontWeight: 600,
                    lineHeight: 1.4,
                  }}
                >
                  {path.label}
                </span>
                <span
                  style={{
                    ...path.chipStyle,
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    borderRadius: 6,
                    padding: '3px 9px',
                    flexShrink: 0,
                    fontWeight: 500,
                  }}
                >
                  {path.chip}
                </span>
              </div>
              <p style={{ fontSize: 14, color: `${T.warmWhite}CC`, lineHeight: 1.65, margin: 0 }}>{path.body}</p>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: T.ember,
                  letterSpacing: '0.02em',
                }}
              >
                {path.cta} →
              </span>
            </button>
          ))}
        </div>

        <p
          style={{
            fontSize: 12,
            color: T.muted,
            lineHeight: 1.65,
            textAlign: 'center',
            margin: 0,
            flexShrink: 0,
            padding: `12px 0 ${SHELL_SAFE_BOTTOM_INSET}`,
          }}
        >
          Same ticket, same stops available, same single entry. Nothing is lost either way.
        </p>
      </div>
    </div>
  )
}
