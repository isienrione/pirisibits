/**
 * Status + error normalization for native offline maps.
 * Shared by the JS bridge and unit tests — mirrors native controlled errors.
 */

export const OFFLINE_MAP_STATUS = Object.freeze({
  NOT_DOWNLOADED: 'not_downloaded',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  FAILED: 'failed',
})

export const OFFLINE_MAP_ERROR = Object.freeze({
  NETWORK_UNAVAILABLE: 'network_unavailable',
  DISK_FULL: 'disk_full',
  TILE_LIMIT_EXCEEDED: 'tile_limit_exceeded',
  MAPBOX_NOT_CONFIGURED: 'mapbox_not_configured',
  DOWNLOAD_FAILED: 'download_failed',
  UNSUPPORTED_CITY: 'unsupported_city',
  ALREADY_DOWNLOADING: 'already_downloading',
  UNSUPPORTED_PLATFORM: 'unsupported_platform',
})

const STATUS_SET = new Set(Object.values(OFFLINE_MAP_STATUS))
const ERROR_SET = new Set(Object.values(OFFLINE_MAP_ERROR))

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeOfflineMapStatus(value) {
  if (typeof value === 'string' && STATUS_SET.has(value)) return value
  return OFFLINE_MAP_STATUS.NOT_DOWNLOADED
}

/**
 * @param {unknown} code
 * @returns {string}
 */
export function normalizeOfflineMapErrorCode(code) {
  if (typeof code === 'string' && ERROR_SET.has(code)) return code

  const raw = typeof code === 'string' ? code : code == null ? '' : String(code)
  const lower = raw.toLowerCase()

  if (
    lower.includes('tile_limit') ||
    lower.includes('tilelimit') ||
    lower.includes('tile count') ||
    lower.includes('tile limit') ||
    lower.includes('tilecountexceeded')
  ) {
    return OFFLINE_MAP_ERROR.TILE_LIMIT_EXCEEDED
  }
  if (lower.includes('disk_full') || lower.includes('diskfull') || lower.includes('enospc')) {
    return OFFLINE_MAP_ERROR.DISK_FULL
  }
  if (
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('timeout') ||
    lower.includes('timed out')
  ) {
    return OFFLINE_MAP_ERROR.NETWORK_UNAVAILABLE
  }
  if (
    lower.includes('mapbox_not_configured') ||
    lower.includes('access token') ||
    lower.includes('mbxaccesstoken')
  ) {
    return OFFLINE_MAP_ERROR.MAPBOX_NOT_CONFIGURED
  }
  if (lower.includes('unsupported_city')) {
    return OFFLINE_MAP_ERROR.UNSUPPORTED_CITY
  }
  if (lower.includes('already_downloading')) {
    return OFFLINE_MAP_ERROR.ALREADY_DOWNLOADING
  }
  if (lower.includes('unsupported_platform')) {
    return OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM
  }

  return OFFLINE_MAP_ERROR.DOWNLOAD_FAILED
}

/**
 * Normalize Mapbox resource-count progress. Does not invent byte estimates.
 * @param {{ completedResourceCount?: unknown, requiredResourceCount?: unknown, progress?: unknown }} raw
 */
export function normalizeDownloadProgress(raw = {}) {
  const completed = toNonNegativeInt(raw.completedResourceCount)
  const required = toNonNegativeInt(raw.requiredResourceCount)

  let progress = null
  if (typeof raw.progress === 'number' && Number.isFinite(raw.progress)) {
    progress = clamp01(raw.progress)
  } else if (completed != null && required != null && required > 0) {
    progress = clamp01(completed / required)
  }

  return {
    progress,
    completedResourceCount: completed,
    requiredResourceCount: required,
  }
}

/**
 * @param {Record<string, unknown>} raw
 * @param {{ cityId?: string, supported?: boolean }} [defaults]
 */
export function normalizeRegionStatus(raw = {}, defaults = {}) {
  const cityId =
    typeof raw.cityId === 'string' && raw.cityId
      ? raw.cityId
      : typeof defaults.cityId === 'string'
        ? defaults.cityId
        : null

  const progressFields = normalizeDownloadProgress(raw)
  const status = normalizeOfflineMapStatus(raw.status)

  /** @type {Record<string, unknown>} */
  const out = {
    cityId,
    supported: defaults.supported ?? Boolean(raw.supported),
    status,
    progress: progressFields.progress,
    completedResourceCount: progressFields.completedResourceCount,
    requiredResourceCount: progressFields.requiredResourceCount,
  }

  if (status === OFFLINE_MAP_STATUS.FAILED || raw.errorCode) {
    out.errorCode = normalizeOfflineMapErrorCode(raw.errorCode ?? OFFLINE_MAP_ERROR.DOWNLOAD_FAILED)
    if (typeof raw.errorMessage === 'string' && raw.errorMessage) {
      out.errorMessage = raw.errorMessage
    }
  }

  return out
}

function toNonNegativeInt(value) {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.floor(n)
}

function clamp01(value) {
  if (!Number.isFinite(value)) return null
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}
