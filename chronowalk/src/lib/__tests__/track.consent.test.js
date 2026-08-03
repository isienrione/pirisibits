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

describe('product analytics (immediate init)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    posthogMock.init.mockImplementation((_key, options) => {
      options?.loaded?.(posthogMock)
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('inits PostHog immediately without marketing consent', async () => {
    const { initAnalytics, getAnalyticsConsent, isAnalyticsReady } = await import('../track.js')
    initAnalytics()
    expect(getAnalyticsConsent()).toBeNull()
    expect(isAnalyticsReady()).toBe(true)
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
    expect(posthogMock.init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: 'https://eu.i.posthog.com',
        person_profiles: 'always',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        rageclick: true,
        disable_session_recording: false,
        persistence: 'localStorage+cookie',
        session_recording: expect.objectContaining({
          maskAllInputs: false,
          maskTextSelector: '[data-ph-mask]',
          recordCrossOriginIframes: false,
        }),
      }),
    )
    expect(posthogMock.register).toHaveBeenCalledWith(
      expect.objectContaining({
        app_version: expect.any(String),
        is_pwa: expect.any(Boolean),
        is_ios: expect.any(Boolean),
        connection_type: expect.any(String),
      }),
    )
  })

  it('still captures when marketing cookies are declined', async () => {
    const { initAnalytics, setAnalyticsConsent, track, TRACK_EVENTS } = await import('../track.js')
    setAnalyticsConsent(false)
    initAnalytics()
    expect(localStorage.getItem('cw_marketing_consent')).toBe('declined')
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
    expect(track(TRACK_EVENTS.LANDING_VIEW)).toBe(true)
    expect(posthogMock.capture).toHaveBeenCalled()
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled()
  })

  it('initializes exactly once', async () => {
    const { initAnalytics } = await import('../track.js')
    initAnalytics()
    initAnalytics()
    expect(posthogMock.init).toHaveBeenCalledTimes(1)
  })

  it('does not call opt_in/opt_out when marketing preference changes', async () => {
    const { initAnalytics, setAnalyticsConsent } = await import('../track.js')
    initAnalytics()
    setAnalyticsConsent(true)
    setAnalyticsConsent(false)
    setAnalyticsConsent(true)
    expect(posthogMock.opt_out_capturing).not.toHaveBeenCalled()
    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled()
  })

  it('never breaks when PostHog key is missing', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    const { initAnalytics, track, TRACK_EVENTS, isAnalyticsReady } = await import('../track.js')
    initAnalytics()
    expect(posthogMock.init).not.toHaveBeenCalled()
    expect(isAnalyticsReady()).toBe(false)
    expect(() => track(TRACK_EVENTS.CHECKOUT_OPEN, { tier: 'rome-complete' })).not.toThrow()
  })

  it('never breaks when PostHog init throws', async () => {
    posthogMock.init.mockImplementationOnce(() => {
      throw new Error('blocked')
    })
    const { initAnalytics, track, TRACK_EVENTS, isAnalyticsReady } = await import('../track.js')
    expect(() => initAnalytics()).not.toThrow()
    expect(isAnalyticsReady()).toBe(false)
    expect(() => track(TRACK_EVENTS.LANDING_VIEW)).not.toThrow()
    expect(posthogMock.capture).not.toHaveBeenCalled()
  })

  it('does not capture sensitive purchase/access identifiers', async () => {
    const { initAnalytics, track, TRACK_EVENTS } = await import('../track.js')
    initAnalytics()
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

  it('notifies subscribers on marketing preference changes', async () => {
    const { setAnalyticsConsent, subscribeAnalyticsConsent } = await import('../track.js')
    const listener = vi.fn()
    const unsubscribe = subscribeAnalyticsConsent(listener)
    setAnalyticsConsent(true)
    setAnalyticsConsent(false)
    expect(listener).toHaveBeenCalledWith('accepted')
    expect(listener).toHaveBeenCalledWith('declined')
    unsubscribe()
  })

  it('migrates legacy cw_analytics_consent into marketing preference', async () => {
    localStorage.setItem('cw_analytics_consent', 'declined')
    const { getAnalyticsConsent } = await import('../track.js')
    expect(getAnalyticsConsent()).toBe('declined')
    expect(localStorage.getItem('cw_marketing_consent')).toBe('declined')
  })
})
