import {
  broadcastForceReload,
  hardReload,
  isChromeBrowser,
  listenForForceReload,
  nudgeWaitingServiceWorker,
  purgeAllPwaCaches,
  showUpdatingOverlay,
  unregisterAllServiceWorkers,
} from './pwaCacheUtils.js'
import { canRegisterServiceWorker } from '../platform/runtime/index.js'

function createNoopController() {
  return {
    applyUpdate: () => {},
    onNeedRefresh: () => () => {},
    checkForAppUpdate: async () => {
      if (typeof window !== 'undefined') window.location.reload()
    },
  }
}

/**
 * Registers the Workbox service worker in production and exposes update hooks.
 *
 * Critical: never auto-reload when a new service worker takes control.
 * vite-plugin-pwa `autoUpdate` (and even `prompt` after SKIP_WAITING) defaults
 * to `window.location.reload()` unless `onNeedReload` is provided. We only
 * reload after the traveler explicitly taps the update toast (or Settings →
 * refresh), and otherwise surface `onNeedRefresh` listeners.
 *
 * Capacitor native shells skip registration — assets are bundled via `cap sync`.
 */
export function registerAppServiceWorker(registerSW, { isProd = import.meta.env.PROD } = {}) {
  if (!isProd || typeof registerSW !== 'function' || !canRegisterServiceWorker()) {
    return createNoopController()
  }

  const listeners = new Set()
  let updateServiceWorker = null
  let pendingReload = false
  let reloading = false

  const notifyNeedRefresh = () => {
    listeners.forEach((listener) => {
      try {
        listener()
      } catch {
        // Toast listeners must never break the app shell.
      }
    })
  }

  const scheduleReload = () => {
    if (reloading || typeof window === 'undefined') return
    reloading = true
    hardReload()
  }

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Only reload when the traveler accepted an update — never on ambient
      // controller changes (first claim, external update, unregister races).
      if (pendingReload) scheduleReload()
    })

    listenForForceReload(() => {
      if (!reloading) scheduleReload()
    })

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      // Never poke SW update while offline - a failed update path has triggered
      // shell wipes that land Safari on its native “no signal” interstitial.
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      navigator.serviceWorker.getRegistration()?.then((reg) => reg?.update())
    })

    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return
      if (typeof navigator !== 'undefined' && navigator.onLine === false) return
      navigator.serviceWorker.getRegistration()?.then((reg) => reg?.update())
    })
  }

  const activateUpdate = () => {
    pendingReload = true
    updateServiceWorker?.(true)
    // iOS home-screen PWAs sometimes skip controllerchange - nudge a reload
    // only after an explicit user accept (pendingReload already set).
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (pendingReload) scheduleReload()
      }, 1500)
    }
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      notifyNeedRefresh()
    },
    onOfflineReady() {},
    // Suppress vite-plugin-pwa's default `window.location.reload()`.
    onNeedReload() {
      if (pendingReload) {
        scheduleReload()
        return
      }
      notifyNeedRefresh()
    },
  })

  return {
    applyUpdate() {
      activateUpdate()
    },
    onNeedRefresh(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async checkForAppUpdate() {
      showUpdatingOverlay('Refreshing…')

      await purgeAllPwaCaches()
      await unregisterAllServiceWorkers()

      if (!('serviceWorker' in navigator)) {
        scheduleReload()
        return
      }

      if (isChromeBrowser()) {
        broadcastForceReload()
        scheduleReload()
        return
      }

      const registration = await navigator.serviceWorker.getRegistration()
      await nudgeWaitingServiceWorker(registration)
      if (registration) await registration.update()
      activateUpdate()
    },
  }
}
