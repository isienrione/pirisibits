import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const sendSpy = vi.fn()

describe('analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('window', {
      ...globalThis.window,
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      setTimeout,
      clearTimeout,
    })
    sendSpy.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('no-ops track() when analytics key is absent', async () => {
    vi.doMock('../../config/env', () => ({
      env: { analyticsKey: '' },
    }))

    const { track, setAnalyticsSender, flushAnalytics } = await import('../analytics.js')
    setAnalyticsSender(sendSpy)
    track('landing_viewed')
    flushAnalytics()

    expect(sendSpy).not.toHaveBeenCalled()
  })

  it('forwards batched events when analytics key is configured', async () => {
    vi.doMock('../../config/env', () => ({
      env: { analyticsKey: 'test-key', analyticsEndpoint: '/api/analytics' },
    }))
    vi.doMock('../../utils/appPreferences', () => ({
      readAcquisitionSource: () => 'partner-blog',
      resolveAcquisitionSource: () => 'partner-blog',
    }))

    const { track, setAnalyticsSender, flushAnalytics } = await import('../analytics.js')
    setAnalyticsSender(sendSpy)

    track('preview_started', { step: 1 })
    flushAnalytics()

    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(sendSpy.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        event: 'preview_started',
        props: expect.objectContaining({
          step: 1,
          source: 'partner-blog',
        }),
      }),
    ])
  })
})
