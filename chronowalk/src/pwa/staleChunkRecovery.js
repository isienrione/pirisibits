/**
 * Client-side recovery when a deploy leaves hashed chunks unreachable or when
 * the service worker has cached SPA HTML under a JavaScript URL.
 *
 * Preserves localStorage / IndexedDB credentials and tour progress - only
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
/** localStorage - survives the recovery navigation; consumed by index.html. */
export const SHELL_RESET_KEY = 'cw-needs-shell-reset'
/** Skip SW registration for one successful network boot after a shell reset. */
export const SKIP_SW_ONCE_KEY = 'cw-skip-sw-once'
/** Timestamp of the last shell reset - used to break reset↔landing loops. */
export const SHELL_RESET_AT_KEY = 'cw-shell-reset-at'
/** Ignore further automatic resets within this window. */
export const SHELL_RESET_COOLDOWN_MS = 2 * 60 * 1000

/** localStorage key - keep in sync with audio/offlinePackage.js (avoid import cycles). */
const OFFLINE_STATUS_KEY = 'cw_offline_rome_audio_v1'

/**
 * True when a hard recovery navigation would likely hit Safari’s native
 * “can’t open without signal” interstitial (or interrupt an in-flight download).
 * Also defer when an offline package is already on-device - never wipe the SW
 * just because iOS lied about navigator.onLine during a brief background.
 */
export function shouldDeferStaleRecovery() {
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
    const raw = localStorage.getItem(OFFLINE_STATUS_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw)
    const status = parsed?.status
    return status === 'downloading' || status === 'complete'
  } catch {
    // Fail closed - better to keep a slightly stale shell than brick Safari offline.
    return true
  }
}

/**
 * @param {unknown} error
 */
export function isStaleChunkError(error) {
  if (!error) return false
  const message = String(error?.message || error)
  const name = String(error?.name || '')
  // Do NOT match bare "Failed to fetch" - that fires for Directions/Mapbox/audio
  // blips and used to hard-navigate into Safari’s offline interstitial.
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Unable to preload CSS') ||
    message.includes("Unexpected token '<'") ||
    message.includes('Expected a JavaScript-or-Wasm module script') ||
    message.includes('MIME type') ||
    // Safari dynamic-import wording (keep narrow - paired with shouldDeferStaleRecovery).
    (message === 'Load failed' || message.includes('Load failed for')) ||
    name === 'ChunkLoadError'
  )
}

export function readShellResetAt() {
  try {
    const raw = localStorage.getItem(SHELL_RESET_AT_KEY)
    const value = Number(raw)
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function recentlyResetShell(now = Date.now()) {
  const last = readShellResetAt()
  return last > 0 && now - last < SHELL_RESET_COOLDOWN_MS
}

export function markShellResetCompleted(now = Date.now()) {
  try {
    localStorage.setItem(SHELL_RESET_AT_KEY, String(now))
    localStorage.setItem(SKIP_SW_ONCE_KEY, '1')
    localStorage.removeItem(SHELL_RESET_KEY)
  } catch {
    // ignore
  }
}

function markShellResetIntent() {
  try {
    localStorage.setItem(SHELL_RESET_KEY, '1')
    localStorage.setItem(SKIP_SW_ONCE_KEY, '1')
  } catch {
    // Private mode / quota - recovery can still attempt SW purge.
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

  // Never navigate away while offline or mid package download - Safari shows
  // “can’t open this page without a signal” and aborts the Cache API work.
  if (!force && shouldDeferStaleRecovery()) {
    return { recovered: false, reloading: false }
  }

  // Break eternal reset-shell ↔ landing loops after a recent successful wipe.
  if (recentlyResetShell()) {
    if (!force) {
      return { recovered: false, reloading: false }
    }
    showUpdatingOverlay('Updating ChronoWalk…')
    hardReload({ path: '/landing' })
    return { recovered: true, reloading: true }
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
    // Still reload - a hard navigation often picks up the new deploy.
  }

  // Escape via the static reset page (denylisted from SPA navigation fallback)
  // so a still-controlling service worker cannot re-serve poisoned HTML.
  hardReload({ path: '/rome/reset-shell' })
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
 * visits can register the service worker normally - but not during cooldown.
 */
export function clearSkipSwOnce() {
  if (recentlyResetShell()) return
  try {
    localStorage.removeItem(SKIP_SW_ONCE_KEY)
  } catch {
    // ignore
  }
}

/**
 * True when this boot should not register a service worker (post-recovery).
 */
export function shouldSkipServiceWorkerRegistration() {
  try {
    return localStorage.getItem(SKIP_SW_ONCE_KEY) === '1' || recentlyResetShell()
  } catch {
    return false
  }
}

/**
 * Call at the very start of main.jsx. If the previous paint never finished
 * (tab crashed / white-screened mid-boot), record it - but always return false
 * so React still mounts. Blocking mount caused permanent "Loading ChronoWalk…".
 * @returns {false}
 */
export function recoverInterruptedBoot() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }

  const pending = sessionStorage.getItem(BOOT_PENDING_KEY)
  if (pending === '1') {
    sessionStorage.removeItem(BOOT_PENDING_KEY)
    // One background attempt only when we have not just reset the shell.
    if (!recentlyResetShell()) {
      void recoverStaleClient({ force: false, reason: 'interrupted-boot' })
    }
  }

  sessionStorage.setItem(BOOT_PENDING_KEY, '1')
  return false
}
