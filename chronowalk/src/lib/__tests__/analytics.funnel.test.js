import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const posthogMock = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  register: vi.fn(),
}))

vi.mock('posthog-js', () => ({ default: posthogMock }))
vi.mock('../config.js', () => ({ getAbVariantCents: () => 1499 }))
vi.mock('../../landing/landingExperiments.js', () => ({
  peekLandingExpHero: () => 'control',
  ensureLandingExpHero: () => 'control',
}))
vi.mock('../../landing/landingIntent.js', () => ({
  resolveLandingIntent: () => 'rome',
}))

describe('landing funnel analytics', () => {
  beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    localStorage.clear()
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test')
    posthogMock.init.mockImplementation((_key, options) => {
      options?.loaded?.(posthogMock)
    })
    window.history.replaceState({}, '', '/?utm_source=reddit&gclid=abc')
    const { markAnalyticsReady, __resetAnalyticsSessionForTests } = await import('../analytics.ts')
    __resetAnalyticsSessionForTests()
    markAnalyticsReady(true)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('enriches events with base props including attribution', async () => {
    const { track } = await import('../analytics.ts')
    expect(track('pricing_view')).toBe(true)
    const [, props] = posthogMock.capture.mock.calls[0]
    expect(props).toMatchObject({
      ab_variant: 1499,
      landing_exp_hero: 'control',
      utm_source: 'reddit',
      gclid: 'abc',
      is_pwa: false,
      is_ios: expect.any(Boolean),
      seconds_since_landing: expect.any(Number),
      scroll_depth_pct: expect.any(Number),
      max_scroll_pct: expect.any(Number),
    })
    expect(props.max_scroll_pct).toBe(props.scroll_depth_pct)
  })

  it('fires pricing_view and tier views once', async () => {
    const { trackPricingView, trackTierCardView } = await import('../analytics.ts')
    expect(trackPricingView()).toBe(true)
    expect(trackPricingView()).toBe(false)
    expect(trackTierCardView('rome-complete')).toBe(true)
    expect(trackTierCardView('rome-complete')).toBe(false)
    expect(trackTierCardView('rome-essential')).toBe(true)
  })

  it('fires preview progress marks once each', async () => {
    const { notePreviewAudioTime } = await import('../analytics.ts')
    notePreviewAudioTime(10, 40, 'pantheon')
    notePreviewAudioTime(20, 40, 'pantheon')
    notePreviewAudioTime(30, 40, 'pantheon')
    notePreviewAudioTime(40, 40, 'pantheon')
    notePreviewAudioTime(40, 40, 'pantheon')
    const progress = posthogMock.capture.mock.calls.filter(([e]) => e === 'preview_audio_progress')
    expect(progress.map(([, p]) => p.pct)).toEqual([25, 50, 75, 100])
  })
})
