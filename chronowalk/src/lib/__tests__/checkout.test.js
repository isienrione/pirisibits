import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  getTierById,
  isCheckoutConfigured,
  pickCheckoutBaseUrl,
  TRANSACTION_STEPS,
} from '../checkout.js'
import {
  buildPaddleCustomData,
  isPaddleCheckoutReady,
  resolvePaddlePriceId,
  __resetPaddleForTests,
} from '../paddle.js'

describe('checkout helpers (Paddle)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetPaddleForTests()
  })

  it('detects configured checkout from Paddle env', () => {
    expect(isCheckoutConfigured()).toBe(false)
    expect(isCheckoutConfigured('https://store.lemonsqueezy.com/checkout/buy/abc')).toBe(false)
    expect(isCheckoutConfigured(true)).toBe(true)
  })

  it('resolves rome tiers', () => {
    expect(getTierById('rome-essential')?.priceCents).toBe(999)
    expect(getTierById('missing')).toBeNull()
  })

  it('builds paddle custom data for tiers', () => {
    const data = buildPaddleCustomData({
      host: 'hotelroma1',
      abVariantCents: 999,
      productId: 'rome-central',
    })
    expect(data).toEqual({
      product_id: 'rome-central',
      host: 'hotelroma1',
      ab_variant: '999',
    })
  })

  it('resolves price ids from env', () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_token')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_complete')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_CENTRAL', 'pri_central')
    expect(resolvePaddlePriceId('rome-central')).toBe('pri_central')
    expect(resolvePaddlePriceId('rome-complete')).toBe('pri_complete')
    expect(isPaddleCheckoutReady('rome-central')).toBe(true)
  })

  it('prefers app_config paddle_prices over env', () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_token')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_env')
    expect(
      resolvePaddlePriceId('rome-complete', { 'rome-complete': 'pri_config' }),
    ).toBe('pri_config')
  })

  it('no longer falls back to a Lemon buy URL', () => {
    expect(pickCheckoutBaseUrl('', '')).toBe('')
  })

  it('exposes the full transaction step list', () => {
    expect(TRANSACTION_STEPS.map((s) => s.id)).toEqual([
      'choose',
      'checkout',
      'confirm',
      'unlock',
      'setup',
    ])
    expect(TRANSACTION_STEPS.find((s) => s.id === 'checkout')?.body).toMatch(/Paddle/)
  })
})
