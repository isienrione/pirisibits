import { describe, expect, it } from 'vitest'
import { buildLandingProductSchema, LANDING_DOCUMENT } from '../landingSeo.js'
import { ROME_TIERS } from '../landingData.js'

describe('landing SEO helpers', () => {
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
      expect(offer.priceCurrency).toBe('USD')
      expect(offer.price).toBe((tier.priceCents / 100).toFixed(2))
    }
  })
})
