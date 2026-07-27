import { useMemo } from 'react'
import {
  buildRoutePathD,
  getLandingTierMapBounds,
  getLandingTierRouteStops,
  getLandingTierTiberPath,
  projectRouteStops,
} from '../landingTierRoutes.js'
import { REBUILD_ROME_DAY } from '../rebuildCopy.js'

const MAP_W = 320
const MAP_H = 420

/**
 * Section 4 — One day in Rome. Editorial map, not Mapbox.
 */
export default function RebuildRomeDay() {
  const copy = REBUILD_ROME_DAY
  const bounds = getLandingTierMapBounds('rome-complete')
  const allStops = getLandingTierRouteStops('rome-complete')

  const { projected, routePath, tiberPath, highlights } = useMemo(() => {
    const projectedStops = projectRouteStops(allStops, {
      width: MAP_W,
      height: MAP_H,
      padding: 28,
      bounds,
    })
    const highlightSet = new Set(copy.highlights)
    const marked = projectedStops.filter((stop) => highlightSet.has(stop.id))
    return {
      projected: projectedStops,
      routePath: buildRoutePathD(projectedStops),
      tiberPath: getLandingTierTiberPath({
        width: MAP_W,
        height: MAP_H,
        padding: 28,
        bounds,
      }),
      highlights: marked,
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
        <h2 id="rome-day-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        <p className="cw-rb-lead">{copy.body}</p>

        <figure className="cw-rb-rome-day__map" aria-label="Editorial map of the ChronoWalk Rome route">
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} role="img" aria-hidden="true">
            <defs>
              <linearGradient id="rb-rome-route" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c45a3a" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
            <rect width={MAP_W} height={MAP_H} rx="28" fill="#efe8dc" />
            <path d={tiberPath} fill="none" stroke="#c5d5e0" strokeWidth="10" strokeLinecap="round" />
            <path
              d={routePath}
              fill="none"
              stroke="url(#rb-rome-route)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            {projected.map((stop) => (
              <circle key={stop.id} cx={stop.x} cy={stop.y} r="2.2" fill="#b9af9c" opacity="0.55" />
            ))}
            {highlights.map((stop, index) => (
              <g key={stop.id}>
                <circle cx={stop.x} cy={stop.y} r="9" fill="#211c15" />
                <text
                  x={stop.x}
                  y={stop.y + 3.2}
                  textAnchor="middle"
                  fill="#f3eee5"
                  fontSize="8"
                  fontFamily="DM Sans, system-ui, sans-serif"
                  fontWeight="700"
                >
                  {index + 1}
                </text>
                <text
                  x={stop.x}
                  y={stop.y + 20}
                  textAnchor="middle"
                  fill="#211c15"
                  fontSize="8.5"
                  fontFamily="Fraunces, Georgia, serif"
                >
                  {stop.short}
                </text>
              </g>
            ))}
          </svg>
        </figure>

        <ol className="cw-rb-rome-day__flow" aria-label="A flexible day">
          {copy.scenarios.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <ul className="cw-rb-rome-day__signals" aria-hidden="true">
          <li className="is-gps">GPS</li>
          <li className="is-offline">Offline</li>
          <li className="is-saved">Saved</li>
          <li className="is-audio">Audio</li>
        </ul>
      </div>
    </section>
  )
}
