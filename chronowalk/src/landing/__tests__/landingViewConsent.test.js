import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  register: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))
vi.mock('../../lib/host.js', () => ({ getHost: () => null }))
vi.mock('../../lib/config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({
  peekLandingExpHero: () => null,
  ensureLandingExpHero: () => null,
}))

describe('landing_view with immediate analytics', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    posthogMock.init.mockImplementation((_key, options) => {
      options?.loaded?.(posthogMock)
    })
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sends landing_view after init without waiting for marketing consent', async () => {
    const trackMod = await import('../../lib/track.js')
    const landing = await import('../landingAnalytics.js')
    landing.resetLandingAnalyticsForTests()

    trackMod.initAnalytics()
    expect(landing.trackLandingView()).toBe(true)
    expect(landing.trackLandingView()).toBe(false)

    const views = posthogMock.capture.mock.calls.filter(([event]) => event === 'landing_view')
    expect(views).toHaveLength(1)
  })

  it('still sends landing_view when marketing cookies were declined', async () => {
    localStorage.setItem('cw_marketing_consent', 'declined')
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
