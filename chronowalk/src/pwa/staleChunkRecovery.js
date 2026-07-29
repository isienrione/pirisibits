/**
 * Client-side recovery when a deploy leaves hashed chunks unreachable or when
 * the service worker has cached SPA HTML under a JavaScript URL.
 *
 * Preserves localStorage / IndexedDB credentials and tour progress — only
 * Cache Storage + service-worker registrations are cleared.
 */
import { clearAllCaches, hardReload, unregisterAllServiceWorkers } from './pwaCacheUtils.js'

export const CHUNK_RECOVERY_GUARD_KEY = 'cw-chunk-reload'

/**
 * @param {unknown} error
 */
export function isStaleChunkError(error) {
  if (!error) return false
  const message = String(error?.message || error)
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Load failed') ||
    message.includes("Unexpected token '<'") ||
    error?.name === 'ChunkLoadError'
  )
}

/**
 * At most one controlled recovery per tab session.
 * @returns {Promise<{ recovered: boolean, reloading: boolean }>}
 */
export async function recoverStaleClient({ force = false } = {}) {
  if (typeof window === 'undefined') {
    return { recovered: false, reloading: false }
  }

  const guard = sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)
  if (guard && !force) {
    return { recovered: false, reloading: false }
  }

  sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, '1')

  try {
    await clearAllCaches()
    await unregisterAllServiceWorkers()
    // Give iOS Safari a beat to drop the old controller before navigating.
    await new Promise((resolve) => window.setTimeout(resolve, 120))
  } catch {
    // Still reload — a soft reload often picks up the new deploy.
  }

  hardReload()
  return { recovered: true, reloading: true }
}

/**
 * Clear the one-shot guard after a successful boot past recovery.
 */
export function clearChunkRecoveryGuard() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(CHUNK_RECOVERY_GUARD_KEY)
}
