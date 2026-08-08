import { afterEach, describe, expect, it } from 'vitest'
import { buildLandingProductSchema, LANDING_DOCUMENT } from '../landingSeo.js'
import { ROME_TIERS } from '../landingData.js'
import {
  __setLaunchOfferActiveForTests,
  getEffectivePriceCents,
} from '../../lib/launchOffer.js'

describe('landing SEO helpers', () => {
  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
  })

  it('exposes a landing-specific document title and description', () => {
    expect(LANDING_DOCUMENT.title).toMatch(/ChronoWalk/i)
    expect(LANDING_DOCUMENT.description).toMatch(/Rome/i)
  })

  it('builds Product Offer schema matching current purchasable prices', () => {
    __setLaunchOfferActiveForTests(true)
    const schema = buildLandingProductSchema()
    expect(schema['@type']).toBe('ItemList')
    expect(schema.itemListElement).toHaveLength(ROME_TIERS.length)
    for (const [index, tier] of ROME_TIERS.entries()) {
      const offer = schema.itemListElement[index].item.offers
      const cents = getEffectivePriceCents(tier.id, tier.priceCents)
      expect(offer.priceCurrency).toBe('EUR')
      expect(offer.price).toBe((cents / 100).toFixed(2))
    }
  })

  it('returns base ROME_TIERS prices in JSON-LD when Launch Offer is off', () => {
    __setLaunchOfferActiveForTests(false)
    const schema = buildLandingProductSchema()
    for (const [index, tier] of ROME_TIERS.entries()) {
      expect(schema.itemListElement[index].item.offers.price).toBe(
        (tier.priceCents / 100).toFixed(2),
      )
    }
  })
})
