import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_out_capturing: vi.fn(),
  opt_in_capturing: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))

vi.mock('../host.js', () => ({ getHost: () => null }))
vi.mock('../config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({ peekLandingExpHero: () => null }))

describe('analytics consent', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not init PostHog until the traveler accepts', async () => {
    const { initAnalytics, getAnalyticsConsent } = await import('../track.js')
    initAnalytics()
    expect(posthogMock.init).not.toHaveBeenCalled()
    expect(getAnalyticsConsent()).toBeNull()
  })

  it('inits after setAnalyticsConsent(true)', async () => {
    const { initAnalytics, setAnalyticsConsent } = await import('../track.js')
    initAnalytics()
    setAnalyticsConsent(true)
    expect(localStorage.getItem('cw_analytics_consent')).toBe('accepted')
    expect(posthogMock.init).toHaveBeenCalled()
  })

  it('stays off when declined', async () => {
    const { initAnalytics, setAnalyticsConsent } = await import('../track.js')
    setAnalyticsConsent(false)
    initAnalytics()
    expect(localStorage.getItem('cw_analytics_consent')).toBe('declined')
    expect(posthogMock.init).not.toHaveBeenCalled()
  })
})
