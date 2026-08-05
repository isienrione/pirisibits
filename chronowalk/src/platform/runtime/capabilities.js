/**
 * Central capability flags for web-only vs native experiences.
 * Prefer this over scattering Capacitor checks through UI.
 */

import { isNativePlatform, isWebPlatform, getAppRuntime } from './platformRuntime.js'

/**
 * @typedef {Object} AppCapabilities
 * @property {boolean} serviceWorkerRegistration
 * @property {boolean} pwaInstall
 * @property {boolean} addToHomeScreenHints
 * @property {boolean} browserShellRecovery
 * @property {boolean} webCheckout
 * @property {boolean} paddleCheckout
 */

/**
 * @returns {AppCapabilities}
 */
export function getAppCapabilities() {
  const native = isNativePlatform()
  const web = !native
  return {
    // Native shells bundle assets via cap sync — never register a browser SW.
    serviceWorkerRegistration: web,
    // Add to Home Screen / beforeinstallprompt are browser-only.
    pwaInstall: web,
    addToHomeScreenHints: web,
    // /rome/reset-shell and related Safari recovery are PWA/browser escapes.
    browserShellRecovery: web,
    // Paddle overlay checkout is web-only for now (StoreKit is a later PR).
    webCheckout: web,
    paddleCheckout: web,
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

export function canUseBrowserShellRecovery() {
  return getAppCapabilities().browserShellRecovery
}

export { getAppRuntime }
