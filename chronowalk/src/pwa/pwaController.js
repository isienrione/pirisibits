import { registerSW } from 'virtual:pwa-register'
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

export const pwaController = registerAppServiceWorker(registerSW)
