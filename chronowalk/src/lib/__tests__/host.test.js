import { describe, expect, it, beforeEach } from 'vitest'
import { buildCheckoutUrl, captureHostFromUrl, getHost } from '../host'

describe('host attribution', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores host code from ?h= for 90 days', () => {
    captureHostFromUrl('?h=hotelroma1')
    expect(getHost()).toBe('hotelroma1')
  })

  it('appends host and ab variant to checkout url', () => {
    const url = buildCheckoutUrl('https://checkout.example/buy', {
      host: 'hotelroma1',
      abVariantCents: 1700,
    })
    expect(url).toContain('checkout%5Bcustom%5D%5Bhost%5D=hotelroma1')
    expect(url).toContain('checkout%5Bcustom%5D%5Bab_variant%5D=1700')
  })

  it('appends product id when provided', () => {
    const url = buildCheckoutUrl('https://checkout.example/buy', {
      productId: 'rome-complete',
    })
    expect(url).toContain('checkout%5Bcustom%5D%5Bproduct_id%5D=rome-complete')
  })
})
