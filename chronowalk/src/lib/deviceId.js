const DEVICE_KEY = 'cw_device_id'

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `dev_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

/** Stable per-install device id (survives reloads; cleared with site data). */
export function getDeviceId() {
  if (typeof window === 'undefined') return 'server'
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY)
    if (existing) return existing
    const next = randomId()
    window.localStorage.setItem(DEVICE_KEY, next)
    return next
  } catch {
    return randomId()
  }
}
