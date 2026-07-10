import { ROME_LANDING_MAP_BOUNDS } from './landingTierRoutes.js'

/** Committed static basemap for pricing cards (generated via scripts/fetch-rome-landing-basemap.mjs). */
export const ROME_LANDING_BASEMAP_PATH = '/landing/rome-pricing-basemap.jpg'

export function buildRomeLandingBasemapUrl(token, style = 'mapbox/satellite-streets-v12') {
  if (!token) return null
  const { minLng, minLat, maxLng, maxLat } = ROME_LANDING_MAP_BOUNDS
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`
  return (
    `https://api.mapbox.com/styles/v1/${style}/static/` +
    `${bbox}/1280x1024@2x?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`
  )
}
