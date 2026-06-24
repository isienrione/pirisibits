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

/** Creator studio for AI asset prompts (?assetStudio=true). */
export const isAssetStudio = () => {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('assetStudio')
    if (param !== null) return parseBooleanEnv(param)
  }

  return parseBooleanEnv(import.meta.env.VITE_ASSET_STUDIO)
}

export const getAssetStudioWaypointId = () => {
  if (typeof window === 'undefined') return 'colosseum'
  return new URLSearchParams(window.location.search).get('waypoint') || 'colosseum'
}

/** Tour id from URL (?tour=rome-core). Full tour is the default. */
export const getTourId = () => {
  if (typeof window === 'undefined') return 'rome-core'
  const params = new URLSearchParams(window.location.search)
  return params.get('tour') || 'rome-core'
}

/**
 * Single-waypoint debug (?singleWaypoint=pantheon).
 * `?waypoint=` is reserved for Asset Studio only — it does not affect tour mode.
 */
export const getSingleWaypointId = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('singleWaypoint') || null
}

/** Clear saved tour progress when ?resetTour=true */
export const shouldResetTour = () => {
  if (typeof window === 'undefined') return false
  const param = new URLSearchParams(window.location.search).get('resetTour')
  return parseBooleanEnv(param)
}

/**
 * Start the tour focused on a specific stop while keeping the full route visible.
 * Example: ?debugGeo=true&debugStop=pantheon
 */
export const getDebugStopId = () => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('debugStop') || null
}

/** Log resolved slider media URLs on the waypoint card (?debugMedia=true) */
export const isDebugMedia = () => {
  if (typeof window === 'undefined') return false
  const param = new URLSearchParams(window.location.search).get('debugMedia')
  return parseBooleanEnv(param)
}

/** @deprecated Use getSingleWaypointId or getTourId */
export const getTourWaypointId = () => getSingleWaypointId() || 'colosseum'

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
