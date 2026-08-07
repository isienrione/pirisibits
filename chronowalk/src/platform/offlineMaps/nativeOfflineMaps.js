/**
 * Browser-safe bridge to the ChronoWalkOfflineMaps Capacitor plugin.
 *
 * - Lazy-calls the native plugin only on Capacitor iOS
 * - Returns supported:false on web / Android / missing plugin
 * - Contains no native/Node imports in the browser runtime
 * - Does not initialize Mapbox on web
 */

import { isNativeIOS } from '../runtime/platformRuntime.js'
import { getOfflineMapConfig } from './romeOfflineMapConfig.js'
import {
  OFFLINE_MAP_ERROR,
  OFFLINE_MAP_STATUS,
  normalizeOfflineMapErrorCode,
  normalizeRegionStatus,
} from './offlineMapStatus.js'

export {
  OFFLINE_MAP_ERROR,
  OFFLINE_MAP_STATUS,
  normalizeOfflineMapErrorCode,
  normalizeDownloadProgress,
  normalizeOfflineMapStatus,
  normalizeRegionStatus,
} from './offlineMapStatus.js'

export {
  ROME_OFFLINE_MAP_CONFIG,
  ROME_OFFLINE_MAP_BOUNDS,
  ROME_OFFLINE_MAP_ZOOM,
  getOfflineMapConfig,
} from './romeOfflineMapConfig.js'

const PLUGIN_NAME = 'ChronoWalkOfflineMaps'

/**
 * @returns {any | null}
 */
function getCapacitor() {
  if (typeof window === 'undefined') return null
  return window.Capacitor ?? null
}

/**
 * Resolve the native plugin without importing Capacitor packages.
 * @returns {any | null}
 */
export function resolveNativeOfflineMapsPlugin() {
  if (!isNativeIOS()) return null
  const capacitor = getCapacitor()
  if (!capacitor) return null

  const fromPlugins = capacitor.Plugins?.[PLUGIN_NAME]
  if (fromPlugins) return fromPlugins

  try {
    if (typeof capacitor.pluginRegistry?.getPlugin === 'function') {
      return capacitor.pluginRegistry.getPlugin(PLUGIN_NAME) ?? null
    }
  } catch {
    // ignore
  }

  return null
}

function unsupportedResult(cityId = null) {
  return {
    cityId,
    supported: false,
    status: OFFLINE_MAP_STATUS.NOT_DOWNLOADED,
    progress: null,
    completedResourceCount: null,
    requiredResourceCount: null,
    errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
  }
}

/**
 * @returns {Promise<{ supported: boolean, platform: string }>}
 */
export async function isSupported() {
  if (!isNativeIOS()) {
    return { supported: false, platform: 'web' }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.isSupported) {
    return { supported: false, platform: 'ios' }
  }

  try {
    const result = await plugin.isSupported()
    return {
      supported: Boolean(result?.supported),
      platform: typeof result?.platform === 'string' ? result.platform : 'ios',
    }
  } catch {
    return { supported: false, platform: 'ios' }
  }
}

/**
 * @param {{ cityId: string }} params
 */
export async function getRegionStatus({ cityId } = {}) {
  const normalizedCityId =
    typeof cityId === 'string' ? cityId.trim().toLowerCase() : ''

  if (!isNativeIOS()) {
    return unsupportedResult(normalizedCityId || null)
  }

  if (!normalizedCityId || !getOfflineMapConfig(normalizedCityId)) {
    return {
      cityId: normalizedCityId || null,
      supported: true,
      status: OFFLINE_MAP_STATUS.FAILED,
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_CITY,
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.getRegionStatus) {
    return unsupportedResult(normalizedCityId)
  }

  try {
    const raw = await plugin.getRegionStatus({ cityId: normalizedCityId })
    return normalizeRegionStatus(raw, { cityId: normalizedCityId, supported: true })
  } catch (error) {
    return failureFromPluginError(normalizedCityId, error)
  }
}

/**
 * @param {{ cityId: string }} params
 */
export async function downloadRegion({ cityId } = {}) {
  const normalizedCityId =
    typeof cityId === 'string' ? cityId.trim().toLowerCase() : ''

  if (!isNativeIOS()) {
    return unsupportedResult(normalizedCityId || null)
  }

  if (!normalizedCityId || !getOfflineMapConfig(normalizedCityId)) {
    return {
      cityId: normalizedCityId || null,
      supported: true,
      status: OFFLINE_MAP_STATUS.FAILED,
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_CITY,
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.downloadRegion) {
    return unsupportedResult(normalizedCityId)
  }

  try {
    const raw = await plugin.downloadRegion({ cityId: normalizedCityId })
    return normalizeRegionStatus(raw, { cityId: normalizedCityId, supported: true })
  } catch (error) {
    return failureFromPluginError(normalizedCityId, error)
  }
}

/**
 * @param {{ cityId: string } | string} params
 */
export async function deleteRegion(params) {
  const cityId = typeof params === 'string' ? params : params?.cityId
  const normalizedCityId =
    typeof cityId === 'string' ? cityId.trim().toLowerCase() : ''

  if (!isNativeIOS()) {
    return unsupportedResult(normalizedCityId || null)
  }

  if (!normalizedCityId || !getOfflineMapConfig(normalizedCityId)) {
    return {
      cityId: normalizedCityId || null,
      supported: true,
      status: OFFLINE_MAP_STATUS.FAILED,
      progress: null,
      completedResourceCount: null,
      requiredResourceCount: null,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_CITY,
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.deleteRegion) {
    return unsupportedResult(normalizedCityId)
  }

  try {
    const raw = await plugin.deleteRegion({ cityId: normalizedCityId })
    return normalizeRegionStatus(raw, { cityId: normalizedCityId, supported: true })
  } catch (error) {
    return failureFromPluginError(normalizedCityId, error)
  }
}

function failureFromPluginError(cityId, error) {
  const code =
    error?.code ??
    error?.data?.code ??
    error?.errorCode ??
    error?.message

  return {
    cityId,
    supported: true,
    status: OFFLINE_MAP_STATUS.FAILED,
    progress: null,
    completedResourceCount: null,
    requiredResourceCount: null,
    errorCode: normalizeOfflineMapErrorCode(code),
    errorMessage:
      typeof error?.message === 'string' && error.message
        ? error.message
        : undefined,
  }
}

export const nativeOfflineMaps = {
  isSupported,
  getRegionStatus,
  downloadRegion,
  deleteRegion,
  resolveNativeOfflineMapsPlugin,
}

export default nativeOfflineMaps
