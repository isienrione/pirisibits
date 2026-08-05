export {
  getCapacitorGlobal,
  isNativePlatform,
  isNativeIOS,
  isWebPlatform,
  getPlatformName,
  getAppRuntime,
} from './platformRuntime.js'

export {
  getAppCapabilities,
  canRegisterServiceWorker,
  canOfferPwaInstall,
  canUseWebCheckout,
  canUseBrowserShellRecovery,
} from './capabilities.js'

export { bootstrapNativeShell } from './bootstrapNativeShell.js'
