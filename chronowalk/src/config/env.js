import {
  readDevGeofencesMode,
} from '../content/devGeofenceTools.js'

/** Bumped to invalidate Cloudflare edge cache after SPA-HTML poison under /assets/*. */
export const DEPLOY_EDGE_BUST = 'reset-shell-always-wait-2026-07-30'

const parseBooleanEnv = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

/** Production builds must never honor simulation / debug-geo placement inputs. */
const isProductionRuntime = () => Boolean(import.meta.env.PROD)

const DEBUG_GEO_PARAM_KEYS = ['debugGeo', 'geo_debug']

function normalizePlacementToken(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!normalized) return null
  if (['walking', 'transit'].includes(normalized)) return 'walking'
  if (['approach', 'approaching', 'near'].includes(normalized)) return 'approaching'
  if (['arrived', 'inside'].includes(normalized)) return 'arrived'
  return null
}

/** Raw debug-geo URL/build value (true, walking, approaching, etc.). */
export const getDebugGeoParam = () => {
  // Fail closed in production - query and Vite env must not fake GPS placement.
  if (isProductionRuntime()) return null

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

/**
 * Dev-only Rome GPS simulation for QA outside the city.
 * Active via `?simulate=rome` / `?simulate=rome-track` or `VITE_SIMULATE_LOCATION=rome`.
 * Always a no-op in production builds so live travelers never get a fake position.
 */
export const getSimulateLocationParam = () => {
  if (isProductionRuntime()) return null

  if (typeof window !== 'undefined') {
    const param = new URLSearchParams(window.location.search).get('simulate')
    if (param !== null) return String(param).trim().toLowerCase()
  }

  const fromEnv =
    import.meta.env.VITE_SIMULATE_LOCATION || import.meta.env.VITE_SIMULATE_ROME
  if (fromEnv) return String(fromEnv).trim().toLowerCase()
  return null
}

/** True when Rome location simulation is active (dev/preview only). */
export const isSimulateRome = () => {
  const value = getSimulateLocationParam()
  if (!value) return false
  return value === 'rome' || value === 'rome-track' || value === 'true' || value === '1'
}

/** Prefer a short animated track along Via dei Fori Imperiali when requested. */
export const isSimulateRomeTrack = () => getSimulateLocationParam() === 'rome-track'

/** Runtime debug geo: URL param (?debugGeo or ?geo_debug) overrides build-time env. */
export const isDebugGeo = () => {
  if (isSimulateRome()) return true

  const param = getDebugGeoParam()
  if (param === null) return false
  const normalized = String(param).trim().toLowerCase()
  if (['walking', 'transit', 'approach', 'approaching', 'near'].includes(normalized)) {
    return true
  }
  return parseBooleanEnv(param)
}

/**
 * Simulated GPS placement while debug geo is active (dev/preview only).
 * - arrived (default): inside geofence - triggers arrival cards
 * - approaching: just outside geofence
 * - walking: farther away - walking / map UI
 * - rome: fixed Colosseum-approach origin (from ?simulate=rome)
 *
 * Sources (non-production only): URL debugGeo value, then
 * `VITE_DEBUG_GEO_PLACEMENT`, then default `arrived`.
 */
export const getDebugGeoPlacement = () => {
  if (isProductionRuntime()) return null
  if (!isDebugGeo()) return null
  if (isSimulateRome()) return 'rome'

  const fromParam = normalizePlacementToken(getDebugGeoParam())
  if (fromParam) return fromParam

  const fromEnv = normalizePlacementToken(import.meta.env.VITE_DEBUG_GEO_PLACEMENT)
  if (fromEnv) return fromEnv

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
 * `?waypoint=` is reserved for Asset Studio only - it does not affect tour mode.
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
    const param = new URLSearchParams(window.location.search).get('devGeofences')
    if (param === 'off' || param === '0' || param === 'false') return null
    if (param) return String(param).trim().toLowerCase()
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
 * Enabled via ?debugMap=true, ?debug=true, VITE_DEBUG_MAP / VITE_DEBUG,
 * or while debug geo / Santiago remaps are active.
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

  return (
    parseBooleanEnv(import.meta.env.VITE_DEBUG_MAP) ||
    parseBooleanEnv(import.meta.env.VITE_DEBUG)
  )
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
  /** Full-screen MAP tab style. Defaults to Mapbox Standard (night config applied in TourMap). */
  mapboxStyleUrl:
    import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/standard',
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
