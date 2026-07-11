import { useMemo } from 'react'
import { buildTourRoadmap } from '../../content/tourRoadmap.js'
import { getWaypoint } from '../../content/manifest.js'
import { ACT_COLORS, T, F } from '../tokens.js'
import { titleForWaypoint } from '../lib/waypointPresentation.js'
import {
  actColorForNumeral,
  buildIllustratedRouteLayout,
  shortStopLabel,
} from '../lib/tourRouteIllustration.js'

/**
 * Stylized, map-inspired route drawing — sequential stops on a winding path,
 * not tied to real-world coordinates (avoids cluttered Mapbox labels).
 */
export default function TourRouteIllustration({ manifest, context, className = '' }) {
  const stops = useMemo(() => {
    if (!manifest) return []
    return buildTourRoadmap(manifest, {
      path: context?.path ?? 'a',
      sequenceIndex: 0,
      completedWaypointIds: [],
    }).map((stop) => {
      const waypoint = getWaypoint(manifest, stop.id)
      return {
        id: stop.id,
        title: titleForWaypoint(waypoint),
        actNumeral: stop.actNumeral,
        actTitle: stop.actTitle,
      }
    })
  }, [manifest, context?.path])

  const layout = useMemo(() => buildIllustratedRouteLayout(stops), [stops])

  if (!stops.length) {
    return (
      <div className={`cw-route-illustration cw-route-illustration--empty${className ? ` ${className}` : ''}`}>
        <p style={{ color: T.muted, fontSize: 13 }}>Route loading…</p>
      </div>
    )
  }

  return (
    <div
      className={`cw-route-illustration${className ? ` ${className}` : ''}`}
      data-testid="tour-route-illustration"
      aria-label={`Tour route with ${stops.length} stops in order`}
    >
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="cw-route-illustration__svg"
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cw-route-paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F3EBDD" />
            <stop offset="100%" stopColor="#E8DFCF" />
          </linearGradient>
          <filter id="cw-route-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#1A1A1F" floodOpacity="0.12" />
          </filter>
        </defs>

        <rect
          x="8"
          y="8"
          width={layout.width - 16}
          height={layout.height - 16}
          rx="18"
          fill="url(#cw-route-paper)"
          stroke={`${T.muted}55`}
          strokeWidth="1.2"
        />

        {/* Decorative compass */}
        <g opacity="0.35" transform={`translate(${layout.width - 52}, 28)`}>
          <circle r="14" fill="none" stroke={T.muted} strokeWidth="1" />
          <path d="M 0 -10 L 0 10 M -10 0 L 10 0" stroke={T.muted} strokeWidth="1" />
          <text y="26" textAnchor="middle" fill={T.muted} fontSize="8" fontFamily={F.body}>
            N
          </text>
        </g>

        {/* Winding route */}
        <path
          d={layout.pathD}
          fill="none"
          stroke={T.terracotta}
          strokeWidth="2.5"
          strokeDasharray="7 6"
          strokeLinecap="round"
          opacity="0.72"
        />

        {layout.points.map((point) => {
          const isFirst = point.index === 0
          const actColor = actColorForNumeral(point.actNumeral, ACT_COLORS)
          const showActLabel =
            point.actNumeral &&
            (point.index === 0 || layout.points[point.index - 1]?.actNumeral !== point.actNumeral)

          return (
            <g key={point.id} filter="url(#cw-route-soft-shadow)">
              {showActLabel ? (
                <text
                  x={layout.width / 2}
                  y={point.y - 18}
                  textAnchor="middle"
                  fill={actColor}
                  fontSize="9"
                  letterSpacing="0.14em"
                  fontFamily={F.body}
                  fontWeight="600"
                >
                  {`ACT ${point.actNumeral}`}
                </text>
              ) : null}

              <circle
                cx={point.x}
                cy={point.y}
                r={isFirst ? 11 : 9}
                fill={isFirst ? T.terracotta : T.bone}
                stroke={isFirst ? T.terracotta : actColor}
                strokeWidth={isFirst ? 0 : 2}
              />

              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                fill={isFirst ? T.bone : T.ink}
                fontSize={isFirst ? 10 : 9}
                fontWeight="700"
                fontFamily={F.body}
              >
                {point.index + 1}
              </text>

              <text
                x={point.labelX}
                y={point.y + 4}
                textAnchor={point.labelAnchor}
                fill={isFirst ? T.ink : `${T.ink}CC`}
                fontSize="11"
                fontWeight={isFirst ? 600 : 500}
                fontFamily={F.body}
              >
                {shortStopLabel(point.title)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
