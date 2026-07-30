import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getTierById,
  isCheckoutConfigured,
  pickCheckoutBaseUrl,
  TRANSACTION_STEPS,
} from '../checkout.js'
import {
  buildPaddleCustomData,
  isPaddleCheckoutReady,
  PADDLE_PRICE_ENV_KEYS,
  resolvePaddlePriceId,
  __resetPaddleForTests,
} from '../paddle.js'

const PADDLE_ENV_KEYS = [
  'VITE_PADDLE_CLIENT_TOKEN',
  'VITE_PADDLE_ENV',
  'VITE_PADDLE_PRICE_ROME_CENTRAL',
  'VITE_PADDLE_PRICE_ROME_ESSENTIAL',
  'VITE_PADDLE_PRICE_ROME_COMPLETE',
  'VITE_PADDLE_PRICE_ROME_COUPLE',
  'VITE_PADDLE_PRICE_ROME_FAMILY',
]

function stubPaddleEnvCleared() {
  for (const key of PADDLE_ENV_KEYS) {
    vi.stubEnv(key, '')
  }
}

function stubPaddleEnvPopulated() {
  vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_client_token')
  vi.stubEnv('VITE_PADDLE_ENV', 'sandbox')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_CENTRAL', 'pri_central_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_ESSENTIAL', 'pri_essential_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_complete_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_COUPLE', 'pri_couple_live')
  vi.stubEnv('VITE_PADDLE_PRICE_ROME_FAMILY', 'pri_family_live')
}

describe('checkout helpers (Paddle)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetPaddleForTests()
    stubPaddleEnvCleared()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    __resetPaddleForTests()
  })

  it('detects configured checkout from Paddle env', () => {
    expect(isCheckoutConfigured()).toBe(false)
    expect(isCheckoutConfigured('https://store.lemonsqueezy.com/checkout/buy/abc')).toBe(false)
    expect(isCheckoutConfigured(true)).toBe(true)
  })

  it('stays hermetic when ambient Paddle env is fully populated', () => {
    stubPaddleEnvPopulated()
    // Explicit boolean still wins; ambient must not break the false/URL contracts.
    expect(isCheckoutConfigured(false)).toBe(false)
    expect(isCheckoutConfigured('https://store.lemonsqueezy.com/checkout/buy/abc')).toBe(false)
    expect(isCheckoutConfigured(true)).toBe(true)
    // Cleared ambient for the unconfigured probe.
    stubPaddleEnvCleared()
    expect(isCheckoutConfigured()).toBe(false)
  })

  it('resolves rome tiers and Couple/Family bundles', () => {
    expect(getTierById('rome-essential')?.priceCents).toBe(999)
    expect(getTierById('rome-couple')?.priceCents).toBe(2500)
    expect(getTierById('rome-couple')?.name).toBe('Couple')
    expect(getTierById('rome-family')?.name).toBe('Family')
    expect(getTierById('rome-couple')).not.toHaveProperty('seatLimit')
    expect(getTierById('rome-couple')).not.toHaveProperty('contentProductId')
    expect(getTierById('missing')).toBeNull()
  })

  it('builds paddle custom data for attribution only (not entitlement)', () => {
    const data = buildPaddleCustomData({
      host: 'hotelroma1',
      abVariantCents: 999,
      productId: 'rome-central',
      consentVersion: '2026-07-21',
    })
    // product_id may be sent for analytics · webhook must ignore it for access.
    expect(data).toEqual({
      product_id: 'rome-central',
      host: 'hotelroma1',
      ab_variant: '999',
      consent_version: '2026-07-21',
    })
  })

  it('resolves all five price ids from env', () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_token')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_complete')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_CENTRAL', 'pri_central')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_ESSENTIAL', 'pri_essential')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_COUPLE', 'pri_couple')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_FAMILY', 'pri_family')
    expect(resolvePaddlePriceId('rome-central')).toBe('pri_central')
    expect(resolvePaddlePriceId('rome-complete')).toBe('pri_complete')
    expect(resolvePaddlePriceId('rome-couple')).toBe('pri_couple')
    expect(resolvePaddlePriceId('rome-family')).toBe('pri_family')
    expect(isPaddleCheckoutReady('rome-central')).toBe(true)
    expect(isPaddleCheckoutReady('rome-couple')).toBe(true)
  })

  it('prefers app_config paddle_prices over env', () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_token')
    vi.stubEnv('VITE_PADDLE_PRICE_ROME_COMPLETE', 'pri_env')
    expect(
      resolvePaddlePriceId('rome-complete', { 'rome-complete': 'pri_config' }),
    ).toBe('pri_config')
  })

  it('does not fill explicit env bags from ambient import.meta.env', () => {
    stubPaddleEnvPopulated()
    expect(
      resolvePaddlePriceId('rome-couple', null, {
        env: {
          VITE_PADDLE_PRICE_ROME_COMPLETE: 'pri_only_complete',
        },
      }),
    ).toBeNull()
    expect(Object.values(PADDLE_PRICE_ENV_KEYS)).toContain('VITE_PADDLE_PRICE_ROME_COUPLE')
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
