import { Capacitor } from '@capacitor/core'

/** Running inside a Capacitor native shell (iOS or Android). */
export function isNativeApp() {
  return Capacitor.isNativePlatform()
}

/** Running inside the Capacitor iOS binary. */
export function isNativeIOS() {
  return Capacitor.getPlatform() === 'ios'
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
