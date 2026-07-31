import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))
vi.mock('../../lib/host.js', () => ({ getHost: () => null }))
vi.mock('../../lib/config.js', () => ({ getAbVariantCents: () => 1499 }))

describe('landing_view after analytics consent', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not count a landing_view before consent, then sends exactly one after accept', async () => {
    const trackMod = await import('../../lib/track.js')
    const landing = await import('../landingAnalytics.js')
    landing.resetLandingAnalyticsForTests()

    expect(landing.trackLandingView()).toBe(false)
    expect(posthogMock.capture).not.toHaveBeenCalled()

    trackMod.setAnalyticsConsent(true)
    expect(landing.trackLandingView()).toBe(true)
    expect(landing.trackLandingView()).toBe(false)

    const views = posthogMock.capture.mock.calls.filter(([event]) => event === 'landing_view')
    expect(views).toHaveLength(1)
  })

  it('sends a normal landing_view for an already-accepted visitor without duplication', async () => {
    localStorage.setItem('cw_analytics_consent', 'accepted')
    const trackMod = await import('../../lib/track.js')
    const landing = await import('../landingAnalytics.js')
    landing.resetLandingAnalyticsForTests()

    trackMod.initAnalytics()
    expect(landing.trackLandingView()).toBe(true)
    expect(landing.trackLandingView()).toBe(false)
    expect(posthogMock.capture.mock.calls.filter(([event]) => event === 'landing_view')).toHaveLength(
      1,
    )
  })
})
