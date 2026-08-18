import { Capacitor } from '@capacitor/core'

/** Running inside a Capacitor native shell (iOS or Android). */
export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

/**
 * DEV-only screenshot / QA preview of native screens in a browser.
 * Production builds ignore this — Capacitor iOS is the real signal.
 */
function isDevNativePreview() {
  if (!import.meta.env.DEV) return false
  try {
    if (typeof window === 'undefined') return false
    if (new URLSearchParams(window.location.search).get('nativePreview') === '1') return true
    return window.localStorage?.getItem('cw_dev_native_preview') === '1'
  } catch {
    return false
  }
}

/** Running inside the Capacitor iOS binary. */
export function isNativeIOS() {
  return Capacitor.getPlatform() === 'ios' || isDevNativePreview()
}

/** Running in a normal browser tab (not a native shell). */
export function isWebPlatform() {
  return Capacitor.getPlatform() === 'web'
}

/** Current Capacitor platform id: `web`, `ios`, or `android`. */
export function getNativePlatform() {
  return Capacitor.getPlatform()
}

/**
 * Development-only platform diagnostics (console). Never shown in UI.
 * Call from main.jsx or tests when validating the native container.
 */
export function logPlatformDiagnostics() {
  if (!import.meta.env.DEV) return

  console.debug('[chronowalk:platform]', {
    platform: Capacitor.getPlatform(),
    native: Capacitor.isNativePlatform(),
    ios: isNativeIOS(),
  })
}
