import { describe, expect, it } from 'vitest'
import {
  maskEmail,
  maskOrderId,
  refuseLegacyBearerSend,
  upsertPurchasePreservingEntitlement,
} from '../resend-purchase-access.mjs'

describe('resend-purchase-access redaction', () => {
  it('masks email local-part and domain labels', () => {
    const masked = maskEmail('buyer@example.invalid')
    expect(masked).not.toBe('buyer@example.invalid')
    expect(masked).toContain('@')
    expect(masked.endsWith('.invalid')).toBe(true)
    expect(masked.startsWith('b')).toBe(true)
  })

  it('masks order ids', () => {
    const orderId = 'txn_EXAMPLE' + '0123456789abcdef'
    expect(maskOrderId(orderId)).toMatch(/^txn_EXAM…/)
    expect(maskOrderId(orderId)).toMatch(/cdef$/)
    expect(maskOrderId(orderId)).not.toBe(orderId)
  })

  it('refuses legacy bearer email send', () => {
    const refusal = refuseLegacyBearerSend()
    expect(refusal.ok).toBe(false)
    expect(refusal.reason).toBe('legacy_bearer_send_disabled')
  })

  it('preserves stored product_id and ignores custom_data entitlement', async () => {
    const existing = {
      access_token: '00000000-0000-4000-8000-000000000000',
      email: 'buyer@example.invalid',
      product_id: 'rome-essential',
      order_id: 'txn_EXAMPLE',
    }

    const upsertPayloads = []
    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: existing, error: null }),
                }
              },
            }
          },
          upsert(payload) {
            upsertPayloads.push(payload)
            return {
              select() {
                return {
                  single: async () => ({
                    data: { ...existing, ...payload },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      },
    }

    const { row } = await upsertPurchasePreservingEntitlement(supabase, {
      email: 'buyer@example.invalid',
      orderId: 'txn_EXAMPLE',
      host: 'landing',
      abVariant: null,
    })

    expect(upsertPayloads[0].product_id).toBe('rome-essential')
    expect(row.product_id).toBe('rome-essential')
    expect(upsertPayloads[0]).not.toHaveProperty('custom_data')
  })

  it('does not invent product_id when none is stored', async () => {
    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({ data: null, error: null }),
                }
              },
            }
          },
          upsert(payload) {
            return {
              select() {
                return {
                  single: async () => ({
                    data: {
                      access_token: null,
                      email: payload.email,
                      product_id: payload.product_id,
                      order_id: payload.order_id,
                    },
                    error: null,
                  }),
                }
              },
            }
          },
        }
      },
    }

    const { row } = await upsertPurchasePreservingEntitlement(supabase, {
      email: 'buyer@example.invalid',
      orderId: 'txn_EXAMPLE',
      host: null,
      abVariant: null,
    })

    expect(row.product_id).toBeNull()
  })
})
