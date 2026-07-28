import { useMemo } from 'react'
import { env, isMapboxConfigured } from '../../config/env.js'
import WalkingMapChrome from '../../redesign/ui/WalkingMapChrome.jsx'
import { ROME_LANDING_BASEMAP_BY_TIER } from '../landingMapboxStatic.js'

/** Pantheon plaza — matches the free-preview stop. */
const PANTHEON = { lng: 12.47687, lat: 41.89868 }

const DEFAULT_ROUTE = [
  [12.47635, 41.89935],
  [12.47655, 41.89905],
  [12.47675, 41.89885],
  [PANTHEON.lng, PANTHEON.lat],
]

const FALLBACK_BASEMAP = ROME_LANDING_BASEMAP_BY_TIER['rome-central']

/**
 * Mapbox-looking walking map for the sticky-phone demo.
 * Prefers a Mapbox Static dark-streets image (same family as the app) with a
 * glowing route + user marker overlay. Falls back to the committed basemap.
 */
export default function LandingDemoWalkMap({
  bearing = 28,
  directionsGeometry,
}) {
  const route = directionsGeometry?.coordinates?.length
    ? directionsGeometry.coordinates
    : DEFAULT_ROUTE

  const basemapSrc = useMemo(() => {
    if (!isMapboxConfigured() || !env.mapboxToken) return FALLBACK_BASEMAP
    const pathCoords = route.map(([lng, lat]) => `${lng},${lat}`).join(',')
    const overlay = encodeURIComponent(`path-5+e07a5f-0.95(${pathCoords})`)
    return (
      `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
      `${overlay}/` +
      `${PANTHEON.lng},${PANTHEON.lat},16.2,${bearing},55/` +
      `390x420@2x?access_token=${encodeURIComponent(env.mapboxToken)}` +
      `&attribution=false&logo=false`
    )
  }, [bearing, route])

  return (
    <div className="cw-v4-demo-walk-map" data-testid="landing-demo-walk-map">
      <img
        className="cw-v4-demo-walk-map__basemap"
        src={basemapSrc}
        alt=""
        decoding="async"
        onError={(event) => {
          if (event.currentTarget.getAttribute('src') === FALLBACK_BASEMAP) return
          event.currentTarget.src = FALLBACK_BASEMAP
        }}
      />
      <div className="cw-v4-demo-walk-map__veil" aria-hidden />
      <svg className="cw-v4-demo-walk-map__route" viewBox="0 0 390 420" aria-hidden>
        <defs>
          <filter id="cw-v4-route-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M62 360 C 120 300, 165 250, 205 200 S 285 110, 318 78"
          fill="none"
          stroke="rgba(224,122,95,0.95)"
          strokeWidth="5"
          strokeLinecap="round"
          filter="url(#cw-v4-route-glow)"
        />
        <circle className="cw-v4-demo-walk-map__you-ring" cx="205" cy="200" r="18" />
        <circle className="cw-v4-demo-walk-map__you" cx="205" cy="200" r="7" />
        <circle cx="318" cy="78" r="8" fill="#e07a5f" stroke="#f3eee6" strokeWidth="2.5" />
        <circle cx="318" cy="78" r="16" fill="none" stroke="rgba(224,122,95,0.4)" strokeWidth="2" />
      </svg>
      <WalkingMapChrome bearing={bearing} onRecenter={() => {}} />
    </div>
  )
}
