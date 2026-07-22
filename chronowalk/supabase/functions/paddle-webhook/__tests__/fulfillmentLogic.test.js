import { describe, expect, it } from 'vitest'
import {
  buildServerPriceMap,
  fixedSeatLimitForSku,
  isDuplicateWebhookInbox,
  isValidEmail,
  paddlePayloadEmailCandidate,
  resolveLaunchEntitlementFromTransaction,
  shouldIgnoreOutOfOrderEvent,
} from '../fulfillmentLogic.js'

const ENV = {
  PADDLE_PRICE_ROME_CENTRAL: 'pri_central',
  PADDLE_PRICE_ROME_ESSENTIAL: 'pri_essential',
  PADDLE_PRICE_ROME_COMPLETE: 'pri_complete',
  PADDLE_PRICE_ROME_COUPLE: 'pri_couple',
  PADDLE_PRICE_ROME_FAMILY: 'pri_family',
}

function completedTxn({ priceId, quantity = 1, customProductId = null, status = 'completed', extraItems = [] }) {
  const items = [
    {
      price: { id: priceId, billing_cycle: null },
      quantity,
    },
    ...extraItems,
  ]
  return {
    id: 'txn_EXAMPLE',
    status,
    currency_code: 'EUR',
    customer_id: 'ctm_EXAMPLE',
    custom_data: customProductId ? { product_id: customProductId } : {},
    details: { totals: { total: '1499', currency_code: 'EUR' } },
    items,
  }
}

describe('paddle-webhook fulfillmentLogic', () => {
  const mapResult = buildServerPriceMap(ENV)
  const priceMap = mapResult.map

  it('rejects missing or duplicate server price secrets at startup', () => {
    expect(buildServerPriceMap({}).ok).toBe(false)
    expect(
      buildServerPriceMap({
        ...ENV,
        PADDLE_PRICE_ROME_FAMILY: 'pri_central',
      }).reason,
    ).toBe('duplicate_price_id')
    expect(mapResult.ok).toBe(true)
  })

  it.each([
    ['pri_central', 'rome-central', 'rome-central', 1],
    ['pri_essential', 'rome-essential', 'rome-essential', 1],
    ['pri_complete', 'rome-complete', 'rome-complete', 1],
    ['pri_couple', 'rome-couple', 'rome-complete', 2],
    ['pri_family', 'rome-family', 'rome-complete', 4],
  ])('maps %s to exact entitlement matrix', (priceId, productId, contentId, seats) => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({ priceId }),
      priceMap,
    )
    expect(result.ok).toBe(true)
    expect(result.productId).toBe(productId)
    expect(result.contentProductId).toBe(contentId)
    expect(result.seatLimit).toBe(seats)
    expect(result.currencyCode).toBe('EUR')
  })

  it('uses server SKU when client custom_data claims the wrong tier', () => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({ priceId: 'pri_essential', customProductId: 'rome-complete' }),
      priceMap,
    )
    expect(result.ok).toBe(true)
    expect(result.productId).toBe('rome-essential')
    expect(result.attributionMismatch).toEqual({
      claimed: 'rome-complete',
      derived: 'rome-essential',
    })
  })

  it('fails closed on unknown price', () => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({ priceId: 'pri_unknown' }),
      priceMap,
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('unknown_price')
    expect(result.operatorReview).toBe(true)
  })

  it('fails closed on two items', () => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({
        priceId: 'pri_complete',
        extraItems: [{ price: { id: 'pri_central' }, quantity: 1 }],
      }),
      priceMap,
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('multiple_items')
  })

  it('fails closed on quantity greater than one', () => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({ priceId: 'pri_complete', quantity: 2 }),
      priceMap,
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('invalid_quantity')
  })

  it('ignores non-completed transactions', () => {
    const result = resolveLaunchEntitlementFromTransaction(
      completedTxn({ priceId: 'pri_complete', status: 'paid' }),
      priceMap,
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('not_completed')
  })

  it('detects older events after newer terminal state', () => {
    expect(
      shouldIgnoreOutOfOrderEvent('2026-07-21T10:00:00Z', '2026-07-21T12:00:00Z'),
    ).toBe(true)
    expect(
      shouldIgnoreOutOfOrderEvent('2026-07-21T13:00:00Z', '2026-07-21T12:00:00Z'),
    ).toBe(false)
  })

  it('rejects missing/invalid email candidates and ignores custom_data email', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('buyer@example.com')).toBe(true)
    expect(
      paddlePayloadEmailCandidate({
        email: 'bad',
        custom_data: { email: 'spoof@example.com', product_id: 'rome-family' },
      }),
    ).toBeNull()
    expect(
      paddlePayloadEmailCandidate({
        customer: { email: 'Buyer@Example.com' },
        custom_data: { email: 'spoof@example.com' },
      }),
    ).toBe('buyer@example.com')
  })

  it('treats duplicate inbox results as no-op and keeps fixed bundle seats', () => {
    expect(isDuplicateWebhookInbox({ duplicate: true })).toBe(true)
    expect(isDuplicateWebhookInbox({ duplicate: false })).toBe(false)
    expect(fixedSeatLimitForSku('rome-couple')).toBe(2)
    expect(fixedSeatLimitForSku('rome-family')).toBe(4)
    // Duplicate bundle events must not invent a client seat count — only catalog limits.
    expect(fixedSeatLimitForSku('rome-complete')).toBe(1)
  })
})
