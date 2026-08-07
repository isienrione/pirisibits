/**
 * JS definitions for ChronoWalkOfflineMaps Capacitor plugin.
 * Native implementation lives under ios/Sources — web is unsupported.
 */

export const OFFLINE_MAP_STATUSES = Object.freeze([
  'not_downloaded',
  'downloading',
  'downloaded',
  'failed',
])

export const OFFLINE_MAP_ERROR_CODES = Object.freeze([
  'network_unavailable',
  'disk_full',
  'tile_limit_exceeded',
  'mapbox_not_configured',
  'download_failed',
  'unsupported_city',
  'already_downloading',
  'unsupported_platform',
])

/** Transit map methods are iOS-native only (see ChronoWalkOfflineMapsPlugin). */
export const TRANSIT_MAP_METHODS = Object.freeze([
  'openTransitMap',
  'updateTransitMap',
  'closeTransitMap',
  'recenterTransitMap',
  'setTransitMapVisible',
])
