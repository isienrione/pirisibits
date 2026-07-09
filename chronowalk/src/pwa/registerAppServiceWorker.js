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

/**
 * Registers the Workbox service worker in production and exposes update hooks.
 * iOS standalone PWAs often keep stale JS until the page reloads after a new SW activates.
 * Chrome installed PWAs can keep an old controller until caches are cleared and all tabs reload.
 */
export function registerAppServiceWorker(registerSW, { isProd = import.meta.env.PROD } = {}) {
  if (!isProd || typeof registerSW !== 'function') {
    return {
      applyUpdate: () => {},
      onNeedRefresh: () => () => {},
      checkForAppUpdate: async () => {
        window.location.reload()
      },
    }
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
      navigator.serviceWorker.getRegistration()?.then((reg) => reg?.update())
    })

    window.addEventListener('pageshow', (event) => {
      if (!event.persisted) return
      navigator.serviceWorker.getRegistration()?.then((reg) => reg?.update())
    })
  }

  const activateUpdate = () => {
    pendingReload = true
    updateServiceWorker?.(true)
    // iOS home-screen PWAs sometimes skip controllerchange — nudge a reload.
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
      activateUpdate()
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
      if (!('serviceWorker' in navigator)) {
        scheduleReload()
        return
      }

      showUpdatingOverlay('Refreshing…')

      const registration = await navigator.serviceWorker.ready
        .then(() => navigator.serviceWorker.getRegistration())
        .catch(() => navigator.serviceWorker.getRegistration())

      await nudgeWaitingServiceWorker(registration)

      if (isChromeBrowser()) {
        broadcastForceReload()
        await purgeAllPwaCaches()
        await unregisterAllServiceWorkers()
        scheduleReload()
        return
      }

      if (registration) await registration.update()
      activateUpdate()
    },
  }
}
