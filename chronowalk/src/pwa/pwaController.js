import { registerSW } from 'virtual:pwa-register'
import { ensureFreshBuildAsync } from './ensureFreshBuild.js'
import { registerAppServiceWorker } from './registerAppServiceWorker.js'

function syncAppHeight() {
  if (typeof window === 'undefined') return
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
}

if (typeof window !== 'undefined') {
  syncAppHeight()
  window.addEventListener('resize', syncAppHeight)
  window.visualViewport?.addEventListener('resize', syncAppHeight)
}

const devStub = registerAppServiceWorker(registerSW, { isProd: false })

/** Resolves once build migration (if any) has finished and the SW controller is ready. */
export const pwaReady = (async () => {
  if (typeof window === 'undefined') return devStub

  const isMigrating = await ensureFreshBuildAsync()
  if (isMigrating) return devStub

  return registerAppServiceWorker(registerSW)
})()

export let pwaController = devStub

void pwaReady.then((controller) => {
  pwaController = controller
})
