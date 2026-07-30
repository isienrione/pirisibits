import { registerSW } from 'virtual:pwa-register'
import { ensureFreshBuildAsync } from './ensureFreshBuild.js'
import { ensureWalkingUiFresh } from './walkingUiMigration.js'
import { WALKING_UI_REVISION } from '../content/walkingUiRevision.js'
import { registerAppServiceWorker } from './registerAppServiceWorker.js'
import { shouldSkipServiceWorkerRegistration } from './staleChunkRecovery.js'

const devStub = registerAppServiceWorker(registerSW, { isProd: false })

/**
 * EMERGENCY: do not register a service worker during boot.
 * Poisoned SW controllers on iOS Chrome were serving HTML for /assets/*.js,
 * which left travelers on "Loading ChronoWalk…" forever. Offline cache can
 * return after the app has mounted successfully.
 */
export const SERVICE_WORKER_BOOT_DISABLED = true

/** Resolves once optional SW registration has finished (or been skipped). */
export const pwaReady = Promise.resolve(devStub)

export let pwaController = devStub

/**
 * Call after React has mounted. Safe to call multiple times.
 * @returns {Promise<typeof devStub>}
 */
export async function startPwaRegistration() {
  if (typeof window === 'undefined') return devStub
  if (SERVICE_WORKER_BOOT_DISABLED) return devStub
  if (shouldSkipServiceWorkerRegistration()) return devStub

  const isMigrating = await ensureFreshBuildAsync()
  if (isMigrating) return devStub

  const walkingUiMigrating = await ensureWalkingUiFresh(WALKING_UI_REVISION)
  if (walkingUiMigrating) return devStub

  const controller = registerAppServiceWorker(registerSW)
  pwaController = controller
  return controller
}
