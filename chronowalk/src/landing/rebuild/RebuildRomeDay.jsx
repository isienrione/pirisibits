import { useId, useMemo } from 'react'
import {
  buildRoutePathD,
  getLandingTierMapBounds,
  getLandingTierRouteStops,
  getLandingTierTiberPath,
  projectRouteStops,
} from '../landingTierRoutes.js'
import { REBUILD_ROME_DAY } from '../rebuildCopy.js'

const MAP_W = 360
const MAP_H = 520

/** Soft label offsets so names breathe around dense centro stops. */
const LABEL_NUDGE = {
  colosseum: { dx: 14, dy: 4, anchor: 'start' },
  'palatine-hill-cluster': { dx: -12, dy: 16, anchor: 'end' },
  'forum-via-sacra': { dx: 12, dy: -10, anchor: 'start' },
  'capitoline-hill': { dx: -14, dy: -8, anchor: 'end' },
  pantheon: { dx: 14, dy: 2, anchor: 'start' },
  'piazza-navona': { dx: -14, dy: 12, anchor: 'end' },
  'fontana-di-trevi': { dx: 14, dy: -6, anchor: 'start' },
  'spanish-steps': { dx: 12, dy: -10, anchor: 'start' },
  'circus-maximus': { dx: -10, dy: 14, anchor: 'end' },
  'appian-way': { dx: 0, dy: 18, anchor: 'middle' },
}

function MonumentGlyph({ kind }) {
  switch (kind) {
    case 'colosseum':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <ellipse cx="0" cy="1" rx="7" ry="4.2" />
          <ellipse cx="0" cy="1" rx="4.2" ry="2.4" />
          <path d="M-5.2 -1.2v4.2M0 -1.8v5M5.2 -1.2v4.2" />
        </g>
      )
    case 'pantheon':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-6 3.5h12" />
          <path d="M-5 3.5V1.2h10V3.5" />
          <path d="M-4 1.2C-4 -2.8 4 -2.8 4 1.2" />
          <circle cx="0" cy="-0.2" r="0.7" fill="currentColor" stroke="none" />
        </g>
      )
    case 'forum':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-5.5 3.5 0 -3.5 5.5 3.5Z" />
          <path d="M-2.5 3.5v-3h5v3" />
        </g>
      )
    case 'trevi':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-6 2.5h12" />
          <path d="M-4.5 2.5V0h9v2.5" />
          <path d="M-2 0c0-2.5 4-2.5 4 0" />
          <circle cx="0" cy="3.4" r="1.1" />
        </g>
      )
    case 'steps':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-5.5 3.5h11M-4 1.5h8M-2.5 -.5h5M-1 -2.5h2" />
        </g>
      )
    case 'navona':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <ellipse cx="0" cy="0.5" rx="5.5" ry="7" />
          <circle cx="0" cy="0.5" r="1.4" />
        </g>
      )
    case 'circus':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <rect x="-7" y="-2.2" width="14" height="4.4" rx="2.2" />
          <path d="M-4 0h8" />
        </g>
      )
    case 'appian':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-1 -5.5v11M-4 -2h6M-3.2 1h4.8M-2.4 4h3.2" />
        </g>
      )
    case 'hill':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <path d="M-6.5 3.2 0 -3.5 6.5 3.2Z" />
          <path d="M-2.5 3.2 0 -.2 2.5 3.2" />
        </g>
      )
    default:
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.1">
          <circle cx="0" cy="0" r="4.5" />
          <circle cx="0" cy="0" r="1.2" fill="currentColor" stroke="none" />
        </g>
      )
  }
}

function glyphForStop(id) {
  if (id === 'colosseum') return 'colosseum'
  if (id === 'pantheon') return 'pantheon'
  if (id.includes('forum') || id === 'capitoline-hill') return 'forum'
  if (id === 'fontana-di-trevi') return 'trevi'
  if (id === 'spanish-steps') return 'steps'
  if (id === 'piazza-navona') return 'navona'
  if (id === 'circus-maximus') return 'circus'
  if (id === 'appian-way') return 'appian'
  if (id.includes('palatine') || id.includes('hill')) return 'hill'
  return 'default'
}

function smoothRoutePath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) return buildRoutePathD(points)
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 1; i < points.length - 1; i += 1) {
    const curr = points[i]
    const next = points[i + 1]
    const mx = (curr.x + next.x) / 2
    const my = (curr.y + next.y) / 2
    d += ` Q ${curr.x.toFixed(2)} ${curr.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`
  }
  const last = points[points.length - 1]
  d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  return d
}

/**
 * Section 4 — editorial illustrated Rome day map.
 * Aspiration over navigation: city-guide paper, gold walk, monument marks.
 */
export default function RebuildRomeDay() {
  const copy = REBUILD_ROME_DAY
  const uid = useId().replace(/:/g, '')
  const bounds = getLandingTierMapBounds('rome-complete')
  const allStops = getLandingTierRouteStops('rome-complete')

  const { projected, routePath, tiberPath, highlights, faintRoads } = useMemo(() => {
    const projectedStops = projectRouteStops(allStops, {
      width: MAP_W,
      height: MAP_H,
      padding: 42,
      bounds,
    })
    const highlightSet = new Set(copy.highlights)
    const marked = projectedStops
      .filter((stop) => highlightSet.has(stop.id))
      .sort((a, b) => a.index - b.index)

    const roads = [
      [marked[0], marked[1], marked[3]].filter(Boolean),
      [marked[3], marked[4], marked[5], marked[6]].filter(Boolean),
      [marked[6], marked[7]].filter(Boolean),
      [marked[1], marked[8], marked[9]].filter(Boolean),
    ]
      .map((pts) => buildRoutePathD(pts))
      .filter(Boolean)

    return {
      projected: projectedStops,
      routePath: smoothRoutePath(projectedStops),
      tiberPath: getLandingTierTiberPath({
        width: MAP_W,
        height: MAP_H,
        padding: 42,
        bounds,
      }),
      highlights: marked,
      faintRoads: roads,
    }
  }, [allStops, bounds, copy.highlights])

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-rome-day cw-rb-surface--light"
      aria-labelledby="rome-day-heading"
    >
      <div id="flexible-journey" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="route-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="adaptive-walk" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />

      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header className="cw-rb-rome-day__intro">
          <h2 id="rome-day-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.body}</p>
        </header>

        <figure className="cw-rb-rome-day__map" aria-label="Illustrated ChronoWalk route through Rome">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-hidden="true">
            <defs>
              <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--rb-day)" />
                <stop offset="55%" stopColor="var(--rb-sheet)" />
                <stop offset="100%" stopColor="var(--rb-stone)" />
              </linearGradient>
              <linearGradient id={`${uid}-route`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--rb-gold)" />
                <stop offset="100%" stopColor="var(--rb-terracotta)" />
              </linearGradient>
              <linearGradient id={`${uid}-river`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4e7d9b" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#4e7d9b" stopOpacity="0.16" />
              </linearGradient>
              <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" floodColor="#211c15" floodOpacity="0.14" />
              </filter>
              <filter id={`${uid}-pin`} x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.1" floodColor="#211c15" floodOpacity="0.22" />
              </filter>
              <pattern id={`${uid}-grain`} width="48" height="48" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="9" r="0.6" fill="#211c15" opacity="0.035" />
                <circle cx="22" cy="18" r="0.5" fill="#211c15" opacity="0.03" />
                <circle cx="38" cy="7" r="0.55" fill="#211c15" opacity="0.028" />
                <circle cx="14" cy="34" r="0.45" fill="#211c15" opacity="0.03" />
                <circle cx="31" cy="40" r="0.5" fill="#211c15" opacity="0.025" />
              </pattern>
            </defs>

            <rect width={MAP_W} height={MAP_H} rx="28" fill={`url(#${uid}-paper)`} />
            <rect width={MAP_W} height={MAP_H} rx="28" fill={`url(#${uid}-grain)`} />

            {/* Terrain washes */}
            <ellipse cx="268" cy="118" rx="78" ry="54" fill="#b9af9c" opacity="0.16" />
            <ellipse cx="96" cy="210" rx="70" ry="48" fill="#b9af9c" opacity="0.12" />
            <ellipse cx="210" cy="360" rx="92" ry="60" fill="#6b7a52" opacity="0.08" />
            <ellipse cx="72" cy="420" rx="64" ry="46" fill="#b9af9c" opacity="0.11" />

            {/* Tiber */}
            <path
              d={tiberPath}
              fill="none"
              stroke={`url(#${uid}-river)`}
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={tiberPath}
              fill="none"
              stroke="#4e7d9b"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
            />

            {/* Minimal streets */}
            {faintRoads.map((d) => (
              <path
                key={d}
                d={d}
                fill="none"
                stroke="#211c15"
                strokeWidth="1.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.07"
              />
            ))}

            {/* Gold walking route */}
            <path
              d={routePath}
              fill="none"
              stroke={`url(#${uid}-route)`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.92"
              filter={`url(#${uid}-soft)`}
            />

            {/* Quiet secondary stops */}
            {projected.map((stop) =>
              copy.highlights.includes(stop.id) ? null : (
                <circle
                  key={stop.id}
                  cx={stop.x}
                  cy={stop.y}
                  r="2"
                  fill="#b9af9c"
                  opacity="0.45"
                />
              ),
            )}

            {/* Landmark glyphs + elegant numbered stops */}
            {highlights.map((stop, index) => {
              const nudge = LABEL_NUDGE[stop.id] ?? { dx: 12, dy: 4, anchor: 'start' }
              const glyph = glyphForStop(stop.id)
              const labelX = stop.x + nudge.dx
              const labelY = stop.y + nudge.dy
              return (
                <g key={stop.id} className="cw-rb-rome-day__stop">
                  <g
                    transform={`translate(${stop.x + (nudge.anchor === 'end' ? -18 : nudge.anchor === 'middle' ? 0 : 18)} ${stop.y - 22})`}
                    className="cw-rb-rome-day__glyph"
                    color="#8b8638"
                    opacity="0.72"
                  >
                    <MonumentGlyph kind={glyph} />
                  </g>
                  <circle
                    cx={stop.x}
                    cy={stop.y}
                    r="11"
                    fill="#faf6ef"
                    stroke="#d4af37"
                    strokeWidth="1.4"
                    filter={`url(#${uid}-pin)`}
                  />
                  <circle cx={stop.x} cy={stop.y} r="8.2" fill="#211c15" />
                  <text
                    x={stop.x}
                    y={stop.y + 3.4}
                    textAnchor="middle"
                    fill="#faf6ef"
                    fontSize="8.5"
                    fontFamily="DM Sans, system-ui, sans-serif"
                    fontWeight="700"
                  >
                    {index + 1}
                  </text>
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={nudge.anchor}
                    fill="#211c15"
                    fontSize="11"
                    fontFamily="Fraunces, Georgia, serif"
                    fontWeight="500"
                  >
                    {stop.short}
                  </text>
                </g>
              )
            })}

            {/* Cartouche */}
            <g transform="translate(28 34)">
              <text
                x="0"
                y="0"
                fill="#211c15"
                fontSize="9"
                letterSpacing="0.22em"
                fontFamily="DM Sans, system-ui, sans-serif"
                fontWeight="650"
                opacity="0.55"
              >
                ROME
              </text>
              <text
                x="0"
                y="16"
                fill="#211c15"
                fontSize="13"
                fontFamily="Fraunces, Georgia, serif"
                fontWeight="500"
              >
                A day among ruins
              </text>
            </g>

            {/* Compass */}
            <g transform="translate(318 46)" opacity="0.55">
              <circle cx="0" cy="0" r="11" fill="none" stroke="#211c15" strokeWidth="0.8" />
              <path d="M0 -7 L2.2 1.5 L0 0 L-2.2 1.5 Z" fill="#d4af37" />
              <text
                x="0"
                y="18"
                textAnchor="middle"
                fill="#211c15"
                fontSize="7"
                fontFamily="DM Sans, system-ui, sans-serif"
                letterSpacing="0.12em"
              >
                N
              </text>
            </g>
          </svg>
        </figure>

        <p className="cw-rb-rome-day__aside">
          {copy.scenarios.slice(0, 3).join(' · ')}
        </p>
      </div>
    </section>
  )
}
