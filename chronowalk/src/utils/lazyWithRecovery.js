import { lazy } from 'react'
import {
  CHUNK_RECOVERY_GUARD_KEY,
  clearChunkRecoveryGuard,
  isStaleChunkError,
  recoverStaleClient,
} from '../pwa/staleChunkRecovery.js'

export { clearChunkRecoveryGuard, isStaleChunkError, recoverStaleClient }

export function recoverDynamicImport(error, label = 'view') {
  if (isStaleChunkError(error) && typeof sessionStorage !== 'undefined') {
    const guard = sessionStorage.getItem(CHUNK_RECOVERY_GUARD_KEY)
    if (!guard) {
      // Controlled one-shot: purge SW caches (not credentials) and reload.
      void recoverStaleClient()
      return { reloading: true }
    }
    sessionStorage.removeItem(CHUNK_RECOVERY_GUARD_KEY)
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
      .catch((error) => {
        const result = recoverDynamicImport(error, label)
        if (result.reloading) {
          return new Promise(() => {})
        }
        throw result.error ?? error
      }),
  )
}
