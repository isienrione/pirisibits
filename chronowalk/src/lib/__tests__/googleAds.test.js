import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __resetGoogleAdsForTests,
  applyGoogleAdsConsentDefault,
  hashEmailForGoogleAds,
  initGoogleAds,
  trackGoogleAdsCheckoutOpened,
  trackGoogleAdsPurchaseConversion,
  updateGoogleAdsConsent,
} from '../googleAds.js'

describe('googleAds', () => {
  beforeEach(() => {
    __resetGoogleAdsForTests()
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_GOOGLE_ADS_ID', 'AW-123456789')
    vi.stubEnv('VITE_GOOGLE_ADS_PURCHASE_LABEL', 'purchaseLabel')
    vi.stubEnv('VITE_GOOGLE_ADS_CHECKOUT_OPENED_LABEL', 'checkoutOpenedLabel')
    document.head.innerHTML = ''
  })

  afterEach(() => {
    __resetGoogleAdsForTests()
    vi.unstubAllEnvs()
  })

  it('applies Consent Mode v2 defaults with analytics granted and ads denied', () => {
    applyGoogleAdsConsentDefault()
    expect(window.dataLayer.length).toBeGreaterThan(0)
    const args = [...window.dataLayer].map((entry) => [...entry])
    expect(args).toContainEqual([
      'consent',
      'default',
      expect.objectContaining({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'granted',
      }),
    ])
  })

  it('loads gtag.js async and configs the conversion ID', () => {
    initGoogleAds({ marketingConsent: null })
    const script = document.querySelector('script[src*="googletagmanager.com/gtag/js"]')
    expect(script).toBeTruthy()
    expect(script.async).toBe(true)
    expect(script.src).toContain('id=AW-123456789')

    const pushed = [...window.dataLayer].map((entry) => [...entry])
    expect(pushed.some((row) => row[0] === 'config' && row[1] === 'AW-123456789')).toBe(true)
  })

  it('updates ad consent when marketing preference changes', () => {
    initGoogleAds()
    window.dataLayer = []
    updateGoogleAdsConsent(true)
    const granted = [...window.dataLayer].map((entry) => [...entry])
    expect(granted).toContainEqual([
      'consent',
      'update',
      expect.objectContaining({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      }),
    ])
  })

  it('fires checkout_opened as a secondary conversion', () => {
    initGoogleAds()
    window.dataLayer = []
    expect(
      trackGoogleAdsCheckoutOpened({ tier: 'rome-complete', value: 19.99, currency: 'EUR' }),
    ).toBe(true)
    const rows = [...window.dataLayer].map((entry) => [...entry])
    expect(rows).toContainEqual([
      'event',
      'conversion',
      expect.objectContaining({
        send_to: 'AW-123456789/checkoutOpenedLabel',
        value: 19.99,
        currency: 'EUR',
        tier: 'rome-complete',
      }),
    ])
  })

  it('fires purchase conversion with transaction_id and hashed email', async () => {
    initGoogleAds()
    window.dataLayer = []
    const emailHash = await hashEmailForGoogleAds('Buyer@Example.COM')
    expect(emailHash).toBe('6a6c26195c3682faa816966af789717c3bfa834eee6c599d667d2b3429c27cfd')

    await trackGoogleAdsPurchaseConversion({
      value: 14.99,
      currency: 'EUR',
      transactionId: 'txn_abc',
      email: 'Buyer@Example.COM',
      tier: 'rome-essential',
    })

    const rows = [...window.dataLayer].map((entry) => [...entry])
    expect(rows).toContainEqual([
      'set',
      'user_data',
      { sha256_email_address: emailHash },
    ])
    expect(rows).toContainEqual([
      'event',
      'conversion',
      expect.objectContaining({
        send_to: 'AW-123456789/purchaseLabel',
        value: 14.99,
        currency: 'EUR',
        transaction_id: 'txn_abc',
      }),
    ])
  })

  it('no-ops when conversion ID is missing', () => {
    vi.stubEnv('VITE_GOOGLE_ADS_ID', '')
    expect(initGoogleAds()).toBe(false)
    expect(trackGoogleAdsCheckoutOpened({ value: 1 })).toBe(false)
  })
})
