import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  register: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))

vi.mock('../host.js', () => ({ getHost: () => null }))
vi.mock('../config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({
  peekLandingExpHero: () => null,
  ensureLandingExpHero: () => null,
}))
vi.mock('../../landing/landingIntent.js', () => ({
  resolveLandingIntent: () => 'rome',
}))

describe('page lifecycle diagnostics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    window.localStorage.clear()
    vi.useFakeTimers()
    posthogMock.init.mockImplementation((_key, options) => {
      options?.loaded?.(posthogMock)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('fires page_reload_detected when navigation type is reload', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'reload' }])

    const {
      initAnalytics,
      installPageLifecycleDiagnostics,
      __resetPageLifecycleDiagnosticsForTests,
      TRACK_EVENTS,
    } = await import('../track.js')

    __resetPageLifecycleDiagnosticsForTests()
    initAnalytics()
    installPageLifecycleDiagnostics()
    await vi.runAllTimersAsync()

    expect(posthogMock.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_RELOAD_DETECTED,
      expect.objectContaining({ navigation_type: 'reload' }),
    )
  })

  it('fires page_unload on beforeunload and pagehide', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' }])

    const {
      initAnalytics,
      installPageLifecycleDiagnostics,
      __resetPageLifecycleDiagnosticsForTests,
      TRACK_EVENTS,
    } = await import('../track.js')

    __resetPageLifecycleDiagnosticsForTests()
    initAnalytics()
    installPageLifecycleDiagnostics()
    posthogMock.capture.mockClear()

    window.dispatchEvent(new Event('beforeunload'))
    expect(posthogMock.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_UNLOAD,
      expect.objectContaining({
        reason_hint: 'beforeunload',
        navigation_type: 'navigate',
      }),
    )

    posthogMock.capture.mockClear()
    window.dispatchEvent(new Event('pagehide'))
    expect(posthogMock.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_UNLOAD,
      expect.objectContaining({
        reason_hint: 'pagehide',
        navigation_type: 'navigate',
      }),
    )
  })
})
