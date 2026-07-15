import { describe, expect, it, beforeEach } from 'vitest'
import {
  buildLandingProductSchema,
  LANDING_DOCUMENT,
  resetLandingViewTrackingForTests,
  trackLandingViewOnce,
} from '../landingSeo.js'
import { ROME_TIERS } from '../landingData.js'

describe('landing SEO and analytics helpers', () => {
  beforeEach(() => {
    resetLandingViewTrackingForTests()
  })

  it('exposes a landing-specific document title and description', () => {
    expect(LANDING_DOCUMENT.title).toMatch(/ChronoWalk/i)
    expect(LANDING_DOCUMENT.description).toMatch(/Rome/i)
  })

  it('builds Product Offer schema matching ROME_TIERS prices', () => {
    const schema = buildLandingProductSchema()
    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toHaveLength(ROME_TIERS.length)
    for (const [index, tier] of ROME_TIERS.entries()) {
      const offer = schema.itemListElement[index].item.offers
      expect(offer.priceCurrency).toBe('EUR')
      expect(offer.price).toBe((tier.priceCents / 100).toFixed(2))
    }
  })

  it('tracks landing_view only once per SPA session', () => {
    const calls = []
    const track = (event, props) => calls.push({ event, props })
    expect(trackLandingViewOnce(track, 'landing_view', { source: 'landing' })).toBe(true)
    expect(trackLandingViewOnce(track, 'landing_view', { source: 'landing' })).toBe(false)
    expect(calls).toHaveLength(1)
  })
})
