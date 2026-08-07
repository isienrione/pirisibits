/**
 * Native Mapbox Rome region as a component of the production offline package.
 * Web/PWA never enters this path.
 */

import { isNativeIOS } from '../runtime/platformRuntime.js'
import {
  deleteRegion,
  downloadRegion,
  getRegionStatus,
  subscribeOfflineMapProgress,
} from './nativeOfflineMaps.js'
import { OFFLINE_MAP_STATUS } from './offlineMapStatus.js'
import { ROME_OFFLINE_MAP_CITY_ID } from './romeOfflineMapConfig.js'

export const NATIVE_MAP_REGION_PARTIAL_ERROR = 'map_region_partial'

/**
 * @param {string} [cityId]
 * @returns {Promise<boolean>}
 */
export async function isNativePackageMapReady(cityId = ROME_OFFLINE_MAP_CITY_ID) {
  if (!isNativeIOS()) return true
  try {
    const status = await getRegionStatus({ cityId })
    return status?.status === OFFLINE_MAP_STATUS.DOWNLOADED
  } catch {
    return false
  }
}

/**
 * Ensure the Rome TileStore region is present.
 * - If already downloaded, recognizes TileStore and skips redownload.
 * - Otherwise invokes downloadRegion({ cityId: 'rome' }).
 *
 * @param {{
 *   cityId?: string,
 *   onProgress?: (payload: object) => void,
 * }} [opts]
 */
export async function ensureNativeRomeMapRegion(opts = {}) {
  const cityId = opts.cityId ?? ROME_OFFLINE_MAP_CITY_ID
  const onProgress = opts.onProgress

  if (!isNativeIOS()) {
    return {
      invokedDownloadRegion: false,
      alreadyPresent: false,
      downloaded: false,
      skipped: true,
      platform: 'web',
    }
  }

  const existing = await getRegionStatus({ cityId })
  if (existing?.status === OFFLINE_MAP_STATUS.DOWNLOADED) {
    onProgress?.({
      status: OFFLINE_MAP_STATUS.DOWNLOADED,
      progress: 1,
      currentPath: 'native-map-rome',
      alreadyPresent: true,
      completedResourceCount: existing.completedResourceCount,
      requiredResourceCount: existing.requiredResourceCount,
    })
    return {
      invokedDownloadRegion: false,
      alreadyPresent: true,
      downloaded: true,
      skipped: false,
      platform: 'ios',
      status: existing,
    }
  }

  const unsubscribe = subscribeOfflineMapProgress((payload) => {
    onProgress?.({
      ...payload,
      currentPath: 'native-map-rome',
      alreadyPresent: false,
    })
  })

  try {
    onProgress?.({
      status: OFFLINE_MAP_STATUS.DOWNLOADING,
      progress: existing?.progress ?? 0,
      currentPath: 'native-map-rome',
    })

    const result = await downloadRegion({ cityId })

    if (result?.status === OFFLINE_MAP_STATUS.DOWNLOADED) {
      onProgress?.({
        status: OFFLINE_MAP_STATUS.DOWNLOADED,
        progress: 1,
        currentPath: 'native-map-rome',
        completedResourceCount: result.completedResourceCount,
        requiredResourceCount: result.requiredResourceCount,
      })
      return {
        invokedDownloadRegion: true,
        alreadyPresent: false,
        downloaded: true,
        skipped: false,
        platform: 'ios',
        status: result,
      }
    }

    const error = new Error(
      result?.errorMessage || result?.errorCode || 'Native map region download failed',
    )
    error.code = result?.errorCode || NATIVE_MAP_REGION_PARTIAL_ERROR
    error.mapStatus = result
    throw error
  } finally {
    unsubscribe()
  }
}

/**
 * Best-effort delete of the ChronoWalk Rome TileStore region (iOS only).
 */
export async function clearNativeRomeMapRegion(cityId = ROME_OFFLINE_MAP_CITY_ID) {
  if (!isNativeIOS()) {
    return { deleted: false, skipped: true }
  }
  try {
    await deleteRegion({ cityId })
    return { deleted: true, skipped: false }
  } catch {
    return { deleted: false, skipped: false }
  }
}
