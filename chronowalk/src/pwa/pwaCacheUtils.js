const FORCE_RELOAD_CHANNEL = 'chronowalk-force-reload'

/** Clear every Cache Storage bucket (Workbox precache, runtime caches, etc.). */
export async function clearAllCaches() {
  if (!('caches' in globalThis)) return
  const names = await caches.keys()
  await Promise.all(names.map((name) => caches.delete(name)))
}

/** Alias used by manual refresh flows. */
export async function purgeAllPwaCaches() {
  await clearAllCaches()
}

/** Unregister all service workers for this origin. */
export async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

/**
 * Wait until this tab is no longer controlled by a service worker.
 * iOS Safari often keeps the old controller briefly after unregister();
 * navigating while still controlled re-serves the poisoned shell.
 *
 * @param {number} [timeoutMs]
 * @returns {Promise<boolean>} true when controller is gone
 */
export async function waitForServiceWorkerControllerGone(timeoutMs = 10000) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return true
  }

  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const controller = navigator.serviceWorker.controller
    const regs = await navigator.serviceWorker.getRegistrations()
    if (!controller && regs.length === 0) return true
    await new Promise((resolve) => window.setTimeout(resolve, 100))
  }

  const controller = navigator.serviceWorker.controller
  const regs = await navigator.serviceWorker.getRegistrations()
  return !controller && regs.length === 0
}

export function isChromeBrowser() {
  if (typeof navigator === 'undefined') return false
  return /Chrome/i.test(navigator.userAgent) && !/Edg|OPR/i.test(navigator.userAgent)
}

/**
 * Cache-busting navigation. Plain location.reload() often reuses Safari's
 * HTTP/bfcache document after a Cloudflare deploy, so the same stale shell
 * comes back. Replace with a unique query param forces a network HTML fetch.
 *
 * @param {{ path?: string }} [options]
 */
export function hardReload({ path } = {}) {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(path || window.location.href, window.location.origin)
    // Drop prior bust tokens so they don't stack.
    url.searchParams.delete('cw_bust')
    url.searchParams.set('cw_bust', String(Date.now()))
    // Prefer assign so iOS standalone PWAs still navigate after SW unregister.
    window.location.assign(url.toString())
  } catch {
    try {
      window.location.href = `${path || '/landing'}?cw_bust=${Date.now()}`
    } catch {
      window.location.reload()
    }
  }
}

export function showUpdatingOverlay(message = 'Updating…') {
  if (typeof document === 'undefined') return
  if (document.getElementById('cw-updating-overlay')) return

  const overlay = document.createElement('div')
  overlay.id = 'cw-updating-overlay'
  overlay.setAttribute('role', 'status')
  overlay.setAttribute('aria-live', 'polite')
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(11, 11, 13, 0.92)',
    color: '#f5f0e8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '16px',
  })
  overlay.textContent = message
  document.body.appendChild(overlay)
}

export function broadcastForceReload() {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(FORCE_RELOAD_CHANNEL)
    channel.postMessage('reload')
    channel.close()
  } catch {
    // BroadcastChannel may be unavailable in some embedded contexts.
  }
}

export function listenForForceReload(callback) {
  if (typeof BroadcastChannel === 'undefined') return
  try {
    const channel = new BroadcastChannel(FORCE_RELOAD_CHANNEL)
    channel.onmessage = (event) => {
      if (event.data === 'reload') callback()
    }
  } catch {
    // ignore
  }
}

export async function nudgeWaitingServiceWorker(registration) {
  if (!registration?.waiting) return
  registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  await new Promise((resolve) => window.setTimeout(resolve, 200))
}
