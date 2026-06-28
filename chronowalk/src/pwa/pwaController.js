import { registerSW } from 'virtual:pwa-register'
import { registerAppServiceWorker } from './registerAppServiceWorker'

export const pwaController = registerAppServiceWorker(registerSW)
