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

/** Capacitor event name for download progress (native iOS). */
export const OFFLINE_MAP_PROGRESS_EVENT = 'offlineMapProgress'

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

/**
 * Open the native Mapbox MapView test map (iOS only).
 * Never routes to TourMap / RedesignMapPage / Mapbox GL JS.
 *
 * @param {{ cityId: string }} params
 * @returns {Promise<{
 *   opened: boolean,
 *   cityId: string | null,
 *   supported: boolean,
 *   renderer?: string,
 *   styleURI?: string,
 *   errorCode?: string,
 *   errorMessage?: string,
 * }>}
 */
export async function openTestMap({ cityId } = {}) {
  const normalizedCityId =
    typeof cityId === 'string' ? cityId.trim().toLowerCase() : ''

  if (!isNativeIOS()) {
    return {
      opened: false,
      cityId: normalizedCityId || null,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }

  if (!normalizedCityId || !getOfflineMapConfig(normalizedCityId)) {
    return {
      opened: false,
      cityId: normalizedCityId || null,
      supported: true,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_CITY,
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.openTestMap) {
    return {
      opened: false,
      cityId: normalizedCityId,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }

  try {
    const raw = await plugin.openTestMap({ cityId: normalizedCityId })
    return {
      opened: Boolean(raw?.opened),
      cityId: normalizedCityId,
      supported: true,
      renderer:
        typeof raw?.renderer === 'string' ? raw.renderer : 'mapbox-maps-ios',
      styleURI:
        typeof raw?.styleURI === 'string'
          ? raw.styleURI
          : getOfflineMapConfig(normalizedCityId)?.styleURI,
    }
  } catch (error) {
    const code =
      error?.code ??
      error?.data?.code ??
      error?.errorCode ??
      error?.message

    return {
      opened: false,
      cityId: normalizedCityId,
      supported: true,
      errorCode: normalizeOfflineMapErrorCode(code),
      errorMessage:
        typeof error?.message === 'string' && error.message
          ? error.message
          : undefined,
    }
  }
}

/**
 * Subscribe to native download progress events when available.
 * Returns an unsubscribe function. No-op on web / missing plugin.
 *
 * @param {(payload: ReturnType<typeof normalizeRegionStatus>) => void} listener
 * @returns {() => void}
 */
export function subscribeOfflineMapProgress(listener) {
  if (typeof listener !== 'function') return () => {}
  if (!isNativeIOS()) return () => {}

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.addListener) return () => {}

  let handle = null
  let cancelled = false

  Promise.resolve(plugin.addListener(OFFLINE_MAP_PROGRESS_EVENT, (raw) => {
    listener(
      normalizeRegionStatus(raw ?? {}, {
        cityId: typeof raw?.cityId === 'string' ? raw.cityId : null,
        supported: true,
      }),
    )
  }))
    .then((h) => {
      if (cancelled) {
        h?.remove?.()
        return
      }
      handle = h
    })
    .catch(() => {
      // Progress events are optional for the DEV harness.
    })

  return () => {
    cancelled = true
    handle?.remove?.()
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
  openTestMap,
  subscribeOfflineMapProgress,
  resolveNativeOfflineMapsPlugin,
}

export default nativeOfflineMaps
