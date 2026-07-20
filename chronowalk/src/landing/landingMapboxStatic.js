import { getLandingTierMapBounds, ROME_LANDING_MAP_BOUNDS } from './landingTierRoutes.js'

/** Committed static basemaps for pricing cards (scripts/fetch-rome-landing-basemap.mjs). */
export const ROME_LANDING_BASEMAP_BY_TIER = {
  'rome-central': '/landing/rome-pricing-basemap-central.jpg',
  'rome-essential': '/landing/rome-pricing-basemap-ancient.jpg',
  'rome-complete': '/landing/rome-pricing-basemap-complete.jpg',
}

/** @deprecated Use ROME_LANDING_BASEMAP_BY_TIER */
export const ROME_LANDING_BASEMAP_PATH = ROME_LANDING_BASEMAP_BY_TIER['rome-complete']

export function getLandingTierBasemapPath(tierId) {
  return ROME_LANDING_BASEMAP_BY_TIER[tierId] ?? ROME_LANDING_BASEMAP_BY_TIER['rome-complete']
}

export function getLandingTierBasemapAsset(tierId) {
  const fallback = getLandingTierBasemapPath(tierId)
  return {
    webp: fallback.replace(/\.jpg$/, '.webp'),
    fallback,
  }
}

export function buildRomeLandingBasemapUrl(
  token,
  bounds = ROME_LANDING_MAP_BOUNDS,
  style = 'mapbox/satellite-streets-v12'
) {
  if (!token) return null
  const { minLng, minLat, maxLng, maxLat } = bounds
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`
  return (
    `https://api.mapbox.com/styles/v1/${style}/static/` +
    `${bbox}/1280x1024@2x?access_token=${encodeURIComponent(token)}&attribution=false&logo=false`
  )
}

export function buildTierLandingBasemapUrl(tierId, token) {
  return buildRomeLandingBasemapUrl(token, getLandingTierMapBounds(tierId))
}
