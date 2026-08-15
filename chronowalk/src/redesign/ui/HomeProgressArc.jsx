import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

const RING = 72
const STROKE = 7
const R = (RING - STROKE) / 2
const C = 2 * Math.PI * R

/**
 * Hero progress card — gold ChronoWalk accent, circular %, stop beads.
 * Skipped stops stay in the total with a weaker bead.
 */
export default function HomeProgressArc({
  stops = [],
  completed = 0,
  total = 0,
  percent = 0,
  currentStopTitle = null,
}) {
  const t = useT()
  const safeTotal = Math.max(total, stops.length, 1)
  const clamped = Math.min(100, Math.max(0, percent))
  const offset = C * (1 - clamped / 100)

  const beads =
    stops.length > 0
      ? stops
      : Array.from({ length: safeTotal }, (_, index) => ({
          id: `n-${index}`,
          status: index < completed ? 'completed' : index === completed ? 'current' : 'upcoming',
        }))

  return (
    <section
      aria-label={t('home.progress.aria', { percent: clamped })}
      data-testid="home-progress-arc"
      style={{
        borderRadius: 22,
        padding: '16px 16px 14px',
        background: `linear-gradient(145deg, ${T.ember} 0%, #C9A227 55%, #B8921F 100%)`,
        color: T.obsidian,
        boxShadow: '0 14px 36px rgba(212, 175, 55, 0.28)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: F.body,
              fontSize: 12,
              fontWeight: 650,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.72,
            }}
          >
            {t('home.progress.count', { completed, total: safeTotal })}
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: F.display,
              fontSize: currentStopTitle ? 22 : 20,
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {currentStopTitle
              ? t('home.progress.nowAt', { title: currentStopTitle })
              : t('home.progress.ready')}
          </p>
        </div>

        <div
          data-testid="home-progress-percent"
          style={{
            position: 'relative',
            width: RING,
            height: RING,
            flexShrink: 0,
          }}
        >
          <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden>
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke="rgba(11,11,13,0.14)"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke={T.obsidian}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              style={{ transition: 'stroke-dashoffset 420ms ease' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontFamily: F.display,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-0.03em',
            }}
          >
            {clamped}%
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {beads.map((stop) => {
          const isYou = stop.status === 'current'
          const isSkipped = stop.status === 'skipped'
          const isDone = stop.status === 'completed'
          const size = isYou ? 9 : 6
          return (
            <span
              key={stop.id}
              data-status={stop.status}
              aria-hidden
              style={{
                width: size,
                height: size,
                borderRadius: 999,
                flexShrink: 0,
                background: isDone || isYou ? T.obsidian : isSkipped ? 'rgba(11,11,13,0.28)' : 'rgba(11,11,13,0.14)',
                boxShadow: isYou ? '0 0 0 3px rgba(11,11,13,0.18)' : 'none',
                border: isSkipped ? '1px solid rgba(11,11,13,0.35)' : 'none',
                boxSizing: 'border-box',
              }}
            />
          )
        })}
      </div>
    </section>
  )
}
