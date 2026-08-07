/**
 * Smallest clean bridge between package download status and native map region.
 * "Ready offline" requires the Rome TileStore region to be downloaded on iOS.
 */

import { isNativeIOS } from '../runtime/platformRuntime.js'
import { getRegionStatus } from './nativeOfflineMaps.js'
import { OFFLINE_MAP_STATUS } from './offlineMapStatus.js'
import { ROME_OFFLINE_MAP_CITY_ID } from './romeOfflineMapConfig.js'

/**
 * @param {string} [cityId]
 * @returns {Promise<boolean>}
 */
export async function isNativeMapRegionDownloaded(cityId = ROME_OFFLINE_MAP_CITY_ID) {
  if (!isNativeIOS()) return false
  try {
    const status = await getRegionStatus({ cityId })
    return status?.status === OFFLINE_MAP_STATUS.DOWNLOADED
  } catch {
    return false
  }
}

/**
 * Merge package download status with native map-region readiness.
 * On web, returns downloadStatus unchanged.
 *
 * @param {{ status?: string } | null | undefined} downloadStatus
 * @param {{ cityId?: string, mapRegionDownloaded?: boolean } | boolean} [mapRegion]
 */
export function mergeOfflineReadyWithMapRegion(downloadStatus, mapRegion = false) {
  if (!downloadStatus || typeof downloadStatus !== 'object') return downloadStatus ?? null

  const downloaded =
    typeof mapRegion === 'boolean'
      ? mapRegion
      : Boolean(mapRegion?.mapRegionDownloaded)

  if (downloadStatus.status !== 'ready') {
    return {
      ...downloadStatus,
      mapRegionReady: downloaded,
    }
  }

  // Do not display Ready offline unless the native map region is downloaded.
  if (!downloaded) {
    return {
      ...downloadStatus,
      status: 'not_downloaded',
      mapRegionReady: false,
      reason: 'map_region_not_downloaded',
    }
  }

  return {
    ...downloadStatus,
    mapRegionReady: true,
  }
}

/**
 * @param {{ status?: string } | null | undefined} downloadStatus
 * @param {{ cityId?: string }} [opts]
 */
export async function resolveOfflineReadyStatus(downloadStatus, opts = {}) {
  if (!isNativeIOS()) {
    return downloadStatus
      ? { ...downloadStatus, mapRegionReady: false }
      : downloadStatus
  }

  const cityId = opts.cityId ?? ROME_OFFLINE_MAP_CITY_ID
  const mapRegionDownloaded = await isNativeMapRegionDownloaded(cityId)
  return mergeOfflineReadyWithMapRegion(downloadStatus, {
    cityId,
    mapRegionDownloaded,
  })
}
