import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

function phaseForProgress(ratio) {
  if (ratio <= 0) return 'dawn'
  if (ratio < 0.33) return 'opening'
  if (ratio < 0.66) return 'midday'
  if (ratio < 0.9) return 'deepening'
  if (ratio < 1) return 'dusk'
  return 'complete'
}

/**
 * Symbolic day-arc of the walk — not a literal stop list, a sense of where
 * the traveler sits between beginning and end.
 */
export default function HomeProgressArc({ completed = 0, total = 0, currentStopTitle = null }) {
  const t = useT()
  const safeTotal = Math.max(total, 1)
  const ratio = Math.min(1, Math.max(0, completed / safeTotal))
  const phase = phaseForProgress(ratio)
  const percent = Math.round(ratio * 100)

  const phaseLabel = {
    dawn: t('home.progress.phase.dawn'),
    opening: t('home.progress.phase.opening'),
    midday: t('home.progress.phase.midday'),
    deepening: t('home.progress.phase.deepening'),
    dusk: t('home.progress.phase.dusk'),
    complete: t('home.progress.phase.complete'),
  }[phase]

  const beads = 7
  const activeBead = Math.min(beads - 1, Math.round(ratio * (beads - 1)))

  return (
    <section
      aria-label={t('home.progress.aria', { percent })}
      style={{
        borderRadius: 18,
        padding: '18px 18px 16px',
        background: `linear-gradient(145deg, ${T.charcoal} 0%, #241f1a 55%, #1a1612 100%)`,
        border: `1px solid ${T.gold}22`,
        boxShadow: '0 12px 32px rgba(11,11,13,0.22)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: F.body,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: T.gold,
            fontWeight: 600,
          }}
        >
          {phaseLabel}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: F.body,
            fontSize: 13,
            color: `${T.warmWhite}aa`,
          }}
        >
          {t('home.progress.count', { completed, total: safeTotal })}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          height: 28,
          display: 'flex',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            height: 3,
            borderRadius: 999,
            background: `${T.warmWhite}18`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 6,
            width: `calc(${percent}% - 12px)`,
            maxWidth: 'calc(100% - 12px)',
            height: 3,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${T.actI}, ${T.gold})`,
            transition: 'width 420ms ease',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 2px',
          }}
        >
          {Array.from({ length: beads }, (_, index) => {
            const filled = index <= activeBead
            const isYou = index === activeBead
            return (
              <span
                key={index}
                aria-hidden
                style={{
                  width: isYou ? 14 : 9,
                  height: isYou ? 14 : 9,
                  borderRadius: 999,
                  background: filled ? T.gold : `${T.warmWhite}22`,
                  border: isYou ? `2px solid ${T.warmWhite}` : 'none',
                  boxShadow: isYou ? `0 0 0 4px ${T.gold}33` : 'none',
                  transition: 'transform 240ms ease',
                  transform: isYou ? 'scale(1.05)' : 'none',
                }}
              />
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: currentStopTitle ? 12 : 0,
        }}
      >
        <span style={{ fontSize: 11, color: `${T.warmWhite}70`, fontFamily: F.body }}>
          {t('home.progress.start')}
        </span>
        <span style={{ fontSize: 11, color: `${T.warmWhite}70`, fontFamily: F.body }}>
          {t('home.progress.middle')}
        </span>
        <span style={{ fontSize: 11, color: `${T.warmWhite}70`, fontFamily: F.body }}>
          {t('home.progress.end')}
        </span>
      </div>

      {currentStopTitle ? (
        <p
          style={{
            margin: 0,
            fontFamily: F.display,
            fontSize: 18,
            fontWeight: 400,
            color: T.warmWhite,
            lineHeight: 1.25,
          }}
        >
          {t('home.progress.nowAt', { title: currentStopTitle })}
        </p>
      ) : null}
    </section>
  )
}
