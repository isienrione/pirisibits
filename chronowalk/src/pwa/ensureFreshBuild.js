import { clearAllCaches, hardReload, unregisterAllServiceWorkers } from './pwaCacheUtils.js'
import { fetchWithTimeout } from './fetchWithTimeout.js'

export const BUILD_STORAGE_KEY = 'cw-app-build'
export const BUILD_RELOAD_GUARD_KEY = 'cw-build-migration-reload'

/**
 * Parse the deploy build id embedded in the live /sw.js response.
 * @param {string} swSource
 */
export function parseBuildIdFromSwSource(swSource) {
  if (!swSource) return null
  const match =
    swSource.match(/prefix:\s*["']chronowalk-([^"']+)["']/) ??
    swSource.match(/chronowalk-([a-f0-9]{7,40})/i)
  return match?.[1] ?? null
}

/**
 * @param {string} [currentBuildId]
 */
export async function fetchDeployedBuildId(currentBuildId = __APP_BUILD_ID__) {
  if (typeof fetch === 'undefined') return null
  try {
    const response = await fetchWithTimeout(`/sw.js?_=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response?.ok) return null
    const source = await response.text()
    return parseBuildIdFromSwSource(source) ?? currentBuildId
  } catch {
    return null
  }
}

/**
 * When a new deploy ships, installed PWAs can keep serving old JS from Cache Storage
 * even when localStorage already has the new build id. Compare the baked-in build id
 * to localStorage and, on mismatch, wipe caches + unregister SWs then reload once.
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

/**
 * Also compare the running bundle to the build id served by /sw.js on the network.
 * Catches clients whose localStorage matches but JS is still stale.
 *
 * @returns {Promise<boolean>}
 */
export async function ensureFreshBuildAsync(currentBuildId = __APP_BUILD_ID__) {
  if (ensureFreshBuild(currentBuildId)) return true

  const deployedBuildId = await fetchDeployedBuildId(currentBuildId)
  if (!deployedBuildId || deployedBuildId === currentBuildId) return false

  await runBuildMigration(deployedBuildId)
  return true
}

async function runBuildMigration(currentBuildId) {
  await clearAllCaches()
  await unregisterAllServiceWorkers()
  localStorage.setItem(BUILD_STORAGE_KEY, currentBuildId)
  sessionStorage.setItem(BUILD_RELOAD_GUARD_KEY, '1')
  hardReload({ path: '/rome/reset-shell.html' })
}
