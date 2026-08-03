import { describe, expect, it, vi } from 'vitest'
import {
  buildPurchaseConfirmedProperties,
  capturePosthogPurchaseConfirmed,
  extractAttributionCustomData,
  hashEmailSha256,
  readTransactionCountry,
} from '../purchaseAnalytics.js'

describe('paddle-webhook purchaseAnalytics', () => {
  it('hashes email with sha256 hex (normalized)', async () => {
    const hash = await hashEmailSha256('  Buyer@Example.COM ')
    expect(hash).toBe('6a6c26195c3682faa816966af789717c3bfa834eee6c599d667d2b3429c27cfd')
    expect(hash).toBe(await hashEmailSha256('buyer@example.com'))
    expect(await hashEmailSha256('')).toBeNull()
  })

  it('extracts attribution custom_data without empty values', () => {
    const data = extractAttributionCustomData({
      custom_data: {
        ph_distinct_id: 'ph_abc',
        utm_source: 'google',
        utm_medium: 'cpc',
        gclid: 'g1',
        ab_variant: '1499',
        cta_location: 'pricing',
        empty: '',
        noise: 'skip-me-not-in-allowlist',
      },
    })
    expect(data).toEqual({
      ph_distinct_id: 'ph_abc',
      utm_source: 'google',
      utm_medium: 'cpc',
      gclid: 'g1',
      ab_variant: '1499',
      cta_location: 'pricing',
    })
  })

  it('reads country from address fields', () => {
    expect(
      readTransactionCountry({ address: { country_code: 'it' } }),
    ).toBe('IT')
    expect(readTransactionCountry({})).toBeNull()
  })

  it('builds purchase_confirmed properties with attribution', () => {
    const props = buildPurchaseConfirmedProperties({
      transactionId: 'txn_1',
      tier: 'rome-complete',
      amountCents: 1999,
      currency: 'EUR',
      country: 'IT',
      emailHash: 'abc',
      customData: {
        ph_distinct_id: 'ph_1',
        utm_source: 'reddit',
        gclid: 'g9',
        cta_location: 'hero',
      },
    })
    expect(props).toMatchObject({
      transaction_id: 'txn_1',
      tier: 'rome-complete',
      amount: 19.99,
      amount_cents: 1999,
      currency: 'EUR',
      country: 'IT',
      email_hash: 'abc',
      ph_distinct_id: 'ph_1',
      utm_source: 'reddit',
      gclid: 'g9',
      cta_location: 'hero',
    })
  })

  it('captures PostHog purchase_confirmed via /capture/', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    const result = await capturePosthogPurchaseConfirmed({
      apiKey: 'phc_test',
      distinctId: 'ph_user',
      properties: { tier: 'rome-central', utm_source: 'google' },
      fetchImpl,
    })
    expect(result).toEqual({ ok: true, status: 200 })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://eu.i.posthog.com/capture/',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body).toMatchObject({
      api_key: 'phc_test',
      event: 'purchase_confirmed',
      distinct_id: 'ph_user',
      properties: expect.objectContaining({
        tier: 'rome-central',
        utm_source: 'google',
      }),
    })
  })

  it('skips PostHog capture without distinct id or api key', async () => {
    expect(await capturePosthogPurchaseConfirmed({ apiKey: '', distinctId: 'x' })).toMatchObject({
      skipped: true,
      reason: 'missing_api_key',
    })
    expect(
      await capturePosthogPurchaseConfirmed({ apiKey: 'phc', distinctId: '' }),
    ).toMatchObject({
      skipped: true,
      reason: 'missing_distinct_id',
    })
  })
})
