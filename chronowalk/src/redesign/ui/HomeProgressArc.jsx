import { T, F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

const RING = 74
const STROKE = 8
const R = (RING - STROKE) / 2
const C = 2 * Math.PI * R

const BEAD_PALETTE = [T.actIV, T.actII, T.actIII, T.actVI, T.actV, T.encore, T.actI]

function beadTone(status, index) {
  const vivid = BEAD_PALETTE[index % BEAD_PALETTE.length]
  if (status === 'completed' || status === 'current') return vivid
  if (status === 'skipped') return `color-mix(in srgb, ${vivid} 35%, #E5DDD0 65%)`
  return '#E8E0D4'
}

/**
 * Light, colorful progress card — multi-act ring + stop beads (no mustard slab).
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
  const gradientId = 'home-progress-ring'

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
        padding: '15px 15px 13px',
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F7FBFF 45%, #FFF6F2 100%)',
        border: `1px solid ${T.limestone}`,
        boxShadow: '0 10px 28px rgba(78, 155, 143, 0.10)',
        color: T.ink,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 80% at 100% 0%, rgba(78,155,143,0.12) 0%, transparent 55%), radial-gradient(50% 70% at 0% 100%, rgba(177,74,110,0.10) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
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
              color: T.actIV,
            }}
          >
            {t('home.progress.count', { completed, total: safeTotal })}
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: F.display,
              fontSize: currentStopTitle ? 21 : 19,
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: T.ink,
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
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={T.actIV} />
                <stop offset="45%" stopColor={T.actIII} />
                <stop offset="100%" stopColor={T.actV} />
              </linearGradient>
            </defs>
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke="#E7E0D5"
              strokeWidth={STROKE}
            />
            <circle
              cx={RING / 2}
              cy={RING / 2}
              r={R}
              fill="none"
              stroke={`url(#${gradientId})`}
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
              color: T.ink,
            }}
          >
            {clamped}%
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          marginTop: 13,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {beads.map((stop, index) => {
          const isYou = stop.status === 'current'
          const isSkipped = stop.status === 'skipped'
          const size = isYou ? 9 : 6
          const color = beadTone(stop.status, index)
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
                background: color,
                boxShadow: isYou ? `0 0 0 3px color-mix(in srgb, ${color} 28%, transparent)` : 'none',
                border: isSkipped ? `1px solid color-mix(in srgb, ${color} 55%, #B5AAA0)` : 'none',
                boxSizing: 'border-box',
                opacity: stop.status === 'upcoming' ? 0.85 : 1,
              }}
            />
          )
        })}
      </div>
    </section>
  )
}
