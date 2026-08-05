/**
 * Platform runtime detection for web vs Capacitor native shells.
 * Web remains the default. Capacitor APIs are never required at import time.
 */

/**
 * @typedef {'web' | 'ios' | 'android' | 'electron' | string} PlatformName
 */

/**
 * @typedef {Object} AppRuntime
 * @property {PlatformName} platform
 * @property {boolean} isNative
 * @property {boolean} isNativeIOS
 * @property {boolean} isWeb
 * @property {boolean} hasCapacitor
 */

/**
 * @returns {import('@capacitor/core').Capacitor | null}
 */
export function getCapacitorGlobal() {
  if (typeof window === 'undefined') return null
  return window.Capacitor ?? null
}

/**
 * True when running inside a Capacitor native shell.
 * Safe when Capacitor is absent (returns false).
 */
export function isNativePlatform() {
  const capacitor = getCapacitorGlobal()
  if (!capacitor) return false
  try {
    if (typeof capacitor.isNativePlatform === 'function') {
      return Boolean(capacitor.isNativePlatform())
    }
  } catch {
    return false
  }
  return Boolean(capacitor.isNative)
}

/**
 * @returns {PlatformName}
 */
export function getPlatformName() {
  const capacitor = getCapacitorGlobal()
  if (!capacitor || !isNativePlatform()) return 'web'
  try {
    if (typeof capacitor.getPlatform === 'function') {
      return /** @type {PlatformName} */ (capacitor.getPlatform() || 'web')
    }
  } catch {
    return 'web'
  }
  return 'web'
}

export function isNativeIOS() {
  return getPlatformName() === 'ios'
}

export function isWebPlatform() {
  return !isNativePlatform()
}

/**
 * @returns {AppRuntime}
 */
export function getAppRuntime() {
  const platform = getPlatformName()
  const isNative = isNativePlatform()
  return {
    platform,
    isNative,
    isNativeIOS: platform === 'ios',
    isWeb: !isNative,
    hasCapacitor: Boolean(getCapacitorGlobal()),
  }
}
