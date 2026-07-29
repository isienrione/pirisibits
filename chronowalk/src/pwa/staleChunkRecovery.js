/**
 * Client-side recovery when a deploy leaves hashed chunks unreachable or when
 * the service worker has cached SPA HTML under a JavaScript URL.
 *
 * Preserves localStorage / IndexedDB credentials and tour progress — only
 * Cache Storage + service-worker registrations are cleared.
 */
import {
  clearAllCaches,
  hardReload,
  showUpdatingOverlay,
  unregisterAllServiceWorkers,
  waitForServiceWorkerControllerGone,
} from './pwaCacheUtils.js'

export const CHUNK_RECOVERY_GUARD_KEY = 'cw-chunk-reload'
export const BOOT_PENDING_KEY = 'cw-boot-pending'
/** localStorage — survives the recovery navigation; consumed by index.html. */
export const SHELL_RESET_KEY = 'cw-needs-shell-reset'
/** Skip SW registration for one successful network boot after a shell reset. */
export const SKIP_SW_ONCE_KEY = 'cw-skip-sw-once'

/**
 * @param {unknown} error
 */
export function isStaleChunkError(error) {
  if (!error) return false
  const message = String(error?.message || error)
  const name = String(error?.name || '')
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Failed to fetch') ||
    message.includes('Load failed') ||
    message.includes('Loading chunk') ||
    message.includes('Unable to preload CSS') ||
    message.includes("Unexpected token '<'") ||
    message.includes('Expected a JavaScript-or-Wasm module script') ||
    message.includes('MIME type') ||
    name === 'ChunkLoadError'
  )
}

function markShellResetIntent() {
  try {
    localStorage.setItem(SHELL_RESET_KEY, '1')
    localStorage.setItem(SKIP_SW_ONCE_KEY, '1')
  } catch {
    // Private mode / quota — recovery can still attempt SW purge.
  }
}

/**
 * At most one controlled recovery per tab session (unless force).
 * Credentials and journey progress in localStorage / IndexedDB are kept.
 *
 * @returns {Promise<{ recovered: boolean, reloading: boolean }>}
 */
export async function recoverStaleClient({ force = false, reason = 'stale-shell' } = {}) {
  if (typeof window === 'undefined') {
    return { recovered: false, reloading: false }
  }

  const guard = sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)
  if (guard && !force) {
    return { recovered: false, reloading: false }
  }

  sessionStorage.setItem(CHUNK_RECOVERY_GUARD_KEY, reason || '1')
  markShellResetIntent()
  showUpdatingOverlay('Updating ChronoWalk…')

  try {
    await clearAllCaches()
    await unregisterAllServiceWorkers()
    // Critical on iOS: do not navigate while the old SW still controls this tab.
    await waitForServiceWorkerControllerGone(2500)
    await new Promise((resolve) => window.setTimeout(resolve, 200))
  } catch {
    // Still reload — a hard navigation often picks up the new deploy.
  }

  // Escape via the static reset page (denylisted from SPA navigation fallback)
  // so a still-controlling service worker cannot re-serve poisoned HTML.
  hardReload({ path: '/reset-shell.html' })
  return { recovered: true, reloading: true }
}

/**
 * Clear the one-shot chunk-recovery guard after a successful boot past recovery.
 */
export function clearChunkRecoveryGuard() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(CHUNK_RECOVERY_GUARD_KEY)
}

/** Clear the mid-boot crash sentinel once React has mounted successfully. */
export function clearBootPending() {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(BOOT_PENDING_KEY)
}

/**
 * After a successful React mount, drop the one-boot SW skip flag so later
 * visits can register the service worker normally.
 */
export function clearSkipSwOnce() {
  try {
    localStorage.removeItem(SKIP_SW_ONCE_KEY)
  } catch {
    // ignore
  }
}

/**
 * True when this boot should not register a service worker (post-recovery).
 * Consumes nothing — clearSkipSwOnce runs after a successful mount.
 */
export function shouldSkipServiceWorkerRegistration() {
  try {
    return localStorage.getItem(SKIP_SW_ONCE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Call at the very start of main.jsx. If the previous paint never finished
 * (tab crashed / white-screened mid-boot), purge the PWA shell once.
 * Returns true when a recovery reload was started.
 */
export function recoverInterruptedBoot() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }

  const pending = sessionStorage.getItem(BOOT_PENDING_KEY)
  if (pending === '1') {
    // Previous boot never cleared the sentinel — treat as a poisoned shell.
    sessionStorage.removeItem(BOOT_PENDING_KEY)
    void recoverStaleClient({ force: true, reason: 'interrupted-boot' })
    return true
  }

  sessionStorage.setItem(BOOT_PENDING_KEY, '1')
  return false
}
