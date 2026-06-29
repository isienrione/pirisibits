import { lazy } from 'react'

const RELOAD_GUARD_KEY = 'cw-chunk-reload'

export function recoverDynamicImport(error, label = 'view') {
  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed') ||
    error?.name === 'ChunkLoadError'

  if (isChunkError && typeof sessionStorage !== 'undefined') {
    const guard = sessionStorage.getItem(RELOAD_GUARD_KEY)
    if (!guard) {
      sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
      window.location.reload()
      return { reloading: true }
    }
    sessionStorage.removeItem(RELOAD_GUARD_KEY)
  }

  console.error(`Failed to load ${label}:`, error)
  return { reloading: false, error }
}

/**
 * Wrap dynamic imports so a stale PWA cache (404 on old hashed chunks) self-heals
 * with one hard reload instead of leaving the user on a blank screen.
 */
export function lazyWithRecovery(importFn, label = 'view') {
  return lazy(() =>
    importFn().catch((error) => {
      const result = recoverDynamicImport(error, label)
      if (result.reloading) {
        return new Promise(() => {})
      }
      throw result.error ?? error
    })
  )
}
