import { isNativeApp } from '../utils/nativePlatform.js'
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
 * iOS standalone PWAs often keep stale JS until the page reloads after a new SW activates.
 * Chrome installed PWAs can keep an old controller until caches are cleared and all tabs reload.
 * Capacitor native shells skip SW registration — assets are bundled via `cap sync`.
 */
export function registerAppServiceWorker(registerSW, { isProd = import.meta.env.PROD } = {}) {
  if (!isProd || typeof registerSW !== 'function' || isNativeApp()) {
    return createNoopController()
  }

  const listeners = new Set()
  let updateServiceWorker = null
  let pendingReload = false
  let reloading = false

  const scheduleReload = () => {
    if (reloading || typeof window === 'undefined') return
    reloading = true
    hardReload()
  }

  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
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
    // iOS home-screen PWAs sometimes skip controllerchange - nudge a reload.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (pendingReload) scheduleReload()
      }, 1500)
    }
  }

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      listeners.forEach((listener) => listener())
    },
    onOfflineReady() {},
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
