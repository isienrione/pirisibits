import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  buildLandingTierCheckoutUrl,
  buildLandingTierCustomData,
  resolveLandingTierCents,
} from '../landingCheckout.js'
import { __setLaunchOfferActiveForTests } from '../../lib/launchOffer.js'

describe('landingCheckout', () => {
  beforeEach(() => {
    __setLaunchOfferActiveForTests(false)
  })

  afterEach(() => {
    __setLaunchOfferActiveForTests(null)
  })

  it('uses fixed cents for central tier', () => {
    expect(resolveLandingTierCents('rome-central', 1499)).toBe(999)
  })

  it('uses fixed cents for essential tier', () => {
    expect(resolveLandingTierCents('rome-essential', 1499)).toBe(999)
  })

  it('uses live AB cents for complete tier', () => {
    expect(resolveLandingTierCents('rome-complete', 1499)).toBe(1499)
    expect(resolveLandingTierCents('rome-complete', null)).toBe(1499)
  })

  it('uses fixed cents for Couple and Family bundles', () => {
    expect(resolveLandingTierCents('rome-couple', 1499)).toBe(2500)
    expect(resolveLandingTierCents('rome-family', 1499)).toBe(3500)
  })

  it('uses Launch Offer promo cents when the offer is active', () => {
    __setLaunchOfferActiveForTests(true)
    expect(resolveLandingTierCents('rome-central', 1499)).toBe(499)
    expect(resolveLandingTierCents('rome-essential', 1499)).toBe(699)
    expect(resolveLandingTierCents('rome-complete', 1499)).toBe(1000)
    expect(resolveLandingTierCents('rome-couple', 1499)).toBe(1700)
    expect(resolveLandingTierCents('rome-family', 1499)).toBe(2500)
  })

  it('passes tier identity to checkout url', () => {
    const url = buildLandingTierCheckoutUrl('https://checkout.example/buy', 'rome-essential', {
      host: 'hotelroma1',
      abVariantCents: 1499,
    })

    expect(url).toContain('checkout%5Bcustom%5D%5Bproduct_id%5D=rome-essential')
    expect(url).toContain('checkout%5Bcustom%5D%5Bab_variant%5D=999')
    expect(url).toContain('checkout%5Bcustom%5D%5Bhost%5D=hotelroma1')
  })

  it('builds attribution customData for bundles without seat or content fields', () => {
    const couple = buildLandingTierCustomData('rome-couple', { host: 'hotelroma1' })
    const family = buildLandingTierCustomData('rome-family', { host: 'hotelroma1' })

    expect(couple).toMatchObject({
      product_id: 'rome-couple',
      host: 'hotelroma1',
      ab_variant: '2500',
    })
    expect(family).toMatchObject({
      product_id: 'rome-family',
      host: 'hotelroma1',
      ab_variant: '3500',
    })
    expect(couple).not.toHaveProperty('seat_limit')
    expect(couple).not.toHaveProperty('content_product_id')
    expect(family).not.toHaveProperty('seat_limit')
    expect(family).not.toHaveProperty('content_product_id')
  })
})
