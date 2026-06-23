/**
 * Centralized environment configuration.
 * Set these in chronowalk/.env locally and in Netlify → Site settings → Environment variables.
 */
export const env = {
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN,
  debugGeo: String(import.meta.env.VITE_DEBUG_GEO ?? '').trim() === 'true',
  /** Future: REST/GraphQL API for waypoint + tour data */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  /** Future: Cloudflare R2 / CDN base for images, audio, depth maps */
  cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL || '',
}

export const isMapboxConfigured = () => Boolean(env.mapboxToken)
