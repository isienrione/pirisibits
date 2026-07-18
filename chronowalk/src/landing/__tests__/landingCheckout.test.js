import { describe, expect, it } from 'vitest'
import {
  buildLandingTierCheckoutUrl,
  resolveLandingTierCents,
} from '../landingCheckout.js'

describe('landingCheckout', () => {
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

  it('passes tier identity to checkout url', () => {
    const url = buildLandingTierCheckoutUrl('https://checkout.example/buy', 'rome-essential', {
      host: 'hotelroma1',
      abVariantCents: 1499,
    })

    expect(url).toContain('checkout%5Bcustom%5D%5Bproduct_id%5D=rome-essential')
    expect(url).toContain('checkout%5Bcustom%5D%5Bab_variant%5D=999')
    expect(url).toContain('checkout%5Bcustom%5D%5Bhost%5D=hotelroma1')
  })
})
