import { describe, expect, it } from 'vitest'
import {
  isTerminalPurchaseStatus,
  readAdjustmentPayload,
  resolveAdjustmentEffect,
  shouldIgnoreOutOfOrderEvent,
} from '../fulfillmentLogic.js'

describe('resolveAdjustmentEffect', () => {
  it('approved full refund revokes as refunded', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'approved', type: 'full' }),
    ).toMatchObject({
      revoke: true,
      purchaseStatus: 'refunded',
      effect: 'refund',
      reason: 'full_refund_approved',
    })
  })

  it('approved full credit revokes as refunded', () => {
    expect(
      resolveAdjustmentEffect({ action: 'credit', status: 'approved', type: 'full' }),
    ).toMatchObject({
      revoke: true,
      purchaseStatus: 'refunded',
      reason: 'full_credit_approved',
    })
  })

  it('pending refund keeps access', () => {
    expect(
      resolveAdjustmentEffect({
        action: 'refund',
        status: 'pending_approval',
        type: 'full',
      }),
    ).toMatchObject({
      revoke: false,
      purchaseStatus: null,
      reason: 'pending_keep_access',
      operatorReview: false,
    })
  })

  it('rejected refund retains active (no status change)', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'rejected', type: 'full' }),
    ).toMatchObject({
      revoke: false,
      purchaseStatus: null,
      reason: 'rejected_retain_active',
    })
  })

  it('partial refund/credit is operator review only', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'approved', type: 'partial' }),
    ).toMatchObject({
      revoke: false,
      operatorReview: true,
      reason: 'partial_operator_review',
    })
  })

  it('chargeback and chargeback_warning suspend as disputed', () => {
    expect(
      resolveAdjustmentEffect({ action: 'chargeback', status: 'approved', type: 'full' }),
    ).toMatchObject({ revoke: true, purchaseStatus: 'disputed', reason: 'chargeback' })
    expect(
      resolveAdjustmentEffect({
        action: 'chargeback_warning',
        status: 'approved',
        type: 'full',
      }),
    ).toMatchObject({
      revoke: true,
      purchaseStatus: 'disputed',
      reason: 'chargeback_warning',
    })
  })

  it('reversals require operator review and do not restore', () => {
    for (const action of [
      'chargeback_reverse',
      'chargeback_warning_reverse',
      'credit_reverse',
    ]) {
      expect(resolveAdjustmentEffect({ action, status: 'approved', type: 'full' })).toMatchObject(
        {
          revoke: false,
          operatorReview: true,
          reason: 'reversal_requires_operator',
        },
      )
    }
  })

  it('unknown shapes land in operator review', () => {
    expect(resolveAdjustmentEffect({ action: 'refund', status: 'weird', type: 'full' })).toMatchObject(
      {
        operatorReview: true,
        reason: 'unknown_adjustment',
        revoke: false,
      },
    )
  })
})

describe('adjustment payload + ordering helpers', () => {
  it('reads transaction_id / action / status / type', () => {
    expect(
      readAdjustmentPayload({
        id: 'adj_EXAMPLE',
        transaction_id: 'txn_EXAMPLE',
        action: 'refund',
        status: 'approved',
        type: 'full',
      }),
    ).toEqual({
      adjustmentId: 'adj_EXAMPLE',
      transactionId: 'txn_EXAMPLE',
      action: 'refund',
      status: 'approved',
      type: 'full',
      reason: null,
    })
  })

  it('detects out-of-order occurred_at and terminal purchase statuses', () => {
    expect(
      shouldIgnoreOutOfOrderEvent('2026-07-21T10:00:00Z', '2026-07-21T12:00:00Z'),
    ).toBe(true)
    expect(isTerminalPurchaseStatus('refunded')).toBe(true)
    expect(isTerminalPurchaseStatus('disputed')).toBe(true)
    expect(isTerminalPurchaseStatus('active')).toBe(false)
  })
})

describe('Couple / Family cascade contract (decision layer)', () => {
  it('full approved refund on bundle SKUs uses same revoke path as solo', () => {
    const couple = resolveAdjustmentEffect({
      action: 'refund',
      status: 'approved',
      type: 'full',
    })
    const family = resolveAdjustmentEffect({
      action: 'chargeback',
      status: 'approved',
      type: 'full',
    })
    // Webhook calls revoke_purchase_access which atomically invalidates
    // organizer + every seat credential + invites + walk sessions.
    expect(couple.revoke).toBe(true)
    expect(couple.purchaseStatus).toBe('refunded')
    expect(family.revoke).toBe(true)
    expect(family.purchaseStatus).toBe('disputed')
  })
})
