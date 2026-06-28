import { describe, expect, it, vi } from 'vitest'
import { registerAppServiceWorker } from '../registerAppServiceWorker'

describe('registerAppServiceWorker', () => {
  it('does not register a service worker outside production', () => {
    const registerSW = vi.fn()
    const controller = registerAppServiceWorker(registerSW, { isProd: false })

    expect(registerSW).not.toHaveBeenCalled()
    expect(() => controller.applyUpdate()).not.toThrow()
  })

  it('registers the service worker and exposes update hooks in production', () => {
    let onNeedRefresh
    const updateSW = vi.fn()
    const registerSW = vi.fn((options) => {
      onNeedRefresh = options.onNeedRefresh
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
      })
    )
    expect(listener).toHaveBeenCalledTimes(1)

    controller.applyUpdate()
    expect(updateSW).toHaveBeenCalledWith(true)
  })
})
