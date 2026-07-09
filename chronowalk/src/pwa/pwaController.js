import { registerSW } from 'virtual:pwa-register'
import { ensureFreshBuild } from './ensureFreshBuild.js'
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

const isMigratingBuild = ensureFreshBuild()

export const pwaController = isMigratingBuild
  ? registerAppServiceWorker(registerSW, { isProd: false })
  : registerAppServiceWorker(registerSW)
