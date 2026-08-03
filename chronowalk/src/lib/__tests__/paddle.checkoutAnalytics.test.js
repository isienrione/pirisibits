import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const openMock = vi.fn()
const initializePaddleMock = vi.fn()

vi.mock('@paddle/paddle-js', () => ({
  initializePaddle: (...args) => initializePaddleMock(...args),
}))

vi.mock('../analytics.ts', async () => {
  const actual = await vi.importActual('../analytics.ts')
  return {
    ...actual,
    getPostHogCheckoutIdentity: () => ({
      ph_distinct_id: 'ph_user_1',
      ph_session_id: 'ph_sess_1',
    }),
    getLastCtaLocation: () => 'hero',
    trackCheckoutOpened: vi.fn(() => true),
    trackCheckoutClosed: vi.fn(() => true),
    trackCheckoutCompleted: vi.fn(() => true),
    trackCheckoutError: vi.fn(() => true),
    trackCheckoutPaymentFailed: vi.fn(() => true),
    trackCheckoutOpenFailed: vi.fn(() => true),
    trackCheckoutCustomerCreated: vi.fn(() => true),
    trackCheckoutItemsUpdated: vi.fn(() => true),
    trackPaddleScriptFailed: vi.fn(() => true),
  }
})

vi.mock('../attribution.ts', async () => {
  const actual = await vi.importActual('../attribution.ts')
  return {
    ...actual,
    getAttribution: () => ({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'rome',
      utm_content: null,
      utm_term: null,
      gclid: 'gclid_1',
      gbraid: 'gbraid_1',
      wbraid: null,
      msclkid: null,
      ttclid: null,
      fbclid: null,
      landing_page_url: 'https://chronowalk.com/?utm_source=google',
      document_referrer: 'https://google.com/',
      captured_at: 1700000000000,
    }),
    captureAttribution: () => ({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'rome',
      utm_content: null,
      utm_term: null,
      gclid: 'gclid_1',
      gbraid: 'gbraid_1',
      wbraid: null,
      msclkid: null,
      ttclid: null,
      fbclid: null,
      landing_page_url: 'https://chronowalk.com/?utm_source=google',
      document_referrer: 'https://google.com/',
      captured_at: 1700000000000,
    }),
    attributionToProps: (record) => {
      if (!record) return {}
      const out = {}
      for (const [k, v] of Object.entries(record)) {
        if (v == null || v === '') continue
        if (k === 'captured_at') {
          out.attribution_captured_at = v
          continue
        }
        out[k] = v
      }
      return out
    },
  }
})

import {
  beginCheckoutAnalytics,
  buildPaddleCustomData,
  ensurePaddle,
  openPaddleCheckout,
  warnPaddleAtStartup,
  __resetPaddleForTests,
} from '../paddle.js'
import * as analytics from '../analytics.ts'

describe('paddle checkout analytics', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetPaddleForTests()
    vi.clearAllMocks()
    openMock.mockReset()
    initializePaddleMock.mockReset()
    initializePaddleMock.mockResolvedValue({
      Checkout: { open: openMock },
    })
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', 'test_client_token')
    vi.stubEnv('VITE_PADDLE_ENV', 'sandbox')
  })

  afterEach(() => {
    __resetPaddleForTests()
    vi.unstubAllEnvs()
  })

  it('initializes Paddle with eventCallback and maps checkout events', async () => {
    const paddle = await ensurePaddle()
    expect(paddle?.Checkout?.open).toBe(openMock)
    expect(initializePaddleMock).toHaveBeenCalledTimes(1)
    const opts = initializePaddleMock.mock.calls[0][0]
    expect(typeof opts.eventCallback).toBe('function')

    beginCheckoutAnalytics({ tier: 'rome-complete', priceCents: 1999 })

    opts.eventCallback({ name: 'checkout.loaded' })
    expect(analytics.trackCheckoutOpened).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'rome-complete', priceEur: 19.99 }),
    )

    opts.eventCallback({
      name: 'checkout.completed',
      data: { transaction_id: 'txn_1' },
    })
    expect(analytics.trackCheckoutCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'rome-complete',
        transactionId: 'txn_1',
      }),
    )

    beginCheckoutAnalytics({ tier: 'rome-essential', priceCents: 999 })
    opts.eventCallback({ name: 'checkout.closed' })
    expect(analytics.trackCheckoutClosed).toHaveBeenCalledWith(
      expect.objectContaining({ tier: 'rome-essential' }),
    )

    opts.eventCallback({
      name: 'checkout.payment.failed',
      error: { detail: 'card_declined' },
    })
    expect(analytics.trackCheckoutPaymentFailed).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: 'card_declined' }),
    )

    opts.eventCallback({
      name: 'checkout.error',
      error: { detail: 'overlay_error' },
    })
    expect(analytics.trackCheckoutError).toHaveBeenCalledWith(
      expect.objectContaining({ errorMessage: 'overlay_error' }),
    )

    opts.eventCallback({ name: 'checkout.customer.created' })
    expect(analytics.trackCheckoutCustomerCreated).toHaveBeenCalled()

    opts.eventCallback({ name: 'checkout.items.updated' })
    expect(analytics.trackCheckoutItemsUpdated).toHaveBeenCalled()
  })

  it('includes PostHog, UTM, and cta_location in customData', () => {
    const data = buildPaddleCustomData({
      host: 'hotelroma1',
      abVariantCents: 999,
      productId: 'rome-central',
    })
    expect(data).toMatchObject({
      product_id: 'rome-central',
      host: 'hotelroma1',
      ab_variant: '999',
      ph_distinct_id: 'ph_user_1',
      ph_session_id: 'ph_sess_1',
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'rome',
      gclid: 'gclid_1',
      gbraid: 'gbraid_1',
      cta_location: 'hero',
    })
  })

  it('tracks checkout_open_failed and shows mailto fallback when open throws', async () => {
    openMock.mockImplementation(() => {
      throw new Error('overlay_boom')
    })

    const result = await openPaddleCheckout({
      priceId: 'pri_test',
      customData: { ab_variant: '999' },
      tierId: 'rome-complete',
    })

    expect(result.ok).toBe(false)
    expect(analytics.trackCheckoutOpenFailed).toHaveBeenCalledWith({
      tier: 'rome-complete',
      errorMessage: 'overlay_boom',
    })
    const fallback = document.getElementById('cw-checkout-fallback')
    expect(fallback).toBeTruthy()
    expect(fallback?.innerHTML).toMatch(/mailto:support@chronowalk\.com/)
  })

  it('warns and tracks when client token is missing at startup', () => {
    vi.stubEnv('VITE_PADDLE_CLIENT_TOKEN', '')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    warnPaddleAtStartup()

    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/VITE_PADDLE_CLIENT_TOKEN is missing/),
    )
    expect(analytics.trackPaddleScriptFailed).toHaveBeenCalledWith({
      reason: 'missing_client_token',
    })

    warn.mockRestore()
  })

  it('tracks paddle_script_failed when initializePaddle rejects', async () => {
    initializePaddleMock.mockRejectedValueOnce(new Error('cdn_timeout'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const paddle = await ensurePaddle()
    expect(paddle).toBeNull()
    expect(analytics.trackPaddleScriptFailed).toHaveBeenCalledWith({
      reason: 'cdn_timeout',
    })

    warn.mockRestore()
    error.mockRestore()
  })
})
