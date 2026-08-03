import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}))

describe('page lifecycle diagnostics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    window.localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('fires page_reload_detected when navigation type is reload', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'reload' }])

    const posthog = (await import('posthog-js')).default
    const {
      setAnalyticsConsent,
      installPageLifecycleDiagnostics,
      __resetPageLifecycleDiagnosticsForTests,
      TRACK_EVENTS,
    } = await import('../track.js')

    __resetPageLifecycleDiagnosticsForTests()
    setAnalyticsConsent(true)
    installPageLifecycleDiagnostics()
    await vi.runAllTimersAsync()

    expect(posthog.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_RELOAD_DETECTED,
      expect.objectContaining({ navigation_type: 'reload' }),
    )
  })

  it('fires page_unload on beforeunload and pagehide', async () => {
    vi.spyOn(performance, 'getEntriesByType').mockReturnValue([{ type: 'navigate' }])

    const posthog = (await import('posthog-js')).default
    const {
      setAnalyticsConsent,
      installPageLifecycleDiagnostics,
      __resetPageLifecycleDiagnosticsForTests,
      TRACK_EVENTS,
    } = await import('../track.js')

    __resetPageLifecycleDiagnosticsForTests()
    setAnalyticsConsent(true)
    installPageLifecycleDiagnostics()
    posthog.capture.mockClear()

    window.dispatchEvent(new Event('beforeunload'))
    expect(posthog.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_UNLOAD,
      expect.objectContaining({
        reason_hint: 'beforeunload',
        navigation_type: 'navigate',
      }),
    )

    posthog.capture.mockClear()
    window.dispatchEvent(new Event('pagehide'))
    expect(posthog.capture).toHaveBeenCalledWith(
      TRACK_EVENTS.PAGE_UNLOAD,
      expect.objectContaining({
        reason_hint: 'pagehide',
        navigation_type: 'navigate',
      }),
    )
  })
})
