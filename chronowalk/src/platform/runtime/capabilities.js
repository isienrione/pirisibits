/**
 * Central capability flags for web-only vs native experiences.
 * Prefer this over scattering Capacitor checks through UI.
 */

import { isNativePlatform, isNativeIOS, isWebPlatform, getAppRuntime } from './platformRuntime.js'

/**
 * @typedef {Object} AppCapabilities
 * @property {boolean} serviceWorkerRegistration
 * @property {boolean} pwaInstall
 * @property {boolean} addToHomeScreenHints
 * @property {boolean} browserShellRecovery
 * @property {boolean} webCheckout
 * @property {boolean} paddleCheckout
 * @property {boolean} storeKitPurchase Native iOS StoreKit path (product enablement is separate).
 */

/**
 * @returns {AppCapabilities}
 */
export function getAppCapabilities() {
  const native = isNativePlatform()
  const web = !native
  const nativeIos = isNativeIOS()
  return {
    // Native shells bundle assets via cap sync — never register a browser SW.
    serviceWorkerRegistration: web,
    // Add to Home Screen / beforeinstallprompt are browser-only.
    pwaInstall: web,
    addToHomeScreenHints: web,
    // /rome/reset-shell and related Safari recovery are PWA/browser escapes.
    browserShellRecovery: web,
    // Paddle overlay checkout is web/PWA only — never inside the iOS shell.
    webCheckout: web,
    paddleCheckout: web,
    // StoreKit purchase path is native iOS only. Individual Apple product
    // mappings remain disabled until App Store Connect is configured.
    storeKitPurchase: nativeIos,
  }
}

export function canRegisterServiceWorker() {
  return getAppCapabilities().serviceWorkerRegistration
}

export function canOfferPwaInstall() {
  return getAppCapabilities().pwaInstall && isWebPlatform()
}

export function canUseWebCheckout() {
  return getAppCapabilities().webCheckout
}

/** Alias — Paddle checkout is never available in the native shell. */
export function canUsePaddleCheckout() {
  return getAppCapabilities().paddleCheckout
}

/**
 * True when the runtime may use the StoreKit purchase adapter.
 * Product-level `enabled` flags still gate actual purchases.
 */
export function canUseStoreKitPurchase() {
  return getAppCapabilities().storeKitPurchase
}

export function canUseBrowserShellRecovery() {
  return getAppCapabilities().browserShellRecovery
}

export { getAppRuntime }
