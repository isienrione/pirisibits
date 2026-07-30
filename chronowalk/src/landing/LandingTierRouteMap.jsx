import { buildSmoothRouteD } from './landingRomeMapPaths.js'
import { getLandingTierBasemapPath } from './landingMapboxStatic.js'
import { getLandingTierMapBounds, getLandingTierRouteStops, projectRouteStops } from './landingTierRoutes.js'

function PinIcon({ featured = false }) {
  return (
    <svg
      className={`cw-v2-pricing__pin${featured ? ' cw-v2-pricing__pin--featured' : ''}`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M10 2.25c-2.9 0-5.25 2.2-5.25 5.05 0 3.55 5.25 10.7 5.25 10.7s5.25-7.15 5.25-10.7C15.25 4.45 12.9 2.25 10 2.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7.2" r="1.65" fill="currentColor" />
    </svg>
  )
}

function StopTooltip({ label }) {
  const width = Math.max(16, label.length * 2.05 + 4)

  return (
    <g className="cw-v2-tier-map__tooltip-wrap" transform="translate(3.8, -6.2)">
      <rect
        x="0"
        y="-4.8"
        width={width}
        height="5.8"
        rx="1.4"
        ry="1.4"
        className="cw-v2-tier-map__tooltip-bg"
      />
      <text x="2" y="-0.8" className="cw-v2-tier-map__tooltip">
        {label}
      </text>
    </g>
  )
}

function MapMarker({ point, index, showTooltip }) {
  return (
    <g className="cw-v2-tier-map__pin-group" transform={`translate(${point.x}, ${point.y})`}>
      <title>{point.title}</title>
      <circle cx="0" cy="0" r="3.35" className="cw-v2-tier-map__stop-ring" />
      <circle cx="0" cy="0" r="2.55" className="cw-v2-tier-map__stop-fill" />
      <text y="0.95" textAnchor="middle" className="cw-v2-tier-map__stop-number">
        {index + 1}
      </text>
      {showTooltip ? <StopTooltip label={point.short} /> : null}
    </g>
  )
}

/**
 * Sepia aerial Rome map with numbered stop markers and walking route - journey UI style.
 */
export default function LandingTierRouteMap({ tierId, featured = false, className = '' }) {
  const stops = getLandingTierRouteStops(tierId)
  const bounds = getLandingTierMapBounds(tierId)
  const points = projectRouteStops(stops, {
    width: 100,
    height: 80,
    padding: 7,
    bounds,
  })
  const routePath = buildSmoothRouteD(points)
  const showTooltips = points.length <= 9

  if (!points.length) return null

  return (
    <figure
      className={`cw-v2-tier-map${featured ? ' cw-v2-tier-map--featured' : ''} ${className}`.trim()}
      aria-label={`Route map with ${points.length} included stops`}
    >
      <div className="cw-v2-tier-map__frame">
        <img
          src={getLandingTierBasemapPath(tierId)}
          alt=""
          className="cw-v2-tier-map__photo"
          loading="lazy"
          decoding="async"
        />
        <div className="cw-v2-tier-map__tone" aria-hidden />
        <div className="cw-v2-tier-map__glow" aria-hidden />

        <svg
          viewBox="0 0 100 80"
          className="cw-v2-tier-map__overlay"
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-hidden
        >
          {routePath ? (
            <>
              <path d={routePath} className="cw-v2-tier-map__path-halo" fill="none" />
              <path d={routePath} className="cw-v2-tier-map__path" fill="none" />
            </>
          ) : null}

          {points.map((point, index) => (
            <MapMarker
              key={point.id}
              point={point}
              index={index}
              showTooltip={showTooltips}
            />
          ))}
        </svg>
      </div>

      <figcaption className="cw-v2-tier-map__caption">
        {showTooltips
          ? `${points.length} stops · ${points.map((p) => p.short).join(' → ')}`
          : `${points.length} numbered stops across ancient Rome, centro storico, and the outer loop`}
      </figcaption>
    </figure>
  )
}

export { PinIcon }
