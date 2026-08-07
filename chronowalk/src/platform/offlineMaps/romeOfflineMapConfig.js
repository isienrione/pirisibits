/**
 * Centralized Rome offline map region configuration (JS mirror of native).
 * Tune bounds / zoom here and keep OfflineMapRegionConfig.swift in sync.
 * Do not silently expand the area at call sites.
 */

export const ROME_OFFLINE_MAP_CITY_ID = 'rome'

/** Prefixed TileStore region id used by the native manager. */
export const ROME_TILE_REGION_ID = 'chronowalk-rome'

/** Mapbox Standard — matches ChronoWalk offline / preferOfflineStyle identity. */
export const DEFAULT_NATIVE_OFFLINE_STYLE_URI = 'mapbox://styles/mapbox/standard'

export const ROME_OFFLINE_MAP_BOUNDS = Object.freeze({
  west: 12.44,
  south: 41.86,
  east: 12.53,
  north: 41.93,
})

/** Conservative walking zoom range for Phase 1. */
export const ROME_OFFLINE_MAP_ZOOM = Object.freeze({
  minZoom: 11,
  maxZoom: 16,
})

export const ROME_OFFLINE_MAP_CONFIG = Object.freeze({
  cityId: ROME_OFFLINE_MAP_CITY_ID,
  tileRegionId: ROME_TILE_REGION_ID,
  styleURI: DEFAULT_NATIVE_OFFLINE_STYLE_URI,
  bounds: ROME_OFFLINE_MAP_BOUNDS,
  ...ROME_OFFLINE_MAP_ZOOM,
  /** Initial camera zoom for the native offline test map. */
  initialZoom: 13.5,
  center: Object.freeze({
    latitude: Number(
      ((ROME_OFFLINE_MAP_BOUNDS.south + ROME_OFFLINE_MAP_BOUNDS.north) / 2).toFixed(5),
    ),
    longitude: Number(
      ((ROME_OFFLINE_MAP_BOUNDS.west + ROME_OFFLINE_MAP_BOUNDS.east) / 2).toFixed(5),
    ),
  }),
})

/**
 * @param {string} cityId
 * @returns {typeof ROME_OFFLINE_MAP_CONFIG | null}
 */
export function getOfflineMapConfig(cityId) {
  if (typeof cityId !== 'string') return null
  const normalized = cityId.trim().toLowerCase()
  if (normalized === ROME_OFFLINE_MAP_CITY_ID) return ROME_OFFLINE_MAP_CONFIG
  return null
}
