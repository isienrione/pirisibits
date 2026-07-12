import { registerSW } from 'virtual:pwa-register'
import { ensureFreshBuildAsync } from './ensureFreshBuild.js'
import { ensureWalkingUiFresh } from './walkingUiMigration.js'
import { WALKING_UI_REVISION } from '../content/walkingUiRevision.js'
import { registerAppServiceWorker } from './registerAppServiceWorker.js'

const devStub = registerAppServiceWorker(registerSW, { isProd: false })

/** Resolves once build migration (if any) has finished and the SW controller is ready. */
export const pwaReady = (async () => {
  if (typeof window === 'undefined') return devStub

  const isMigrating = await ensureFreshBuildAsync()
  if (isMigrating) return devStub

  const walkingUiMigrating = await ensureWalkingUiFresh(WALKING_UI_REVISION)
  if (walkingUiMigrating) return devStub

  return registerAppServiceWorker(registerSW)
})()

export let pwaController = devStub

void pwaReady.then((controller) => {
  pwaController = controller
})
