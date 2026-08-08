/**
 * Truthful overall navigation offline readiness.
 *
 * Keeps audio/package download status and TileStore map-region status separate
 * internally, but exposes a single readiness enum for UI / diagnostics:
 *
 * READY | DOWNLOADING | INCOMPLETE | FAILED | NOT_PREPARED
 */

import { areCanonicalRomeWalkingRoutesComplete } from '../../navigation/canonicalWalkingLegs.js'
import { OFFLINE_MAP_STATUS } from './offlineMapStatus.js'

export const NAVIGATION_OFFLINE_READINESS = Object.freeze({
  READY: 'ready',
  DOWNLOADING: 'downloading',
  INCOMPLETE: 'incomplete',
  FAILED: 'failed',
  NOT_PREPARED: 'not_prepared',
})

/**
 * @param {{
 *   packageStatus?: string | null,
 *   mapRegionStatus?: string | null,
 *   mapRegionDownloaded?: boolean,
 *   routeLegsPrepared?: boolean,
 *   cityId?: string,
 * }} [input]
 */
export function resolveNavigationOfflineReadiness(input = {}) {
  const packageStatus =
    typeof input.packageStatus === 'string' ? input.packageStatus : null
  const mapRegionStatus =
    typeof input.mapRegionStatus === 'string' ? input.mapRegionStatus : null
  const mapRegionDownloaded =
    typeof input.mapRegionDownloaded === 'boolean'
      ? input.mapRegionDownloaded
      : mapRegionStatus === OFFLINE_MAP_STATUS.DOWNLOADED
  // Straight-line-only packages are NOT prepared for READY offline navigation.
  const routeLegsPrepared =
    typeof input.routeLegsPrepared === 'boolean'
      ? input.routeLegsPrepared
      : areCanonicalRomeWalkingRoutesComplete()

  const packageDownloading = ['downloading', 'queued', 'verifying'].includes(
    packageStatus,
  )
  const mapDownloading = mapRegionStatus === OFFLINE_MAP_STATUS.DOWNLOADING
  const packageFailed = packageStatus === 'failed'
  const mapFailed = mapRegionStatus === OFFLINE_MAP_STATUS.FAILED
  const packageReady = packageStatus === 'ready' || packageStatus === 'update_available'

  if (packageFailed || mapFailed) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.FAILED,
      packageReady,
      mapRegionReady: mapRegionDownloaded,
      routeLegsReady: routeLegsPrepared,
      canOpenPreparedMap: mapRegionDownloaded,
      canRetry: true,
      reason: packageFailed ? 'package_failed' : 'map_region_failed',
    }
  }

  if (packageDownloading || mapDownloading) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.DOWNLOADING,
      packageReady,
      mapRegionReady: mapRegionDownloaded,
      routeLegsReady: routeLegsPrepared,
      canOpenPreparedMap: mapRegionDownloaded,
      canRetry: false,
      reason: packageDownloading ? 'package_downloading' : 'map_region_downloading',
    }
  }

  // Partial: audio/package ready but map tiles missing (or vice versa), or missing legs.
  if (packageReady && !mapRegionDownloaded) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      packageReady: true,
      mapRegionReady: false,
      routeLegsReady: routeLegsPrepared,
      canOpenPreparedMap: false,
      canRetry: true,
      reason: 'map_region_not_downloaded',
    }
  }

  if (!packageReady && mapRegionDownloaded) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      packageReady: false,
      mapRegionReady: true,
      routeLegsReady: routeLegsPrepared,
      canOpenPreparedMap: true,
      canRetry: true,
      reason: 'package_not_ready',
    }
  }

  if (packageReady && mapRegionDownloaded && !routeLegsPrepared) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.INCOMPLETE,
      packageReady: true,
      mapRegionReady: true,
      routeLegsReady: false,
      canOpenPreparedMap: true,
      canRetry: false,
      reason: 'route_legs_not_prepared',
    }
  }

  if (packageReady && mapRegionDownloaded && routeLegsPrepared) {
    return {
      readiness: NAVIGATION_OFFLINE_READINESS.READY,
      packageReady: true,
      mapRegionReady: true,
      routeLegsReady: true,
      canOpenPreparedMap: true,
      canRetry: false,
      reason: null,
    }
  }

  return {
    readiness: NAVIGATION_OFFLINE_READINESS.NOT_PREPARED,
    packageReady: false,
    mapRegionReady: mapRegionDownloaded,
    routeLegsReady: routeLegsPrepared,
    canOpenPreparedMap: mapRegionDownloaded,
    canRetry: true,
    reason: 'not_prepared',
  }
}
