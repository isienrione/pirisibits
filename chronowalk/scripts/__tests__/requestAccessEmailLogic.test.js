import { describe, expect, it } from 'vitest'
import {
  decideAccessEmailAction,
  genericAccessEmailAck,
  isPlausibleBuyerEmail,
  isPlausibleOrderId,
  normalizeBuyerEmail,
  normalizeOrderId,
} from '../../supabase/functions/_shared/requestAccessEmailLogic.js'

describe('requestAccessEmailLogic', () => {
  it('normalizes and validates email + Paddle order id', () => {
    expect(normalizeBuyerEmail('  Ada@Outlook.com ')).toBe('ada@outlook.com')
    expect(normalizeOrderId(' txn_01abc ')).toBe('txn_01abc')
    expect(isPlausibleBuyerEmail('ada@outlook.com')).toBe(true)
    expect(isPlausibleBuyerEmail('not-an-email')).toBe(false)
    expect(isPlausibleOrderId('txn_01hxyz')).toBe(true)
    expect(isPlausibleOrderId('order_123')).toBe(false)
  })

  it('never reveals match state in the ack copy', () => {
    const ack = genericAccessEmailAck()
    expect(ack.ok).toBe(true)
    expect(ack.message).toMatch(/junk/i)
    expect(ack.message).not.toMatch(/not found/i)
    expect(ack.message).not.toMatch(/invalid/i)
  })

  it('prefers rotate-requeue when ciphertext and active claim remain', () => {
    expect(
      decideAccessEmailAction({
        emailMatches: true,
        purchaseActive: true,
        hasCiphertext: true,
        hasActiveClaim: true,
      }),
    ).toBe('requeue_rotate')
  })

  it('restores when ciphertext was wiped after “delivered” / bounce', () => {
    expect(
      decideAccessEmailAction({
        emailMatches: true,
        purchaseActive: true,
        hasCiphertext: false,
        hasActiveClaim: false,
      }),
    ).toBe('restore')
  })

  it('noops on email mismatch', () => {
    expect(
      decideAccessEmailAction({
        emailMatches: false,
        purchaseActive: true,
        hasCiphertext: true,
        hasActiveClaim: true,
      }),
    ).toBe('noop')
  })
})
