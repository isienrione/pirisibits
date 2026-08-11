import { useContext } from 'react'
import { T, F, SHELL_SAFE_BOTTOM_INSET } from '../tokens.js'
import { colosseumNow } from '../images.js'
import { RedesignNavCtx } from '../nav.js'
import { Vignette, BottomScrim } from '../ui/index.js'
import { useT } from '../../i18n/I18nProvider.jsx'

export default function C8aPathChoice({ onChoose, busy = false }) {
  const { navigate } = useContext(RedesignNavCtx)
  const t = useT()

  const inkPanel = 'rgba(33,28,21,0.70)'
  const hairline = 'rgba(245,239,227,0.13)'

  const paths = [
    {
      key: 'A',
      label: t('pathChoice.pathA.label'),
      chip: t('pathChoice.pathA.chip'),
      chipStyle: { background: T.ember, color: T.obsidian },
      body: t('pathChoice.pathA.body'),
      cta: t('pathChoice.pathA.cta'),
    },
    {
      key: 'B',
      label: t('pathChoice.pathB.label'),
      chip: t('pathChoice.pathB.chip'),
      chipStyle: { border: `1px solid ${hairline}`, color: T.warmWhite, background: 'transparent' },
      body: t('pathChoice.pathB.body'),
      cta: t('pathChoice.pathB.cta'),
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
            {t('pathChoice.title')}
          </h2>
          <p style={{ fontSize: 15, color: T.muted }}>{t('pathChoice.subtitle')}</p>
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
          {t('pathChoice.footnote')}
        </p>
      </div>
    </div>
  )
}
