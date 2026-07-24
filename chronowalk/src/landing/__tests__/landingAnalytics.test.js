import { describe, expect, it, beforeEach, vi } from 'vitest'
import { TRACK_EVENTS } from '../../lib/track.js'
import {
  LANDING_ANALYTICS_SECTIONS,
  resetLandingAnalyticsForTests,
  trackLandingCheckoutOpen,
  trackLandingFaqOpen,
  trackLandingPricingCta,
  trackLandingPricingView,
  trackLandingPreviewCta,
  trackLandingRouteExpand,
  trackLandingRouteView,
  trackLandingRoutesCta,
  trackLandingThresholdStart,
  trackLandingView,
} from '../landingAnalytics.js'
import { resetLandingExperimentsForTests } from '../landingExperiments.js'

vi.mock('../../lib/track.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    track: vi.fn(),
    isAnalyticsReady: () => true,
  }
})

import { track } from '../../lib/track.js'

describe('landing conversion analytics', () => {
  beforeEach(() => {
    resetLandingAnalyticsForTests()
    resetLandingExperimentsForTests()
    window.history.replaceState({}, '', '/?landing_exp_hero=a')
    track.mockClear()
  })

  it('fires landing_view only once', () => {
    expect(trackLandingView()).toBe(true)
    expect(trackLandingView()).toBe(false)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_VIEW,
      expect.objectContaining({ source: 'landing', landing_exp_hero: 'a' }),
    )
  })

  it('includes section context on preview and routes CTAs', () => {
    trackLandingPreviewCta(LANDING_ANALYTICS_SECTIONS.HERO)
    trackLandingRoutesCta(LANDING_ANALYTICS_SECTIONS.FINAL_CTA)
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_CTA_PREVIEW,
      expect.objectContaining({ section: 'hero', preview: 'pantheon', landing_exp_hero: 'a' }),
    )
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_CTA_ROUTES,
      expect.objectContaining({ section: 'final-cta', target: 'pricing', landing_exp_hero: 'a' }),
    )
  })

  it('dedupes route and pricing section views', () => {
    expect(trackLandingRouteView()).toBe(true)
    expect(trackLandingRouteView()).toBe(false)
    expect(trackLandingPricingView()).toBe(true)
    expect(trackLandingPricingView()).toBe(false)
    expect(track).toHaveBeenCalledWith(TRACK_EVENTS.LANDING_ROUTE_VIEW, expect.any(Object))
    expect(track).toHaveBeenCalledWith(TRACK_EVENTS.LANDING_PRICING_VIEW, expect.any(Object))
  })

  it('tracks pricing CTA and checkout by product without sensitive fields', () => {
    trackLandingPricingCta('rome-complete')
    trackLandingCheckoutOpen({ tierId: 'rome-complete', priceCents: 1499 })
    const payloads = track.mock.calls.map(([, props]) => props)
    for (const props of payloads) {
      expect(props).not.toHaveProperty('email')
      expect(props).not.toHaveProperty('name')
      expect(props).not.toHaveProperty('card')
    }
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_CTA_BEGIN,
      expect.objectContaining({ tier: 'rome-complete', section: 'pricing' }),
    )
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.CHECKOUT_OPEN,
      expect.objectContaining({ tier: 'rome-complete', price_cents: 1499 }),
    )
  })

  it('tracks threshold start, route expand, and FAQ open', () => {
    trackLandingThresholdStart({ via: 'button' })
    trackLandingRouteExpand({ expanded: true })
    trackLandingFaqOpen({ questionId: 'offline', groupId: 'using-in-rome' })
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.THRESHOLD_DEMO,
      expect.objectContaining({ action: 'start', via: 'button', section: 'threshold' }),
    )
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_ROUTE_EXPAND,
      expect.objectContaining({ expanded: true }),
    )
    expect(track).toHaveBeenCalledWith(
      TRACK_EVENTS.LANDING_FAQ_OPEN,
      expect.objectContaining({ question_id: 'offline', group_id: 'using-in-rome' }),
    )
  })
})
