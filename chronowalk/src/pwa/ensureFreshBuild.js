import { clearAllCaches, unregisterAllServiceWorkers } from './pwaCacheUtils.js'

export const BUILD_STORAGE_KEY = 'cw-app-build'
export const BUILD_RELOAD_GUARD_KEY = 'cw-build-migration-reload'

/**
 * When a new deploy ships, iOS standalone PWAs can keep serving old JS from Cache Storage
 * even after the service worker updates. Compare the baked-in build id to localStorage and,
 * on mismatch, wipe caches + unregister SWs then reload once.
 *
 * @returns {boolean} true when a migration reload was started (caller should skip SW registration)
 */
export function ensureFreshBuild(currentBuildId = __APP_BUILD_ID__) {
  if (typeof window === 'undefined' || !currentBuildId) return false

  if (sessionStorage.getItem(BUILD_RELOAD_GUARD_KEY)) {
    sessionStorage.removeItem(BUILD_RELOAD_GUARD_KEY)
    localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId)
    return false
  }

  const storedBuild = localStorage.getItem(BUILD_STORAGE_KEY)
  if (!storedBuild) {
    localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId)
    return false
  }

  if (storedBuild === currentBuildId) return false

  void runBuildMigration(currentBuildId)
  return true
}

async function runBuildMigration(currentBuildId) {
  await clearAllCaches()
  await unregisterAllServiceWorkers()
  localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId)
  sessionStorage.setItem(BUILD_RELOAD_GUARD_KEY, '1')
  window.location.reload()
}
