/**
 * Geolocation façade — Capacitor Geolocation on iOS, navigator.geolocation on web.
 */

import { IS_IOS } from './platform.js'

async function getCapacitorGeolocation() {
  if (!IS_IOS) return null
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    return Geolocation
  } catch {
    return null
  }
}

/**
 * @returns {Promise<{ lat: number, lng: number, accuracy: number | null } | null>}
 */
export async function getCurrentPosition({
  enableHighAccuracy = true,
  timeout = 10000,
  maximumAge = 0,
} = {}) {
  const cap = await getCapacitorGeolocation()
  if (cap) {
    try {
      const pos = await cap.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      })
      return {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
      }
    } catch {
      return null
    }
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) return null

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
        }),
      () => resolve(null),
      { enableHighAccuracy, timeout, maximumAge },
    )
  })
}

/**
 * Watch position. Returns a cancel function (sync).
 * @param {(pos: { lat: number, lng: number, accuracy: number | null }) => void} onSuccess
 * @param {(err: { code?: number, message?: string }) => void} onError
 */
export function watchPosition(onSuccess, onError, options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options

  let cancelled = false
  let watchId = null
  let callbackId = null

  void (async () => {
    const cap = await getCapacitorGeolocation()
    if (cancelled) return

    if (cap) {
      try {
        callbackId = await cap.watchPosition(
          { enableHighAccuracy, timeout, maximumAge },
          (pos, err) => {
            if (cancelled) return
            if (err || !pos) {
              onError?.(err ?? { message: 'geolocation_error' })
              return
            }
            onSuccess({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
            })
          },
        )
        return
      } catch (err) {
        onError?.(err)
        return
      }
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.({ code: 2, message: 'unavailable' })
      return
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        onSuccess({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
        })
      },
      (err) => {
        if (cancelled) return
        onError?.(err)
      },
      { enableHighAccuracy, timeout, maximumAge },
    )
  })()

  return () => {
    cancelled = true
    if (watchId != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
    if (callbackId != null) {
      void getCapacitorGeolocation().then((cap) => {
        cap?.clearWatch?.({ id: callbackId })
      })
    }
  }
}
