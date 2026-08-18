import { Geolocation } from '@capacitor/geolocation'
import { isDebugGeo } from '../config/env'
import { isNativeApp } from './platform.js'

export const LOCATION_STATUS = Object.freeze({
  LOADING: 'loading',
  SUCCESS: 'success',
  DENIED: 'denied',
  TIMEOUT: 'timeout',
  UNAVAILABLE: 'unavailable',
})

export const DEFAULT_LOCATION_TIMEOUT_MS = 12000

const DEBUG_ROME_POSITION = Object.freeze({
  lat: 41.89885,
  lng: 12.47687,
  accuracy: 10,
  timestamp: 0,
})

/**
 * Normalize Capacitor / browser geolocation into the shape Haversine + geofence
 * already consume: `{ lat, lng, accuracy, timestamp }`.
 */
export function normalizeGeoPosition(raw) {
  if (!raw) return null
  const lat = Number(raw.coords?.latitude ?? raw.lat)
  const lng = Number(raw.coords?.longitude ?? raw.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  const accuracyRaw = Number(raw.coords?.accuracy ?? raw.accuracy)
  return {
    lat,
    lng,
    accuracy: Number.isFinite(accuracyRaw) ? accuracyRaw : null,
    timestamp: Number(raw.timestamp) || Date.now(),
  }
}

function withTimeout(promise, timeoutMs, timeoutValue) {
  return new Promise((resolve) => {
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      resolve(timeoutValue)
    }, timeoutMs)
    promise.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        resolve(timeoutValue)
      },
    )
  })
}

function statusFromError(err) {
  const code = err?.code
  const message = String(err?.message || err || '')
  if (code === 1 || /denied|permission/i.test(message)) return LOCATION_STATUS.DENIED
  if (code === 3 || /timeout/i.test(message)) return LOCATION_STATUS.TIMEOUT
  return LOCATION_STATUS.UNAVAILABLE
}

async function nativePermissionStatus(timeoutMs) {
  const result = await withTimeout(
    (async () => {
      try {
        const current = await Geolocation.checkPermissions()
        if (current?.location === 'granted') return 'granted'
        if (current?.location === 'denied') return 'denied'
        const requested = await Geolocation.requestPermissions({ permissions: ['location'] })
        if (requested?.location === 'granted') return 'granted'
        if (requested?.location === 'denied') return 'denied'
        return 'denied'
      } catch (err) {
        return statusFromError(err) === LOCATION_STATUS.DENIED ? 'denied' : 'unavailable'
      }
    })(),
    timeoutMs,
    'timeout',
  )
  return result
}

async function nativeFix(timeoutMs) {
  const permission = await nativePermissionStatus(timeoutMs)
  if (permission === 'timeout') {
    return { status: LOCATION_STATUS.TIMEOUT, position: null }
  }
  if (permission === 'denied') {
    return { status: LOCATION_STATUS.DENIED, position: null }
  }
  if (permission === 'unavailable') {
    return { status: LOCATION_STATUS.UNAVAILABLE, position: null }
  }

  const result = await withTimeout(
    Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 0,
    })
      .then((raw) => {
        const position = normalizeGeoPosition(raw)
        return position
          ? { status: LOCATION_STATUS.SUCCESS, position }
          : { status: LOCATION_STATUS.UNAVAILABLE, position: null }
      })
      .catch((err) => ({ status: statusFromError(err), position: null })),
    timeoutMs,
    { status: LOCATION_STATUS.TIMEOUT, position: null },
  )
  return result
}

function browserFix(timeoutMs) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ status: LOCATION_STATUS.UNAVAILABLE, position: null })
  }

  return withTimeout(
    new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (raw) => {
          const position = normalizeGeoPosition(raw)
          resolve(
            position
              ? { status: LOCATION_STATUS.SUCCESS, position }
              : { status: LOCATION_STATUS.UNAVAILABLE, position: null },
          )
        },
        (err) => resolve({ status: statusFromError(err), position: null }),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
      )
    }),
    timeoutMs,
    { status: LOCATION_STATUS.TIMEOUT, position: null },
  )
}

/**
 * One-shot location fix with loading/timeout/success/denied/unavailable.
 * Always settles. Native iOS uses @capacitor/geolocation + a hard Promise.race.
 */
export async function getLocationFix({ timeoutMs = DEFAULT_LOCATION_TIMEOUT_MS } = {}) {
  if (isDebugGeo()) {
    return {
      status: LOCATION_STATUS.SUCCESS,
      position: { ...DEBUG_ROME_POSITION, timestamp: Date.now() },
    }
  }

  if (isNativeApp()) {
    return nativeFix(timeoutMs)
  }

  return browserFix(timeoutMs)
}

/** @returns {Promise<'granted' | 'denied' | 'timeout' | 'unavailable'>} */
export async function requestLocationAccess(options) {
  const { status } = await getLocationFix(options)
  if (status === LOCATION_STATUS.SUCCESS) return 'granted'
  if (status === LOCATION_STATUS.DENIED) return 'denied'
  if (status === LOCATION_STATUS.TIMEOUT) return 'timeout'
  return 'unavailable'
}

/** One-shot GPS fix. Null when denied, timed out, or unavailable. */
export async function resolveCurrentPosition(options) {
  const { status, position } = await getLocationFix(options)
  return status === LOCATION_STATUS.SUCCESS ? position : null
}
