import {
  broadcastForceReload,
  hardReload,
  purgeAllPwaCaches,
  showUpdatingOverlay,
  unregisterAllServiceWorkers,
} from './pwaCacheUtils.js'

const BUILD_STORAGE_KEY = 'cw-app-build'
const SW_SCRIPT_STORAGE_KEY = 'cw-sw-script-url'
const MIGRATION_ATTEMPT_KEY = 'cw-build-migration'

function getServiceWorkerScriptUrl(registration) {
  const worker = registration?.active ?? registration?.waiting ?? registration?.installing
  return worker?.scriptURL ?? null
}

async function fetchServiceWorkerBuildMarker() {
  if (typeof fetch === 'undefined') return null

  try {
    const response = await fetch(`/sw.js?check=${Date.now()}`, {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response.ok) return null
    const source = await response.text()
    const match = source.match(/chronowalk-([a-f0-9]+)/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

async function waitForServiceWorkerRegistration(timeoutMs = 4000) {
  if (!('serviceWorker' in navigator)) return null

  try {
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((resolve) => {
        window.setTimeout(resolve, timeoutMs)
      }),
    ])
  } catch {
    // ready can reject when SW registration fails.
  }

  return navigator.serviceWorker.getRegistration()
}

function shouldMigrate({
  buildId,
  storedBuild,
  storedSwUrl,
  currentSwUrl,
  swBuildMarker,
  hasWaitingWorker,
}) {
  if (storedBuild !== buildId) return true
  if (swBuildMarker && swBuildMarker !== buildId) return true
  if (storedSwUrl && currentSwUrl && storedSwUrl !== currentSwUrl) return true
  if (hasWaitingWorker) return true
  return false
}

async function runBuildMigration(buildId) {
  showUpdatingOverlay()
  broadcastForceReload()
  await purgeAllPwaCaches()
  await unregisterAllServiceWorkers()

  try {
    localStorage.setItem(BUILD_STORAGE_KEY, buildId)
    localStorage.removeItem(SW_SCRIPT_STORAGE_KEY)
  } catch {
    // Ignore storage failures in private mode.
  }

  hardReload()
}

/**
 * Runs on every production load. localStorage build id alone is not enough on
 * Chrome — the active service worker can still serve an old precache manifest.
 */
export async function ensureFreshBuild({ buildId = __APP_BUILD_ID__ } = {}) {
  if (!import.meta.env.PROD || typeof window === 'undefined') {
    return { migrating: false }
  }

  const migrationAttempt = sessionStorage.getItem(MIGRATION_ATTEMPT_KEY)
  if (migrationAttempt === buildId) {
    try {
      localStorage.setItem(BUILD_STORAGE_KEY, buildId)
    } catch {
      // ignore
    }
    return { migrating: false }
  }

  const registration = await waitForServiceWorkerRegistration()
  if (registration) {
    await registration.update()
  }

  const storedBuild = localStorage.getItem(BUILD_STORAGE_KEY)
  const storedSwUrl = localStorage.getItem(SW_SCRIPT_STORAGE_KEY)
  const currentSwUrl = getServiceWorkerScriptUrl(registration)
  const swBuildMarker = await fetchServiceWorkerBuildMarker()

  const migrate = shouldMigrate({
    buildId,
    storedBuild,
    storedSwUrl,
    currentSwUrl,
    swBuildMarker,
    hasWaitingWorker: Boolean(registration?.waiting),
  })

  if (!migrate) {
    try {
      localStorage.setItem(BUILD_STORAGE_KEY, buildId)
      if (currentSwUrl) localStorage.setItem(SW_SCRIPT_STORAGE_KEY, currentSwUrl)
    } catch {
      // ignore
    }
    return { migrating: false }
  }

  sessionStorage.setItem(MIGRATION_ATTEMPT_KEY, buildId)
  await runBuildMigration(buildId)
  return { migrating: true }
}
