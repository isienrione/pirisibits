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
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
    expect(posthogMock.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        persistence: 'localStorage',
      }),
    )
  })

  it('stays off when declined', async () => {
    const { initAnalytics, setAnalyticsConsent, track, TRACK_EVENTS } = await import('../track.js')
    setAnalyticsConsent(false)
    initAnalytics()
    track(TRACK_EVENTS.LANDING_VIEW)
    expect(localStorage.getItem('cw_analytics_consent')).toBe('declined')
    expect(posthogMock.init).not.toHaveBeenCalled()
    expect(posthogMock.capture).not.toHaveBeenCalled()
  })

  it('initializes exactly once after consent and on boot for accepted users', async () => {
    const { initAnalytics, setAnalyticsConsent } = await import('../track.js')
    setAnalyticsConsent(true)
    initAnalytics()
    initAnalytics()
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
  })

  it('opts out immediately on withdrawal and opts in again on re-consent', async () => {
    const { setAnalyticsConsent } = await import('../track.js')
    setAnalyticsConsent(true)
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
    setAnalyticsConsent(false)
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1)
    setAnalyticsConsent(true)
    expect(posthogMock.opt_in_capturing).toHaveBeenCalled()
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
  })

  it('never breaks when PostHog key is missing', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    const { initAnalytics, setAnalyticsConsent, track, TRACK_EVENTS } = await import('../track.js')
    setAnalyticsConsent(true)
    initAnalytics()
    expect(posthogMock.init).not.toHaveBeenCalled()
    expect(() => track(TRACK_EVENTS.CHECKOUT_OPEN, { tier: 'rome-complete' })).not.toThrow()
  })

  it('never breaks when PostHog init throws', async () => {
    posthogMock.init.mockImplementationOnce(() => {
      throw new Error('blocked')
    })
    const { setAnalyticsConsent, track, TRACK_EVENTS, isAnalyticsReady } = await import('../track.js')
    expect(() => setAnalyticsConsent(true)).not.toThrow()
    expect(isAnalyticsReady()).toBe(false)
    expect(() => track(TRACK_EVENTS.LANDING_VIEW)).not.toThrow()
    expect(posthogMock.capture).not.toHaveBeenCalled()
  })

  it('does not capture sensitive purchase/access identifiers', async () => {
    const { setAnalyticsConsent, track, TRACK_EVENTS } = await import('../track.js')
    setAnalyticsConsent(true)
    track(TRACK_EVENTS.CHECKOUT_OPEN, {
      tier: 'rome-complete',
      price_cents: 1499,
    })
    const [, props] = posthogMock.capture.mock.calls[0]
    expect(props).not.toHaveProperty('email')
    expect(props).not.toHaveProperty('access_token')
    expect(props).not.toHaveProperty('invite')
    expect(props).not.toHaveProperty('device_id')
    expect(props).not.toHaveProperty('order_id')
    expect(props).toMatchObject({ tier: 'rome-complete', price_cents: 1499 })
  })

  it('notifies subscribers on consent changes', async () => {
    const { setAnalyticsConsent, subscribeAnalyticsConsent } = await import('../track.js')
    const listener = vi.fn()
    const unsubscribe = subscribeAnalyticsConsent(listener)
    setAnalyticsConsent(true)
    setAnalyticsConsent(false)
    expect(listener).toHaveBeenCalledWith('accepted')
    expect(listener).toHaveBeenCalledWith('declined')
    unsubscribe()
  })
})
