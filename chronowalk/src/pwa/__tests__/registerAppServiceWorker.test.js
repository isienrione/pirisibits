import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  broadcastForceReload,
  hardReload,
  isChromeBrowser,
  listenForForceReload,
  nudgeWaitingServiceWorker,
  purgeAllPwaCaches,
  showUpdatingOverlay,
  unregisterAllServiceWorkers,
} from '../pwaCacheUtils.js'
import { registerAppServiceWorker } from '../registerAppServiceWorker'

vi.mock('../pwaCacheUtils.js', () => ({
  broadcastForceReload: vi.fn(),
  hardReload: vi.fn(),
  isChromeBrowser: vi.fn(() => false),
  listenForForceReload: vi.fn(() => () => {}),
  nudgeWaitingServiceWorker: vi.fn(async () => {}),
  purgeAllPwaCaches: vi.fn(async () => {}),
  showUpdatingOverlay: vi.fn(),
  unregisterAllServiceWorkers: vi.fn(async () => {}),
}))

describe('registerAppServiceWorker', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('does not register a service worker outside production', () => {
    const registerSW = vi.fn()
    const controller = registerAppServiceWorker(registerSW, { isProd: false })

    expect(registerSW).not.toHaveBeenCalled()
    expect(() => controller.applyUpdate()).not.toThrow()
  })

  it('does not register a service worker inside the Capacitor native shell', () => {
    vi.stubGlobal('window', {
      ...window,
      Capacitor: {
        isNativePlatform: () => true,
        getPlatform: () => 'ios',
      },
    })
    const registerSW = vi.fn()
    const controller = registerAppServiceWorker(registerSW, { isProd: true })

    expect(registerSW).not.toHaveBeenCalled()
    expect(() => controller.applyUpdate()).not.toThrow()
  })

  it('registers the service worker and exposes update hooks in production', () => {
    let onNeedRefresh
    let onNeedReload
    const updateSW = vi.fn()
    const registerSW = vi.fn((options) => {
      onNeedRefresh = options.onNeedRefresh
      onNeedReload = options.onNeedReload
      return updateSW
    })

    const controller = registerAppServiceWorker(registerSW, { isProd: true })
    const listener = vi.fn()

    controller.onNeedRefresh(listener)
    onNeedRefresh()

    expect(registerSW).toHaveBeenCalledWith(
      expect.objectContaining({
        immediate: true,
        onNeedRefresh: expect.any(Function),
        onNeedReload: expect.any(Function),
        onOfflineReady: expect.any(Function),
      })
    )
    expect(listener).toHaveBeenCalledTimes(1)
    expect(updateSW).not.toHaveBeenCalled()

    // Ambient SW activate must show toast — never hardReload.
    onNeedReload()
    expect(listener).toHaveBeenCalledTimes(2)
    expect(hardReload).not.toHaveBeenCalled()

    controller.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
  })

  it('reloads on onNeedReload only after the traveler accepts an update', () => {
    let onNeedReload
    const updateSW = vi.fn()
    const registerSW = vi.fn((options) => {
      onNeedReload = options.onNeedReload
      return updateSW
    })

    const controller = registerAppServiceWorker(registerSW, { isProd: true })
    controller.applyUpdate()
    onNeedReload()

    expect(hardReload).toHaveBeenCalled()
  })

  describe('checkForAppUpdate', () => {
    beforeEach(() => {
      vi.mocked(isChromeBrowser).mockReturnValue(false)
    })

    it('purges caches before checking for a service worker update', async () => {
      const update = vi.fn().mockResolvedValue(undefined)
      const registerSW = vi.fn(() => vi.fn())
      vi.stubGlobal('navigator', {
        serviceWorker: {
          addEventListener: vi.fn(),
          getRegistration: vi.fn().mockResolvedValue({ update }),
        },
      })

      const controller = registerAppServiceWorker(registerSW, { isProd: true })
      await controller.checkForAppUpdate()

      expect(showUpdatingOverlay).toHaveBeenCalledWith('Refreshing…')
      expect(purgeAllPwaCaches).toHaveBeenCalled()
      expect(unregisterAllServiceWorkers).toHaveBeenCalled()
      expect(update).toHaveBeenCalled()
      expect(broadcastForceReload).not.toHaveBeenCalled()
    })

    it('uses the Chrome hard-reload path after purging caches', async () => {
      vi.mocked(isChromeBrowser).mockReturnValue(true)
      const registerSW = vi.fn(() => vi.fn())
      vi.stubGlobal('navigator', {
        serviceWorker: {
          addEventListener: vi.fn(),
          getRegistration: vi.fn().mockResolvedValue({ update: vi.fn() }),
        },
      })

      const controller = registerAppServiceWorker(registerSW, { isProd: true })
      await controller.checkForAppUpdate()

      expect(purgeAllPwaCaches).toHaveBeenCalled()
      expect(unregisterAllServiceWorkers).toHaveBeenCalled()
      expect(broadcastForceReload).toHaveBeenCalled()
      expect(hardReload).toHaveBeenCalled()
    })
  })
})
