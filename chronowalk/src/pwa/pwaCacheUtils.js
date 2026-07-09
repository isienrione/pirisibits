const FORCE_RELOAD_KEY = 'cw-force-reload'
const BROADCAST_CHANNEL = 'chronowalk-pwa'

export function isChromeBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Chrome|CriOS/.test(ua) && !/Edg|OPR|SamsungBrowser/.test(ua)
}

export async function purgeAllPwaCaches() {
  if (!('caches' in window)) return
  const names = await caches.keys()
  await Promise.all(names.map((name) => caches.delete(name)))
}

export async function unregisterAllServiceWorkers() {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))
}

export async function nudgeWaitingServiceWorker(registration) {
  if (!registration) return
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
  await registration.update()
}

export function broadcastForceReload() {
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL)
    channel.postMessage({ type: 'FORCE_RELOAD' })
    channel.close()
  } catch {
    // BroadcastChannel may be unavailable in older browsers.
  }

  try {
    localStorage.setItem(FORCE_RELOAD_KEY, String(Date.now()))
    localStorage.removeItem(FORCE_RELOAD_KEY)
  } catch {
    // Ignore storage failures in private mode.
  }
}

export function hardReload() {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('_', String(Date.now()))
  window.location.replace(url.toString())
}

export function listenForForceReload(onReload) {
  if (typeof window === 'undefined') return () => {}

  const handleStorage = (event) => {
    if (event.key === FORCE_RELOAD_KEY) onReload()
  }

  let channel
  const handleMessage = (event) => {
    if (event.data?.type === 'FORCE_RELOAD') onReload()
  }

  window.addEventListener('storage', handleStorage)

  try {
    channel = new BroadcastChannel(BROADCAST_CHANNEL)
    channel.addEventListener('message', handleMessage)
  } catch {
    channel = null
  }

  return () => {
    window.removeEventListener('storage', handleStorage)
    channel?.close()
  }
}

export function showUpdatingOverlay(message = 'Updating…') {
  if (typeof document === 'undefined' || document.getElementById('cw-updating')) return

  const overlay = document.createElement('div')
  overlay.id = 'cw-updating'
  overlay.setAttribute('role', 'status')
  overlay.setAttribute('aria-live', 'polite')
  overlay.textContent = message
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#16130F',
    color: '#F5F0E8',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '17px',
    letterSpacing: '0.02em',
  })

  ;(document.body ?? document.documentElement).appendChild(overlay)
}
