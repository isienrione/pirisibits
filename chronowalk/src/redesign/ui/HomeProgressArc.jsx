import { F } from '../tokens.js'
import { useT } from '../../i18n/I18nProvider.jsx'

/** Cool dawn → warm midday → deep dusk as the walk advances. */
function progressHue(ratio) {
  const t = Math.min(1, Math.max(0, ratio))
  // teal 168 → amber 38 → terracotta/rose 12
  const hue = t < 0.55 ? 168 - t * (130 / 0.55) : 38 - ((t - 0.55) / 0.45) * 26
  const sat = 42 + t * 28
  const light = 48 - t * 8
  return `hsl(${hue} ${sat}% ${light}%)`
}

function beadColor(status, index, total, overallRatio) {
  const localRatio = total <= 1 ? overallRatio : index / Math.max(total - 1, 1)
  const vivid = progressHue(Math.max(localRatio, overallRatio * 0.85))
  if (status === 'completed') return vivid
  if (status === 'current') return progressHue(Math.max(overallRatio, localRatio))
  if (status === 'skipped') return `color-mix(in srgb, ${vivid} 38%, #C9C0B2 62%)`
  return '#D9D1C4'
}

/**
 * Compact stop-by-stop progress path for Home.
 * Skipped stops stay visible in a weaker tone; no phase copy.
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
  const ratio = Math.min(1, Math.max(0, percent / 100))
  const accent = progressHue(ratio)
  const trackEnd = progressHue(Math.min(1, ratio + 0.18))

  const beads =
    stops.length > 0
      ? stops
      : Array.from({ length: safeTotal }, (_, index) => ({
          id: `n-${index}`,
          status: index < completed ? 'completed' : index === completed ? 'current' : 'upcoming',
        }))

  return (
    <section
      aria-label={t('home.progress.aria', { percent })}
      data-testid="home-progress-arc"
      style={{
        borderRadius: 16,
        padding: '12px 14px 11px',
        background: 'linear-gradient(180deg, #FFFaf3 0%, #F3EBE0 100%)',
        border: '1px solid #E4D9C8',
        boxShadow: '0 6px 18px rgba(26, 22, 18, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: F.body,
            fontSize: 13,
            fontWeight: 600,
            color: '#3F3A34',
          }}
        >
          {t('home.progress.count', { completed, total: safeTotal })}
        </p>
        <p
          data-testid="home-progress-percent"
          style={{
            margin: 0,
            fontFamily: F.display,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1,
            color: accent,
            letterSpacing: '-0.02em',
          }}
        >
          {percent}%
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          height: 22,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            height: 4,
            borderRadius: 999,
            background: '#E7DFD2',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 4,
            width: `calc(${percent}% - 8px)`,
            maxWidth: 'calc(100% - 8px)',
            height: 4,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${progressHue(0)}, ${trackEnd})`,
            transition: 'width 380ms ease',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {beads.map((stop, index) => {
            const isYou = stop.status === 'current'
            const isSkipped = stop.status === 'skipped'
            const size = isYou ? 11 : isSkipped ? 7 : 8
            const color = beadColor(stop.status, index, beads.length, ratio)
            return (
              <span
                key={stop.id}
                title={stop.status}
                data-status={stop.status}
                aria-hidden
                style={{
                  width: size,
                  height: size,
                  borderRadius: 999,
                  flexShrink: 0,
                  background: stop.status === 'upcoming' ? '#EFE7DB' : color,
                  border:
                    stop.status === 'skipped'
                      ? `1.5px solid color-mix(in srgb, ${color} 55%, transparent)`
                      : isYou
                        ? '2px solid #FFFDF8'
                        : stop.status === 'upcoming'
                          ? '1px solid #D8CFC0'
                          : 'none',
                  boxShadow: isYou ? `0 0 0 3px color-mix(in srgb, ${color} 35%, transparent)` : 'none',
                  opacity: isSkipped ? 0.85 : 1,
                  boxSizing: 'border-box',
                }}
              />
            )
          })}
        </div>
      </div>

      {currentStopTitle ? (
        <p
          style={{
            margin: '9px 0 0',
            fontFamily: F.body,
            fontSize: 13,
            fontWeight: 500,
            color: '#5A534A',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('home.progress.nowAt', { title: currentStopTitle })}
        </p>
      ) : null}
    </section>
  )
}
