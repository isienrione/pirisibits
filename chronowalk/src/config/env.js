const parseBooleanEnv = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

/** Runtime debug geo: URL param overrides build-time env (handy on Netlify). */
export const isDebugGeo = () => {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('debugGeo')
    if (param !== null) return parseBooleanEnv(param)
  }

  return parseBooleanEnv(import.meta.env.VITE_DEBUG_GEO)
}

/**
 * Centralized environment configuration.
 * Set these in chronowalk/.env locally and in Netlify → Site settings → Environment variables.
 */
export const env = {
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN,
  get debugGeo() {
    return isDebugGeo()
  },
  /** Future: REST/GraphQL API for waypoint + tour data */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  /** Future: Cloudflare R2 / CDN base for images, audio, depth maps */
  cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL || '',
  /** Supabase project URL and anon key for waypoint data */
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
}

export const isMapboxConfigured = () => Boolean(env.mapboxToken)
