import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isNativePlatform,
  isNativeIOS,
  isWebPlatform,
  getPlatformName,
  getAppRuntime,
  getAppCapabilities,
  canRegisterServiceWorker,
  canOfferPwaInstall,
  canUseWebCheckout,
  canUseBrowserShellRecovery,
} from '../index.js'
import { registerAppServiceWorker } from '../../../pwa/registerAppServiceWorker.js'
import { startPwaRegistration, SERVICE_WORKER_BOOT_DISABLED } from '../../../pwa/pwaController.js'
import { shouldOfferPwaInstall } from '../../../utils/pwaInstall.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '../../../..')

function stubCapacitor({ native = false, platform = 'web' } = {}) {
  vi.stubGlobal('window', {
    Capacitor: {
      isNativePlatform: () => native,
      getPlatform: () => platform,
      isNative: native,
    },
  })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  // jsdom provides window; clear Capacitor between tests.
  if (typeof window !== 'undefined') {
    delete window.Capacitor
  }
})

describe('web is the default runtime', () => {
  it('treats missing Capacitor as web', () => {
    expect(isNativePlatform()).toBe(false)
    expect(isWebPlatform()).toBe(true)
    expect(getPlatformName()).toBe('web')
    expect(getAppRuntime()).toMatchObject({
      platform: 'web',
      isNative: false,
      isNativeIOS: false,
      isWeb: true,
      hasCapacitor: false,
    })
  })

  it('fails safely when Capacitor methods throw', () => {
    vi.stubGlobal('window', {
      Capacitor: {
        isNativePlatform: () => {
          throw new Error('boom')
        },
        getPlatform: () => {
          throw new Error('boom')
        },
      },
    })
    expect(isNativePlatform()).toBe(false)
    expect(getPlatformName()).toBe('web')
  })
})

describe('Capacitor iOS detection', () => {
  it('detects native iOS correctly', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(isNativePlatform()).toBe(true)
    expect(isNativeIOS()).toBe(true)
    expect(isWebPlatform()).toBe(false)
    expect(getPlatformName()).toBe('ios')
    expect(getAppRuntime().isNativeIOS).toBe(true)
  })
})

describe('service worker registration guards', () => {
  it('native runtime skips service-worker registration', async () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(canRegisterServiceWorker()).toBe(false)
    expect(getAppCapabilities().serviceWorkerRegistration).toBe(false)

    const registerSW = vi.fn()
    const controller = registerAppServiceWorker(registerSW, { isProd: true })
    expect(registerSW).not.toHaveBeenCalled()
    expect(typeof controller.applyUpdate).toBe('function')

    // Even if the emergency boot flag is flipped, native still skips.
    expect(SERVICE_WORKER_BOOT_DISABLED).toBe(true)
    await startPwaRegistration()
    expect(registerSW).not.toHaveBeenCalled()
  })

  it('web runtime preserves service-worker registration path', () => {
    expect(canRegisterServiceWorker()).toBe(true)
    const registerSW = vi.fn(() => vi.fn())
    registerAppServiceWorker(registerSW, { isProd: true })
    expect(registerSW).toHaveBeenCalled()
  })
})

describe('browser-only capabilities', () => {
  it('marks PWA install unavailable on native iOS', () => {
    stubCapacitor({ native: true, platform: 'ios' })
    expect(canOfferPwaInstall()).toBe(false)
    expect(shouldOfferPwaInstall()).toBe(false)
    expect(getAppCapabilities().pwaInstall).toBe(false)
    expect(getAppCapabilities().addToHomeScreenHints).toBe(false)
    expect(canUseWebCheckout()).toBe(false)
    expect(canUseBrowserShellRecovery()).toBe(false)
  })

  it('keeps web checkout and install available on web', () => {
    expect(canOfferPwaInstall()).toBe(true)
    expect(canUseWebCheckout()).toBe(true)
    expect(canUseBrowserShellRecovery()).toBe(true)
  })
})

describe('capacitor config', () => {
  it('uses dist, com.chronowalk.app, and no production server.url', () => {
    const configPath = join(ROOT, 'capacitor.config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf8'))
    expect(config.appId).toBe('com.chronowalk.app')
    expect(config.appName).toBe('ChronoWalk')
    expect(config.webDir).toBe('dist')
    expect(config.ios?.path).toBe('native-review/ios')
    expect(config.server?.url).toBeUndefined()

    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
    expect(pkg.scripts.build).toBe('npm run generate:pwa-assets && vite build')
    expect(pkg.scripts.build).not.toMatch(/cap /)
    expect(pkg.scripts['ios:sync']).toMatch(/npm run build && npx cap sync ios/)
    expect(pkg.scripts['ios:copy']).toBe('npx cap copy ios')
    expect(pkg.scripts['ios:open']).toBe('npx cap open ios')
    expect(pkg.scripts['ios:doctor']).toBe('npx cap doctor')
  })
})
