/**
 * Capacitor / native-shell detection.
 * Keep web PWA behavior unchanged when these return false.
 */

function getCapacitor() {
  if (typeof window === 'undefined') return null
  return window.Capacitor ?? null
}

/** True when running inside a Capacitor native shell (iOS/Android). */
export function isNativeApp() {
  const capacitor = getCapacitor()
  if (!capacitor) return false
  if (typeof capacitor.isNativePlatform === 'function') {
    return capacitor.isNativePlatform()
  }
  return Boolean(capacitor.isNative)
}

/** 'ios' | 'android' | 'web' */
export function getNativePlatform() {
  const capacitor = getCapacitor()
  if (!capacitor || !isNativeApp()) return 'web'
  if (typeof capacitor.getPlatform === 'function') {
    return capacitor.getPlatform()
  }
  return 'web'
}

export function isNativeIos() {
  return getNativePlatform() === 'ios'
}
