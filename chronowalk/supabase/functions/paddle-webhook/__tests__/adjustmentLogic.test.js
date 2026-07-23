import { describe, expect, it } from 'vitest'
import {
  isDuplicateWebhookInbox,
  isTerminalPurchaseStatus,
  proveEffectiveFullRefundCoverage,
  readAdjustmentPayload,
  readTransactionCoverageBasis,
  resolveAdjustmentEffect,
  shouldIgnoreOutOfOrderEvent,
} from '../fulfillmentLogic.js'

function txnOneItem({
  id = 'txn_EXAMPLE',
  lineId = 'txnitm_EXAMPLE_1',
  grandTotal = '4900',
  currency = 'EUR',
} = {}) {
  return {
    id,
    currency_code: currency,
    details: {
      totals: { grand_total: grandTotal, currency_code: currency },
      line_items: [{ id: lineId, totals: { total: grandTotal } }],
    },
  }
}

function adjPartialFullItem({
  id = 'adj_EXAMPLE',
  transactionId = 'txn_EXAMPLE',
  itemId = 'txnitm_EXAMPLE_1',
  total = '4900',
  currency = 'EUR',
  status = 'approved',
  action = 'refund',
  itemType = 'full',
} = {}) {
  return {
    id,
    action,
    type: 'partial',
    status,
    transaction_id: transactionId,
    currency_code: currency,
    items: [
      {
        id: 'adjitm_1',
        item_id: itemId,
        type: itemType,
        amount: total,
        totals: { total },
      },
    ],
    totals: { total, currency_code: currency },
  }
}

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

  it('partial without coverage proof is operator review only', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'approved', type: 'partial' }),
    ).toMatchObject({
      revoke: false,
      operatorReview: true,
      reason: 'partial_operator_review',
      needsCoverageCheck: true,
    })
  })

  it('partial with proven coverage revokes', () => {
    expect(
      resolveAdjustmentEffect(
        { action: 'refund', status: 'approved', type: 'partial' },
        { proven: true, reason: 'effective_full_item_coverage' },
      ),
    ).toMatchObject({
      revoke: true,
      purchaseStatus: 'refunded',
      effect: 'refund',
      reason: 'effective_full_item_coverage',
      operatorReview: false,
    })
  })

  it('pending partial keeps access without coverage check', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'pending_approval', type: 'partial' }),
    ).toMatchObject({
      revoke: false,
      reason: 'pending_keep_access',
      needsCoverageCheck: false,
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

describe('effective full coverage from partial adjustments', () => {
  it('approved top-level partial with every original item fully covered and equal totals revokes', () => {
    const adjustment = readAdjustmentPayload(
      adjPartialFullItem({ total: '4900', itemId: 'txnitm_EXAMPLE_1' }),
    )
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment,
      transaction: txnOneItem({ lineId: 'txnitm_EXAMPLE_1', grandTotal: '4900' }),
    })
    expect(coverage).toMatchObject({ proven: true, reason: 'effective_full_item_coverage' })
    expect(resolveAdjustmentEffect(adjustment, coverage)).toMatchObject({
      revoke: true,
      purchaseStatus: 'refunded',
    })
  })

  it('single-item transaction with item type full and equal totals revokes', () => {
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(adjPartialFullItem()),
      transaction: txnOneItem(),
    })
    expect(coverage.proven).toBe(true)
  })

  it('partial monetary amount retains access and flags review', () => {
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(
        adjPartialFullItem({ total: '4900', itemType: 'partial' }),
      ),
      transaction: txnOneItem({ grandTotal: '4900' }),
    })
    expect(coverage).toMatchObject({ proven: false, reason: 'non_full_item_type' })
    expect(
      resolveAdjustmentEffect(
        { action: 'refund', status: 'approved', type: 'partial' },
        coverage,
      ),
    ).toMatchObject({ revoke: false, operatorReview: true })
  })

  it('only some transaction items covered retains access', () => {
    const transaction = {
      id: 'txn_MULTI',
      currency_code: 'EUR',
      details: {
        totals: { grand_total: '4900', currency_code: 'EUR' },
        line_items: [
          { id: 'txnitm_A', totals: { total: '2400' } },
          { id: 'txnitm_B', totals: { total: '2500' } },
        ],
      },
    }
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(
        adjPartialFullItem({
          transactionId: 'txn_MULTI',
          itemId: 'txnitm_A',
          total: '4900',
        }),
      ),
      transaction,
    })
    expect(coverage).toMatchObject({ proven: false, reason: 'incomplete_item_coverage' })
  })

  it('totals mismatch retains access even when items look full', () => {
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(adjPartialFullItem({ total: '1000' })),
      transaction: txnOneItem({ grandTotal: '4900' }),
    })
    expect(coverage).toMatchObject({ proven: false, reason: 'totals_mismatch' })
  })

  it('currency mismatch retains access', () => {
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(adjPartialFullItem({ currency: 'USD' })),
      transaction: txnOneItem({ currency: 'EUR' }),
    })
    expect(coverage).toMatchObject({ proven: false, reason: 'currency_mismatch' })
  })

  it('missing Paddle verification retains access', () => {
    expect(
      proveEffectiveFullRefundCoverage({
        adjustment: readAdjustmentPayload(adjPartialFullItem()),
        transaction: null,
      }),
    ).toMatchObject({ proven: false, reason: 'missing_paddle_verification' })

    expect(
      proveEffectiveFullRefundCoverage({
        adjustment: readAdjustmentPayload({
          ...adjPartialFullItem(),
          items: [],
          totals: { total: '4900', currency_code: 'EUR' },
        }),
        transaction: txnOneItem(),
      }),
    ).toMatchObject({ proven: false, reason: 'missing_paddle_verification' })
  })

  it('pending and rejected refunds retain access', () => {
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'pending_approval', type: 'partial' }),
    ).toMatchObject({ revoke: false, reason: 'pending_keep_access' })
    expect(
      resolveAdjustmentEffect({ action: 'refund', status: 'rejected', type: 'partial' }),
    ).toMatchObject({ revoke: false, reason: 'rejected_retain_active' })
  })

  it('compares totals as integer minor-unit strings (no floats)', () => {
    const basis = readTransactionCoverageBasis(
      txnOneItem({ grandTotal: '04900' }),
    )
    expect(basis.grandTotal).toBe('04900')
    const coverage = proveEffectiveFullRefundCoverage({
      adjustment: readAdjustmentPayload(adjPartialFullItem({ total: '4900' })),
      transaction: txnOneItem({ grandTotal: '04900' }),
    })
    expect(coverage.proven).toBe(true)
  })
})

describe('adjustment payload + ordering helpers', () => {
  it('reads transaction_id / action / status / type / items / totals', () => {
    expect(
      readAdjustmentPayload({
        id: 'adj_EXAMPLE',
        transaction_id: 'txn_EXAMPLE',
        action: 'refund',
        status: 'approved',
        type: 'partial',
        currency_code: 'EUR',
        items: [{ id: 'adjitm_1', item_id: 'txnitm_1', type: 'full', amount: '4900' }],
        totals: { total: '4900', currency_code: 'EUR' },
      }),
    ).toMatchObject({
      adjustmentId: 'adj_EXAMPLE',
      transactionId: 'txn_EXAMPLE',
      action: 'refund',
      status: 'approved',
      type: 'partial',
      currencyCode: 'EUR',
      totalsTotal: '4900',
      items: [{ itemId: 'txnitm_1', type: 'full' }],
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

  it('treats reclaimed failed inbox events as processable', () => {
    expect(isDuplicateWebhookInbox({ duplicate: true })).toBe(true)
    expect(isDuplicateWebhookInbox({ duplicate: false })).toBe(false)
    expect(isDuplicateWebhookInbox({ duplicate: false, reclaim: true })).toBe(false)
    expect(isDuplicateWebhookInbox({ duplicate: true, reclaim: false })).toBe(true)
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
    expect(couple.revoke).toBe(true)
    expect(couple.purchaseStatus).toBe('refunded')
    expect(family.revoke).toBe(true)
    expect(family.purchaseStatus).toBe('disputed')
  })

  it('effective-full partial uses the same refunded revoke path', () => {
    const decision = resolveAdjustmentEffect(
      { action: 'refund', status: 'approved', type: 'partial' },
      { proven: true, reason: 'effective_full_item_coverage' },
    )
    expect(decision.revoke).toBe(true)
    expect(decision.purchaseStatus).toBe('refunded')
  })
})
