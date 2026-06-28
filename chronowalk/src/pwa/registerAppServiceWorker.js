/**
 * Registers the Workbox service worker in production and exposes update hooks.
 */
export function registerAppServiceWorker(registerSW, { isProd = import.meta.env.PROD } = {}) {
  if (!isProd || typeof registerSW !== 'function') {
    return {
      applyUpdate: () => {},
      onNeedRefresh: () => () => {},
    }
  }

  const listeners = new Set()
  let updateServiceWorker = null

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      listeners.forEach((listener) => listener())
    },
  })

  return {
    applyUpdate() {
      updateServiceWorker?.(true)
    },
    onNeedRefresh(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
