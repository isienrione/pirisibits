import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  buildTierCheckoutUrl,
  getTierById,
  isCheckoutConfigured,
  TRANSACTION_STEPS,
} from '../checkout.js'

describe('checkout helpers', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('detects configured checkout urls', () => {
    expect(isCheckoutConfigured('')).toBe(false)
    expect(isCheckoutConfigured('   ')).toBe(false)
    expect(isCheckoutConfigured('https://store.lemonsqueezy.com/checkout/buy/abc')).toBe(true)
  })

  it('resolves rome tiers', () => {
    expect(getTierById('rome-essential')?.priceCents).toBe(1200)
    expect(getTierById('missing')).toBeNull()
  })

  it('builds tier checkout urls with custom metadata', () => {
    const url = buildTierCheckoutUrl('https://checkout.example/buy', 'rome-central', {
      host: 'hotelroma1',
      abVariantCents: 1700,
    })
    expect(url).toContain('checkout%5Bcustom%5D%5Bproduct_id%5D=rome-central')
    expect(url).toContain('checkout%5Bcustom%5D%5Bab_variant%5D=1200')
    expect(url).toContain('checkout%5Bcustom%5D%5Bhost%5D=hotelroma1')
  })

  it('returns null when checkout is not configured', () => {
    expect(buildTierCheckoutUrl('', 'rome-complete')).toBeNull()
  })

  it('exposes the full transaction step list', () => {
    expect(TRANSACTION_STEPS.map((s) => s.id)).toEqual([
      'choose',
      'checkout',
      'confirm',
      'unlock',
      'setup',
    ])
  })
})
