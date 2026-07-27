import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion.js'
import { buildSmoothRouteD } from '../landingRomeMapPaths.js'
import { getLandingTierBasemapPath } from '../landingMapboxStatic.js'
import {
  getLandingTierMapBounds,
  getLandingTierRouteStops,
  projectRouteStops,
} from '../landingTierRoutes.js'

const MAP_W = 100
const MAP_H = 124

const FEATURED_LABELS = new Set([
  'colosseum',
  'pantheon',
  'fontana-di-trevi',
  'spanish-steps',
  'piazza-navona',
  'castel-sant-angelo',
  'appian-way',
  'forum-arch-titus',
])

/**
 * Geographically accurate ChronoWalk route on the real Rome basemap.
 * Product photography of the tour — not an invented illustration.
 */
export default function RomeDayAtlas({
  tierId = 'rome-complete',
  className = '',
  animate = true,
}) {
  const uid = useId().replace(/:/g, '')
  const rootRef = useRef(null)
  const routeRef = useRef(null)
  const reducedMotion = useReducedMotion()
  const [drawn, setDrawn] = useState(!animate)

  const { points, routePath, basemap } = useMemo(() => {
    const stops = getLandingTierRouteStops(tierId)
    const bounds = getLandingTierMapBounds(tierId)
    const projected = projectRouteStops(stops, {
      width: MAP_W,
      height: MAP_H,
      padding: 6,
      bounds,
    })
    return {
      points: projected,
      routePath: buildSmoothRouteD(projected),
      basemap: getLandingTierBasemapPath(tierId),
    }
  }, [tierId])

  useEffect(() => {
    if (!animate || !routePath) {
      setDrawn(true)
      return undefined
    }

    const node = rootRef.current
    if (!node || typeof IntersectionObserver !== 'function') {
      setDrawn(true)
      return undefined
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!(entry?.isIntersecting && entry.intersectionRatio > 0.28)) return
        io.disconnect()

        if (reducedMotion) {
          setDrawn(true)
          return
        }

        const path = routeRef.current
        if (path) {
          const length = path.getTotalLength()
          path.style.strokeDasharray = `${length}`
          path.style.strokeDashoffset = `${length}`
          void path.getBoundingClientRect()
          path.style.transition = 'stroke-dashoffset 3.4s cubic-bezier(0.33, 0.1, 0.2, 1)'
          path.style.strokeDashoffset = '0'
        }
        setDrawn(true)
      },
      { threshold: [0, 0.28, 0.45] },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [animate, reducedMotion, routePath])

  if (!points.length) return null

  return (
    <figure
      ref={rootRef}
      className={`cw-rb-rome-day__atlas${drawn ? ' is-drawn' : ''}${className ? ` ${className}` : ''}`}
      aria-label={`ChronoWalk route across Rome — ${points.length} stops`}
    >
      <div className="cw-rb-rome-day__atlas-frame">
        <img
          className="cw-rb-rome-day__atlas-photo"
          src={basemap}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="cw-rb-rome-day__atlas-tone" aria-hidden />

        <svg
          className="cw-rb-rome-day__atlas-overlay"
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0.35" stdDeviation="0.45" floodColor="#0b0b0d" floodOpacity="0.35" />
            </filter>
          </defs>

          {routePath ? (
            <>
              <path
                d={routePath}
                className="cw-rb-rome-day__atlas-path-halo"
                fill="none"
                opacity={drawn ? 1 : 0.2}
              />
              <path
                ref={routeRef}
                d={routePath}
                className="cw-rb-rome-day__atlas-path"
                fill="none"
                filter={`url(#${uid}-soft)`}
                opacity={reducedMotion || drawn ? 1 : 0.2}
              />
            </>
          ) : null}

          {points.map((point, index) => {
            const featured = FEATURED_LABELS.has(point.id)
            return (
              <g key={point.id} transform={`translate(${point.x} ${point.y})`}>
                <circle className="cw-rb-rome-day__atlas-pin-ring" r="2.15" />
                <circle className="cw-rb-rome-day__atlas-pin-fill" r="1.55" />
                <text className="cw-rb-rome-day__atlas-pin-num" textAnchor="middle" y="0.55">
                  {index + 1}
                </text>
                {featured ? (
                  <text
                    className="cw-rb-rome-day__atlas-label"
                    x={index % 2 === 0 ? 2.6 : -2.6}
                    y={-2.2}
                    textAnchor={index % 2 === 0 ? 'start' : 'end'}
                  >
                    {point.short}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      <figcaption className="cw-rb-rome-day__atlas-caption">
        {points.length} stops · Colosseum → centro → Appian Way
      </figcaption>
    </figure>
  )
}
