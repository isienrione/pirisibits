import { describe, expect, it } from 'vitest'
import {
  buildLandingTierCheckoutUrl,
  resolveLandingTierCents,
} from '../landingCheckout.js'

describe('landingCheckout', () => {
  it('uses fixed cents for central tier', () => {
    expect(resolveLandingTierCents('rome-central', 1799)).toBe(1200)
  })

  it('uses fixed cents for essential tier', () => {
    expect(resolveLandingTierCents('rome-essential', 1799)).toBe(1200)
  })

  it('uses live AB cents for complete tier', () => {
    expect(resolveLandingTierCents('rome-complete', 1799)).toBe(1799)
    expect(resolveLandingTierCents('rome-complete', null)).toBe(1799)
  })

  it('passes tier identity to checkout url', () => {
    const url = buildLandingTierCheckoutUrl('https://checkout.example/buy', 'rome-essential', {
      host: 'hotelroma1',
      abVariantCents: 1799,
    })

    expect(url).toContain('checkout%5Bcustom%5D%5Bproduct_id%5D=rome-essential')
    expect(url).toContain('checkout%5Bcustom%5D%5Bab_variant%5D=1200')
    expect(url).toContain('checkout%5Bcustom%5D%5Bhost%5D=hotelroma1')
  })
})
