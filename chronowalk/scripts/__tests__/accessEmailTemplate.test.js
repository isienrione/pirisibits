import { describe, expect, it } from 'vitest'
import {
  BUNDLE_STOPS,
  buildAccessEmailHtml,
  buildAccessEmailText,
  buildSkuCopy,
  isBundleSku,
  packLabel,
  resendIdempotencyKey,
} from '../lib/accessEmailTemplate.mjs'

const SKUS = [
  ['rome-central', 'Roma Historica', false, 1],
  ['rome-essential', 'Roma Antica', false, 1],
  ['rome-complete', 'Roma Eterna', false, 1],
  ['rome-couple', 'Couple Bundle', true, 2],
  ['rome-family', 'Family Bundle', true, 4],
]

describe('access email template — five SKUs', () => {
  it.each(SKUS)('%s renders pack + seat rules', (productId, label, bundle, seats) => {
    const copy = buildSkuCopy({ productId, seatLimit: seats, claimExpiresAt: '2026-07-28T12:00:00Z' })
    expect(packLabel(productId)).toBe(label)
    expect(isBundleSku(productId)).toBe(bundle)
    expect(copy.seatLimit).toBe(seats)

    const text = buildAccessEmailText({
      accessToken: 'claim_EXAMPLE_TOKEN_VALUE_01',
      productId,
      seatLimit: seats,
      claimExpiresAt: '2026-07-28T12:00:00Z',
    })
    const html = buildAccessEmailHtml({
      accessToken: 'claim_EXAMPLE_TOKEN_VALUE_01',
      productId,
      seatLimit: seats,
      claimExpiresAt: '2026-07-28T12:00:00Z',
    })

    expect(text).toContain(label)
    expect(text).toMatch(/one-time/i)
    expect(text).toMatch(/expire/i)
    expect(text).not.toMatch(/device credential/i)
    expect(html).toContain(label)
    expect(html).toMatch(/One-time access code/)

    if (bundle) {
      expect(text).toContain(`${seats} seats total`)
      expect(text).toContain(`${BUNDLE_STOPS} Roma Eterna`)
      expect(text).toMatch(/invite or reset members/i)
      expect(text).not.toMatch(/invite_code=/i)
      expect(text).not.toMatch(/here are (all|your) (member )?invite/i)
      expect(text).toMatch(/never email member seat credentials/i)
      expect(html).toContain(`${seats} seats total`)
      expect(html).toMatch(/invite or reset members/i)
    } else {
      expect(text).not.toMatch(/invite or reset members/i)
      expect(html).not.toMatch(/invite or reset members/i)
      expect(text).not.toMatch(/seats total/i)
    }
  })

  it('uses stable Resend idempotency key', () => {
    expect(resendIdempotencyKey('txn_EXAMPLE01')).toBe('purchase-access/txn_EXAMPLE01')
  })
})
