/**
 * Smallest clean bridge between package download status and native map region.
 * "Ready offline" requires the Rome TileStore region to be downloaded on iOS
 * and packaged canonical walking legs to be present.
 */

import { isNativeIOS } from '../runtime/platformRuntime.js'
import { getRegionStatus } from './nativeOfflineMaps.js'
import { OFFLINE_MAP_STATUS } from './offlineMapStatus.js'
import { ROME_OFFLINE_MAP_CITY_ID } from './romeOfflineMapConfig.js'
import { areCanonicalRomeWalkingRoutesComplete } from '../../navigation/canonicalWalkingLegs.js'
import {
  NAVIGATION_OFFLINE_READINESS,
  resolveNavigationOfflineReadiness,
} from './navigationOfflineReadiness.js'

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
 * On web, returns downloadStatus unchanged aside from routeLegsReady.
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

  const routeLegsReady = areCanonicalRomeWalkingRoutesComplete()
  const overall = resolveNavigationOfflineReadiness({
    packageStatus: downloadStatus.status,
    mapRegionDownloaded: downloaded,
    routeLegsPrepared: routeLegsReady,
  })

  if (downloadStatus.status !== 'ready') {
    return {
      ...downloadStatus,
      mapRegionReady: downloaded,
      routeLegsReady,
      navigationReadiness: overall.readiness,
    }
  }

  // Do not display Ready offline unless the native map region is downloaded
  // and packaged REAL walking route legs are complete (not straight-line-only).
  if (!downloaded || !routeLegsReady) {
    return {
      ...downloadStatus,
      status: 'not_downloaded',
      mapRegionReady: downloaded,
      routeLegsReady,
      navigationReadiness: overall.readiness,
      reason: !downloaded
        ? 'map_region_not_downloaded'
        : 'route_legs_not_prepared',
    }
  }

  return {
    ...downloadStatus,
    mapRegionReady: true,
    routeLegsReady: true,
    navigationReadiness: NAVIGATION_OFFLINE_READINESS.READY,
  }
}

/**
 * @param {{ status?: string } | null | undefined} downloadStatus
 * @param {{ cityId?: string }} [opts]
 */
export async function resolveOfflineReadyStatus(downloadStatus, opts = {}) {
  if (!isNativeIOS()) {
    const routeLegsReady = areCanonicalRomeWalkingRoutesComplete()
    return downloadStatus
      ? {
          ...downloadStatus,
          mapRegionReady: false,
          routeLegsReady,
          navigationReadiness: resolveNavigationOfflineReadiness({
            packageStatus: downloadStatus.status,
            mapRegionDownloaded: false,
            routeLegsPrepared: routeLegsReady,
          }).readiness,
        }
      : downloadStatus
  }

  const cityId = opts.cityId ?? ROME_OFFLINE_MAP_CITY_ID
  const mapRegionDownloaded = await isNativeMapRegionDownloaded(cityId)
  return mergeOfflineReadyWithMapRegion(downloadStatus, {
    cityId,
    mapRegionDownloaded,
  })
}

export { NAVIGATION_OFFLINE_READINESS, resolveNavigationOfflineReadiness }
