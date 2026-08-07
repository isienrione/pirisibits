/**
 * Browser-safe bridge for the native iOS transit Mapbox map.
 * Does not import Mapbox GL JS. Web always returns unsupported_platform.
 */

import { isNativeIOS } from '../runtime/platformRuntime.js'
import { getOfflineMapConfig } from './romeOfflineMapConfig.js'
import {
  OFFLINE_MAP_ERROR,
  normalizeOfflineMapErrorCode,
} from './offlineMapStatus.js'
import { resolveNativeOfflineMapsPlugin } from './nativeOfflineMaps.js'

/**
 * @param {unknown} value
 * @returns {{ lat: number, lng: number } | null}
 */
export function normalizeLatLng(value) {
  if (!value || typeof value !== 'object') return null
  const lat = Number(value.lat ?? value.latitude)
  const lng = Number(value.lng ?? value.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

/**
 * Pass route geometry through unchanged when it is a LineString / Feature.
 * Never invents coordinates.
 *
 * @param {unknown} geometry
 * @returns {object | null}
 */
export function normalizeRouteGeoJSON(geometry) {
  if (!geometry || typeof geometry !== 'object') return null

  if (geometry.type === 'Feature' && geometry.geometry) {
    return normalizeRouteGeoJSON(geometry.geometry)
      ? {
          type: 'Feature',
          properties: geometry.properties ?? {},
          geometry: geometry.geometry,
        }
      : null
  }

  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    return {
      type: 'LineString',
      coordinates: geometry.coordinates,
    }
  }

  return null
}

/**
 * Build the Capacitor payload for openTransitMap / updateTransitMap.
 * React remains source of truth — values are forwarded, not recomputed.
 *
 * @param {object} params
 */
export function buildTransitMapPayload(params = {}) {
  const cityId =
    typeof params.cityId === 'string' ? params.cityId.trim().toLowerCase() : 'rome'
  const routeGeoJSON = normalizeRouteGeoJSON(params.routeGeoJSON ?? params.directionsGeometry)
  const origin = normalizeLatLng(params.origin)
  const destination = normalizeLatLng(params.destination)
  const currentPosition = normalizeLatLng(params.currentPosition ?? params.userPos)
  const frame = normalizeFrame(params.frame)

  return {
    cityId,
    routeGeoJSON,
    origin,
    destination,
    currentPosition,
    activeStopId:
      typeof params.activeStopId === 'string' ? params.activeStopId : null,
    destinationStopId:
      typeof params.destinationStopId === 'string'
        ? params.destinationStopId
        : null,
    showUserLocation:
      typeof params.showUserLocation === 'boolean'
        ? params.showUserLocation
        : Boolean(currentPosition),
    frame,
  }
}

/**
 * @param {unknown} frame
 */
export function normalizeFrame(frame) {
  if (!frame || typeof frame !== 'object') return null
  const x = Number(frame.x ?? frame.left)
  const y = Number(frame.y ?? frame.top)
  const width = Number(frame.width)
  const height = Number(frame.height)
  if (![x, y, width, height].every(Number.isFinite)) return null
  if (width <= 0 || height <= 0) return null
  return { x, y, width, height }
}

/**
 * Native iOS only — web / Android remain on the existing web map.
 */
export function shouldUseNativeTransitMap() {
  return isNativeIOS()
}

function unsupportedOpen(cityId = null) {
  return {
    opened: false,
    supported: false,
    cityId,
    errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
  }
}

/**
 * @param {object} params
 */
export async function openTransitMap(params = {}) {
  const payload = buildTransitMapPayload(params)
  if (!isNativeIOS()) return unsupportedOpen(payload.cityId)

  if (!getOfflineMapConfig(payload.cityId)) {
    return {
      opened: false,
      supported: true,
      cityId: payload.cityId,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_CITY,
    }
  }

  if (!payload.frame) {
    return {
      opened: false,
      supported: true,
      cityId: payload.cityId,
      errorCode: OFFLINE_MAP_ERROR.DOWNLOAD_FAILED,
      errorMessage: 'frame is required',
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.openTransitMap) return unsupportedOpen(payload.cityId)

  try {
    const raw = await plugin.openTransitMap(payload)
    return {
      opened: Boolean(raw?.opened ?? true),
      supported: true,
      cityId: payload.cityId,
      renderer:
        typeof raw?.renderer === 'string' ? raw.renderer : 'mapbox-maps-ios',
      styleURI: typeof raw?.styleURI === 'string' ? raw.styleURI : undefined,
      routeGeoJSON: payload.routeGeoJSON,
      origin: payload.origin,
      destination: payload.destination,
      currentPosition: payload.currentPosition,
    }
  } catch (error) {
    return failureResult(payload.cityId, error, { opened: false })
  }
}

/**
 * @param {object} params
 */
export async function updateTransitMap(params = {}) {
  const payload = buildTransitMapPayload(params)
  if (!isNativeIOS()) {
    return {
      updated: false,
      supported: false,
      cityId: payload.cityId,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }

  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.updateTransitMap) {
    return {
      updated: false,
      supported: false,
      cityId: payload.cityId,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }

  try {
    const raw = await plugin.updateTransitMap(payload)
    return {
      updated: Boolean(raw?.updated ?? raw?.opened ?? true),
      supported: true,
      cityId: payload.cityId,
      renderer:
        typeof raw?.renderer === 'string' ? raw.renderer : 'mapbox-maps-ios',
      routeGeoJSON: payload.routeGeoJSON,
      origin: payload.origin,
      destination: payload.destination,
      currentPosition: payload.currentPosition,
    }
  } catch (error) {
    return failureResult(payload.cityId, error, { updated: false })
  }
}

export async function closeTransitMap() {
  if (!isNativeIOS()) {
    return {
      closed: true,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.closeTransitMap) {
    return {
      closed: true,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  try {
    const raw = await plugin.closeTransitMap()
    return { closed: Boolean(raw?.closed ?? true), supported: true }
  } catch (error) {
    return failureResult(null, error, { closed: false })
  }
}

export async function recenterTransitMap() {
  if (!isNativeIOS()) {
    return {
      recentered: false,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.recenterTransitMap) {
    return {
      recentered: false,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  try {
    const raw = await plugin.recenterTransitMap()
    return { recentered: Boolean(raw?.recentered), supported: true }
  } catch (error) {
    return failureResult(null, error, { recentered: false })
  }
}

export async function setTransitMapVisible(visible) {
  if (!isNativeIOS()) {
    return {
      visible: false,
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  const plugin = resolveNativeOfflineMapsPlugin()
  if (!plugin?.setTransitMapVisible) {
    return {
      visible: Boolean(visible),
      supported: false,
      errorCode: OFFLINE_MAP_ERROR.UNSUPPORTED_PLATFORM,
    }
  }
  try {
    const raw = await plugin.setTransitMapVisible({ visible: Boolean(visible) })
    return { visible: Boolean(raw?.visible ?? visible), supported: true }
  } catch (error) {
    return failureResult(null, error, { visible: false })
  }
}

function failureResult(cityId, error, extras = {}) {
  const code =
    error?.code ?? error?.data?.code ?? error?.errorCode ?? error?.message
  return {
    ...extras,
    cityId,
    supported: true,
    errorCode: normalizeOfflineMapErrorCode(code),
    errorMessage:
      typeof error?.message === 'string' && error.message
        ? error.message
        : undefined,
  }
}

export const nativeTransitMap = {
  shouldUseNativeTransitMap,
  buildTransitMapPayload,
  openTransitMap,
  updateTransitMap,
  closeTransitMap,
  recenterTransitMap,
  setTransitMapVisible,
  normalizeLatLng,
  normalizeRouteGeoJSON,
  normalizeFrame,
}

export default nativeTransitMap
