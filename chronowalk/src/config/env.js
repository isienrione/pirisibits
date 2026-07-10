import {
  readDevGeofencesMode,
  syncDevGeofencesModeFromUrl,
} from '../content/devGeofenceTools.js'

const parseBooleanEnv = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

const DEBUG_GEO_PARAM_KEYS = ['debugGeo', 'geo_debug']

/** Raw debug-geo URL/build value (true, walking, approaching, etc.). */
export const getDebugGeoParam = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    for (const key of DEBUG_GEO_PARAM_KEYS) {
      const param = params.get(key)
      if (param !== null) return param
    }
  }

  if (parseBooleanEnv(import.meta.env.VITE_DEBUG_GEO)) return 'true'
  return null
}

/** Runtime debug geo: URL param (?debugGeo or ?geo_debug) overrides build-time env. */
export const isDebugGeo = () => {
  const param = getDebugGeoParam()
  if (param === null) return false
  const normalized = String(param).trim().toLowerCase()
  if (['walking', 'transit', 'approach', 'approaching', 'near'].includes(normalized)) {
    return true
  }
  return parseBooleanEnv(param)
}

/**
 * Simulated GPS placement while debug geo is active.
 * - arrived (default): inside geofence — triggers arrival cards
 * - approaching: just outside geofence
 * - walking: farther away — walking / map UI
 */
export const getDebugGeoPlacement = () => {
  if (!isDebugGeo()) return null
  const normalized = String(getDebugGeoParam() ?? 'true')
    .trim()
    .toLowerCase()
  if (['walking', 'transit'].includes(normalized)) return 'walking'
  if (['approach', 'approaching', 'near'].includes(normalized)) return 'approaching'
  return 'arrived'
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

/** Tour id from URL (?tour=roman-forum). Omit for catalog landing. */
export const getTourId = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('tour') || null
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
 * Temporary field-test geofences (?devGeofences=santiago or VITE_DEV_GEOFENCES=santiago).
 * Remaps selected Rome waypoint radii to Santiago coordinates for live GPS QA.
 * Persists in sessionStorage so /begin → /journey navigation does not drop the flag.
 */
export const getDevGeofencesMode = () => {
  if (typeof window !== 'undefined') {
    const fromUrl = syncDevGeofencesModeFromUrl()
    if (fromUrl) return fromUrl
    const stored = readDevGeofencesMode()
    if (stored) return stored
  }

  const fromEnv = import.meta.env.VITE_DEV_GEOFENCES
  if (fromEnv) return String(fromEnv).trim().toLowerCase()
  return null
}

export const isDevGeofencesSantiago = () => getDevGeofencesMode() === 'santiago'

/** Unlock every tour without purchase (QA / demos). */
export const isUnlockAllTours = () => {
  if (typeof window === 'undefined') return false
  const param = new URLSearchParams(window.location.search).get('unlockAll')
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

/**
 * Map debug overlays (GPS state, geofence, journey labels).
 * Enabled via ?debugMap=true, ?debug=true, VITE_DEBUG_MAP, or while ?debugGeo=true.
 */
export const isDebugMap = () => {
  if (isDebugGeo()) return true
  if (isDevGeofencesSantiago()) return true

  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const debugMap = params.get('debugMap')
    if (debugMap !== null) return parseBooleanEnv(debugMap)
    const debug = params.get('debug')
    if (debug !== null) return parseBooleanEnv(debug)
  }

  return parseBooleanEnv(import.meta.env.VITE_DEBUG_MAP)
}

/**
 * Journey dev panel for field testing and QA.
 * Enabled in Vite dev, via ?devPanel=true, or VITE_DEV_PANEL=true.
 * Remove entirely after Stage 5 field-test gate (M22).
 */
export const isDevPanelEnabled = () => {
  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('devPanel')
    if (param !== null) return parseBooleanEnv(param)
  }

  if (import.meta.env.DEV) return true

  return parseBooleanEnv(import.meta.env.VITE_DEV_PANEL)
}

/** @deprecated Use getSingleWaypointId or getTourId */
export const getTourWaypointId = () => getSingleWaypointId() || 'colosseum'

/**
 * Centralized environment configuration.
 * Set these in chronowalk/.env locally and in Netlify → Site settings → Environment variables.
 */
export const env = {
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN,
  mapboxStyleUrl:
    import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/light-v11',
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
