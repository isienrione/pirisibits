import { lazy } from 'react'
import {
  CHUNK_RECOVERY_GUARD_KEY,
  clearChunkRecoveryGuard,
  isStaleChunkError,
  recentlyResetShell,
  recoverStaleClient,
} from '../pwa/staleChunkRecovery.js'

export { clearChunkRecoveryGuard, isStaleChunkError, recoverStaleClient }

/**
 * @param {unknown} error
 * @param {string} [label]
 * @returns {Promise<{ reloading: boolean, error?: unknown }>}
 */
export async function recoverDynamicImport(error, label = 'view') {
  if (isStaleChunkError(error) && typeof sessionStorage !== 'undefined') {
    const guard = sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)
    if (!guard && !recentlyResetShell()) {
      const result = await recoverStaleClient({ reason: `lazy:${label}` })
      if (result?.reloading) {
        return { reloading: true }
      }
    } else if (guard) {
      sessionStorage.removeItem(CHUNK_RECOVERY_GUARD_KEY)
    }
  }

  console.error(`Failed to load ${label}:`, error)
  return { reloading: false, error }
}

/**
 * Wrap dynamic imports so a stale PWA cache (HTML poison / old hashed chunks)
 * self-heals with one recovery reload instead of leaving the user on a blank screen.
 */
export function lazyWithRecovery(importFn, label = 'view') {
  return lazy(() =>
    importFn()
      .then((mod) => {
        clearChunkRecoveryGuard()
        return mod
      })
      .catch(async (error) => {
        const result = await recoverDynamicImport(error, label)
        if (result.reloading) {
          // Only park Suspense when a navigation was actually started.
          return new Promise(() => {})
        }
        throw result.error ?? error
      }),
  )
}
