import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import {
  buildRoutePathD,
  getLandingTierMapBounds,
  getLandingTierRouteStops,
  getLandingTierTiberPath,
  projectRouteStops,
} from '../landingTierRoutes.js'

const MAP_W = 420
const MAP_H = 560

const LANDMARK_ORDER = [
  'colosseum',
  'forum-via-sacra',
  'palatine-hill-cluster',
  'pantheon',
  'fontana-di-trevi',
  'spanish-steps',
  'piazza-navona',
  'castel-sant-angelo',
  'appian-way',
]

const REGION_LABELS = [
  { id: 'ancient', label: 'Ancient Core', x: 292, y: 318, rotate: -8 },
  { id: 'historic', label: 'Historic Center', x: 168, y: 168, rotate: -4 },
  { id: 'appian', label: 'Appian Way Finale', x: 318, y: 498, rotate: 6 },
]

const LABEL_NUDGE = {
  colosseum: { dx: 16, dy: 6, anchor: 'start' },
  'forum-via-sacra': { dx: -14, dy: -10, anchor: 'end' },
  'palatine-hill-cluster': { dx: -12, dy: 18, anchor: 'end' },
  pantheon: { dx: 14, dy: 2, anchor: 'start' },
  'fontana-di-trevi': { dx: 14, dy: -8, anchor: 'start' },
  'spanish-steps': { dx: 12, dy: -12, anchor: 'start' },
  'piazza-navona': { dx: -14, dy: 14, anchor: 'end' },
  'castel-sant-angelo': { dx: -14, dy: -6, anchor: 'end' },
  'appian-way': { dx: 0, dy: 20, anchor: 'middle' },
}

function MonumentGlyph({ kind }) {
  switch (kind) {
    case 'colosseum':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <ellipse cx="0" cy="1.2" rx="9" ry="5.2" />
          <ellipse cx="0" cy="1.2" rx="5.6" ry="3.1" />
          <path d="M-7.2 -1.4v5.2M-3.6 -2.2v6M0 -2.6v6.4M3.6 -2.2v6M7.2 -1.4v5.2" />
          <path d="M-8.2 1.2h16.4" opacity="0.55" />
        </g>
      )
    case 'pantheon':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-7.5 4.2h15" />
          <path d="M-6.2 4.2V1.4h12.4V4.2" />
          <path d="M-5.2 1.4C-5.2 -3.6 5.2 -3.6 5.2 1.4" />
          <circle cx="0" cy="-0.6" r="0.85" fill="currentColor" stroke="none" />
          <path d="M-4.2 4.2v-2.2M0 4.2v-2.2M4.2 4.2v-2.2" opacity="0.7" />
        </g>
      )
    case 'forum':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-6.5 4.2 0 -4.2 6.5 4.2Z" />
          <path d="M-3.2 4.2V1h6.4v3.2" />
          <path d="M-1.6 1V-0.6h3.2V1" />
        </g>
      )
    case 'trevi':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-7.2 3.2h14.4" />
          <path d="M-5.4 3.2V0.2h10.8V3.2" />
          <path d="M-2.4 0.2c0-2.8 4.8-2.8 4.8 0" />
          <circle cx="0" cy="4.1" r="1.25" />
          <path d="M-3.6 3.2v-1.6M0 3.2v-1.6M3.6 3.2v-1.6" opacity="0.65" />
        </g>
      )
    case 'steps':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-6.8 4.2h13.6M-5.2 2h10.4M-3.6 0h7.2M-2 -2h4M-0.8 -3.8h1.6" />
        </g>
      )
    case 'navona':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <ellipse cx="0" cy="0.4" rx="5.8" ry="7.4" />
          <circle cx="0" cy="0.4" r="1.55" />
          <path d="M0 -4.8v-1.4M0 5.6v1.4" opacity="0.55" />
        </g>
      )
    case 'castel':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <rect x="-5.2" y="-1.2" width="10.4" height="5.6" rx="1.2" />
          <path d="M-3.6 -1.2V-3.4h2.2V-1.2M1.4 -1.2V-3.4h2.2V-1.2" />
          <circle cx="0" cy="1.4" r="1.5" />
          <path d="M0 -3.4v-1.8" />
        </g>
      )
    case 'appian':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-1.1 -6.2v12.4" />
          <path d="M-4.6 -2.4h7M-3.8 0.6h5.4M-3 3.6h3.8" />
          <path d="M1.4 -5.2 4.2 -3.4M1.4 5.2 4.2 3.4" opacity="0.55" />
        </g>
      )
    case 'hill':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round">
          <path d="M-7.2 3.6 0 -4.4 7.2 3.6Z" />
          <path d="M-2.8 3.6 0 -0.4 2.8 3.6" />
        </g>
      )
    default:
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.15">
          <circle cx="0" cy="0" r="4.8" />
          <circle cx="0" cy="0" r="1.3" fill="currentColor" stroke="none" />
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
  if (id === 'castel-sant-angelo') return 'castel'
  if (id === 'appian-way') return 'appian'
  if (id.includes('palatine') || id.includes('hill')) return 'hill'
  return 'default'
}

/** Organic cubic route — never perfectly straight. */
function organicRoutePath(points) {
  if (points.length < 2) return ''
  if (points.length === 2) return buildRoutePathD(points)

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const sway = (i % 2 === 0 ? 1 : -1) * Math.min(18, Math.hypot(dx, dy) * 0.18)
    const c1x = a.x + dx * 0.32 - dy * 0.08 + sway * 0.15
    const c1y = a.y + dy * 0.32 + dx * 0.08
    const c2x = a.x + dx * 0.68 + dy * 0.08 - sway * 0.15
    const c2y = a.y + dy * 0.68 - dx * 0.08 + sway
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
  }
  return d
}

/**
 * Editorial master map of Rome — museum / Monocle atlas quality.
 * Route draws on viewport entry (~4s).
 */
export default function RomeDayAtlas({
  highlights = LANDMARK_ORDER,
  className = '',
  animate = true,
}) {
  const uid = useId().replace(/:/g, '')
  const rootRef = useRef(null)
  const routeRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [drawn, setDrawn] = useState(!animate)
  const [visibleStops, setVisibleStops] = useState(animate ? 0 : highlights.length)
  const [activeStop, setActiveStop] = useState(0)

  const bounds = getLandingTierMapBounds('rome-complete')
  const allStops = getLandingTierRouteStops('rome-complete')

  const { projected, routePath, tiberPath, landmarks, faintRoads, youAreHere } = useMemo(() => {
    const projectedStops = projectRouteStops(allStops, {
      width: MAP_W,
      height: MAP_H,
      padding: 48,
      bounds,
    })
    const highlightSet = new Set(highlights)
    const marked = highlights
      .map((id) => projectedStops.find((s) => s.id === id))
      .filter(Boolean)

    const roads = [
      [marked[0], marked[1], marked[2]].filter(Boolean),
      [marked[3], marked[4], marked[5]].filter(Boolean),
      [marked[5], marked[6], marked[7]].filter(Boolean),
      [marked[2], marked[8]].filter(Boolean),
    ]
      .map((pts) => buildRoutePathD(pts))
      .filter(Boolean)

    const first = marked[0]
    const you = first
      ? { x: first.x - 14, y: first.y + 18 }
      : { x: MAP_W * 0.62, y: MAP_H * 0.55 }

    return {
      projected: projectedStops,
      routePath: organicRoutePath(projectedStops),
      tiberPath: getLandingTierTiberPath({
        width: MAP_W,
        height: MAP_H,
        padding: 48,
        bounds,
      }),
      landmarks: marked,
      faintRoads: roads,
      youAreHere: you,
    }
  }, [allStops, bounds, highlights])

  useEffect(() => {
    if (!animate) {
      setDrawn(true)
      setVisibleStops(landmarks.length)
      return undefined
    }

    const node = rootRef.current
    if (!node || typeof IntersectionObserver !== 'function') {
      setDrawn(true)
      setVisibleStops(landmarks.length)
      return undefined
    }

    let timers = []
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!(entry?.isIntersecting && entry.intersectionRatio > 0.28)) return
        io.disconnect()

        if (reducedMotion) {
          setDrawn(true)
          setVisibleStops(landmarks.length)
          return
        }

        const path = routeRef.current
        if (path) {
          const length = path.getTotalLength()
          path.style.strokeDasharray = `${length}`
          path.style.strokeDashoffset = `${length}`
          void path.getBoundingClientRect()
          path.style.transition = 'stroke-dashoffset 3.2s cubic-bezier(0.33, 0.1, 0.2, 1)'
          path.style.strokeDashoffset = '0'
        }
        setDrawn(true)

        const perStop = 3200 / Math.max(landmarks.length, 1)
        landmarks.forEach((_, i) => {
          timers.push(
            window.setTimeout(() => {
              setVisibleStops(i + 1)
              setActiveStop(i)
            }, 480 + i * perStop),
          )
        })
      },
      { threshold: [0, 0.28, 0.45] },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [animate, landmarks, reducedMotion])

  return (
    <figure
      ref={rootRef}
      className={`cw-rb-rome-day__atlas${drawn ? ' is-drawn' : ''}${className ? ` ${className}` : ''}`}
      aria-label="Illustrated ChronoWalk route across Rome"
    >
      <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--rb-day)" />
            <stop offset="48%" stopColor="var(--rb-sheet)" />
            <stop offset="100%" stopColor="var(--rb-stone)" />
          </linearGradient>
          <linearGradient id={`${uid}-route`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="55%" stopColor="#b08d2e" />
            <stop offset="100%" stopColor="#c97f1e" />
          </linearGradient>
          <linearGradient id={`${uid}-river`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4e7d9b" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#4e7d9b" stopOpacity="0.14" />
          </linearGradient>
          <filter id={`${uid}-route-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uid}-pin`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.4" stdDeviation="1.5" floodColor="#211c15" floodOpacity="0.28" />
          </filter>
          <pattern id={`${uid}-grain`} width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="11" r="0.55" fill="#211c15" opacity="0.04" />
            <circle cx="24" cy="20" r="0.45" fill="#211c15" opacity="0.032" />
            <circle cx="42" cy="8" r="0.5" fill="#211c15" opacity="0.03" />
            <circle cx="16" cy="38" r="0.4" fill="#211c15" opacity="0.035" />
            <circle cx="36" cy="44" r="0.48" fill="#211c15" opacity="0.028" />
            <circle cx="48" cy="28" r="0.35" fill="#211c15" opacity="0.03" />
          </pattern>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill={`url(#${uid}-paper)`} />
        <rect width={MAP_W} height={MAP_H} fill={`url(#${uid}-grain)`} />

        {/* Soft parks / terrain */}
        <ellipse cx="298" cy="132" rx="86" ry="58" fill="#6b7a52" opacity="0.09" />
        <ellipse cx="108" cy="228" rx="74" ry="52" fill="#b9af9c" opacity="0.14" />
        <ellipse cx="236" cy="392" rx="98" ry="64" fill="#6b7a52" opacity="0.07" />
        <ellipse cx="86" cy="456" rx="70" ry="50" fill="#b9af9c" opacity="0.11" />
        <ellipse cx="340" cy="470" rx="64" ry="42" fill="#6b7a52" opacity="0.1" />

        {/* Tiber */}
        <path
          d={tiberPath}
          fill="none"
          stroke={`url(#${uid}-river)`}
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={tiberPath}
          fill="none"
          stroke="#4e7d9b"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
        />

        {/* Faint streets */}
        {faintRoads.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke="#211c15"
            strokeWidth="1.05"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.06"
          />
        ))}

        {/* Route glow underlay */}
        <path
          d={routePath}
          fill="none"
          stroke="#d4af37"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={drawn ? 0.22 : 0}
          className="cw-rb-rome-day__route-glow"
        />

        {/* Hero route */}
        <path
          ref={routeRef}
          d={routePath}
          fill="none"
          stroke={`url(#${uid}-route)`}
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${uid}-route-glow)`}
          className="cw-rb-rome-day__route"
          opacity={reducedMotion ? 0.95 : drawn ? 0.95 : 0.15}
        />

        {/* Quiet secondary dots */}
        {projected.map((stop) =>
          highlights.includes(stop.id) ? null : (
            <circle key={stop.id} cx={stop.x} cy={stop.y} r="1.8" fill="#b9af9c" opacity="0.4" />
          ),
        )}

        {/* Region chapter labels — integrated cartography */}
        {REGION_LABELS.map((region) => (
          <text
            key={region.id}
            x={region.x}
            y={region.y}
            textAnchor="middle"
            fill="#211c15"
            fontSize="9"
            fontFamily="DM Sans, system-ui, sans-serif"
            fontWeight="650"
            letterSpacing="0.18em"
            opacity="0.38"
            transform={`rotate(${region.rotate} ${region.x} ${region.y})`}
            className="cw-rb-rome-day__region"
          >
            {region.label.toUpperCase()}
          </text>
        ))}

        {/* Landmarks + collectible stops */}
        {landmarks.map((stop, index) => {
          const nudge = LABEL_NUDGE[stop.id] ?? { dx: 12, dy: 4, anchor: 'start' }
          const glyph = glyphForStop(stop.id)
          const revealed = index < visibleStops
          const selected = index === activeStop && revealed
          const glyphX =
            stop.x + (nudge.anchor === 'end' ? -20 : nudge.anchor === 'middle' ? 0 : 20)
          const glyphY = stop.y - 24

          return (
            <g
              key={stop.id}
              className={`cw-rb-rome-day__stop${revealed ? ' is-visible' : ''}${selected ? ' is-selected' : ''}`}
              opacity={revealed ? 1 : 0}
              style={{ transformOrigin: `${stop.x}px ${stop.y}px` }}
              onMouseEnter={() => setActiveStop(index)}
              onFocus={() => setActiveStop(index)}
            >
              <g
                transform={`translate(${glyphX} ${glyphY})`}
                className="cw-rb-rome-day__glyph"
                color="#8b8638"
                opacity="0.78"
              >
                <MonumentGlyph kind={glyph} />
              </g>
              <circle
                cx={stop.x}
                cy={stop.y}
                r={selected ? 13.5 : 11.5}
                fill="#faf6ef"
                stroke="#d4af37"
                strokeWidth="1.6"
                filter={`url(#${uid}-pin)`}
                className="cw-rb-rome-day__pin-ring"
              />
              <circle cx={stop.x} cy={stop.y} r={selected ? 9.4 : 8.4} fill="#211c15" />
              <text
                x={stop.x}
                y={stop.y + 3.6}
                textAnchor="middle"
                fill="#faf6ef"
                fontSize="8.8"
                fontFamily="DM Sans, system-ui, sans-serif"
                fontWeight="700"
              >
                {index + 1}
              </text>
              <text
                x={stop.x + nudge.dx}
                y={stop.y + nudge.dy}
                textAnchor={nudge.anchor}
                fill="#211c15"
                fontSize="11.5"
                fontFamily="Fraunces, Georgia, serif"
                fontWeight="500"
              >
                {stop.short}
              </text>
            </g>
          )
        })}

        {/* Live GPS pulse */}
        <g className="cw-rb-rome-day__you" transform={`translate(${youAreHere.x} ${youAreHere.y})`}>
          <circle className="cw-rb-rome-day__you-ring" r="14" fill="none" stroke="#e4552e" strokeWidth="1.2" />
          <circle r="5.5" fill="#e4552e" stroke="#faf6ef" strokeWidth="2" />
        </g>

        {/* Cartouche */}
        <g transform="translate(32 40)">
          <text
            x="0"
            y="0"
            fill="#211c15"
            fontSize="9"
            letterSpacing="0.24em"
            fontFamily="DM Sans, system-ui, sans-serif"
            fontWeight="650"
            opacity="0.5"
          >
            ROME
          </text>
          <text
            x="0"
            y="18"
            fill="#211c15"
            fontSize="14"
            fontFamily="Fraunces, Georgia, serif"
            fontWeight="500"
          >
            One continuous walk
          </text>
        </g>

        {/* Compass */}
        <g transform="translate(378 48)" opacity="0.5">
          <circle cx="0" cy="0" r="12" fill="none" stroke="#211c15" strokeWidth="0.85" />
          <path d="M0 -7.5 L2.4 1.6 L0 0.2 L-2.4 1.6 Z" fill="#d4af37" />
          <text
            x="0"
            y="20"
            textAnchor="middle"
            fill="#211c15"
            fontSize="7.5"
            fontFamily="DM Sans, system-ui, sans-serif"
            letterSpacing="0.14em"
          >
            N
          </text>
        </g>
      </svg>
    </figure>
  )
}
