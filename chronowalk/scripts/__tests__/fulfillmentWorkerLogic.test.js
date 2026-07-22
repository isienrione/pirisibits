import { describe, expect, it } from 'vitest'
import { decryptClaimSecret, encryptClaimSecret } from '../lib/claimCrypto.mjs'
import {
  authorizeCronRequest,
  classifyResendResponse,
  computeBackoffSeconds,
  decideInitialClaimIssue,
  freshFulfillmentGenerationFields,
  MAX_FULFILLMENT_ATTEMPTS,
  newEmailGenerationId,
  resendEventOutboxPatch,
  resendIdempotencyKey,
  shouldApplyResendEventToOutbox,
  simulateConcurrentOutboxClaim,
  verifySvixSignature,
} from '../lib/fulfillmentWorkerLogic.mjs'
import {
  formatOutboxAuditRow,
  parseRetryArgs,
} from '../retry-fulfillment-outbox.mjs'
import { formatAuditLine, parseAuditArgs } from '../audit-fulfillment-outbox.mjs'

describe('fulfillment worker logic', () => {
  it('classifies Resend timeout/429/500 as transient and 4xx as permanent', () => {
    expect(classifyResendResponse({ timedOut: true }).kind).toBe('transient')
    expect(classifyResendResponse({ status: 429 }).kind).toBe('transient')
    expect(classifyResendResponse({ status: 500 }).kind).toBe('transient')
    expect(classifyResendResponse({ status: 502 }).kind).toBe('transient')
    expect(classifyResendResponse({ status: 400 }).kind).toBe('permanent')
    expect(classifyResendResponse({ status: 409 }).kind).toBe('permanent')
    expect(classifyResendResponse({ status: 422 }).kind).toBe('permanent')
    expect(classifyResendResponse({ status: 200 }).kind).toBe('success')
  })

  it('caps exponential backoff and documents max attempts', () => {
    expect(MAX_FULFILLMENT_ATTEMPTS).toBe(8)
    expect(computeBackoffSeconds(1)).toBe(30)
    expect(computeBackoffSeconds(2)).toBe(60)
    expect(computeBackoffSeconds(20)).toBe(6 * 60 * 60)
  })

  it('prevents duplicate claim minting when active claim or ciphertext exists', () => {
    expect(
      decideInitialClaimIssue({ hasActiveInitialClaim: true, outboxHasCiphertext: false }),
    ).toEqual({ issue: false, reason: 'active_claim_exists' })
    expect(
      decideInitialClaimIssue({
        hasActiveInitialClaim: false,
        outboxHasCiphertext: true,
        outboxStatus: 'pending',
      }),
    ).toEqual({ issue: false, reason: 'outbox_ciphertext_present' })
    expect(
      decideInitialClaimIssue({ hasActiveInitialClaim: false, outboxHasCiphertext: false }),
    ).toEqual({ issue: true, reason: 'mint_initial' })
  })

  it('concurrent workers never double-claim the same due rows', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    const sim = simulateConcurrentOutboxClaim(ids, 2, 3)
    expect(sim.noDuplicates).toBe(true)
    expect(sim.uniqueCount).toBe(sim.totalClaimed)
    expect(sim.claimedByWorker[0]).toHaveLength(3)
    expect(sim.claimedByWorker[1]).toHaveLength(2)
  })

  it('maps Resend delivery events including delivered/bounced/missing handling', () => {
    expect(resendEventOutboxPatch('email.delivered')).toMatchObject({
      status: 'delivered',
      wipeClaim: true,
    })
    expect(resendEventOutboxPatch('email.bounced')).toMatchObject({
      status: 'fulfillment_failed',
      wipeClaim: true,
    })
    expect(resendEventOutboxPatch('email.delivery_delayed').lastError).toBe('delivery_delayed')
    expect(resendEventOutboxPatch('email.opened').ignored).toBe(true)
  })

  it('idempotency key is stable per generation and rotates across recoveries', () => {
    const order = 'txn_ABC'
    const gen1 = '11111111-1111-4111-8111-111111111111'
    const gen2 = '22222222-2222-4222-8222-222222222222'
    const gen3 = '33333333-3333-4333-8333-333333333333'

    const initial = resendIdempotencyKey(order, gen1)
    expect(initial).toBe(`purchase-access/${order}/${gen1}`)
    // Retry same generation → identical key
    expect(resendIdempotencyKey(order, gen1)).toBe(initial)
    // Operator recovery → different key
    const recovery1 = resendIdempotencyKey(order, gen2)
    expect(recovery1).not.toBe(initial)
    expect(recovery1).toBe(`purchase-access/${order}/${gen2}`)
    // Second recovery → another different key
    const recovery2 = resendIdempotencyKey(order, gen3)
    expect(recovery2).not.toBe(initial)
    expect(recovery2).not.toBe(recovery1)
    // Legacy / missing generation remains order-only compatible
    expect(resendIdempotencyKey(order)).toBe(`purchase-access/${order}`)
    expect(resendIdempotencyKey(order, '')).toBe(`purchase-access/${order}`)
  })

  it('idempotency key never embeds secrets or PII', () => {
    const claim = 'claim_SECRET_VALUE_do_not_leak'
    const link = 'https://chronowalk.com/access?token=claim_SECRET'
    const email = 'buyer@example.invalid'
    const cipher = 'v1.aesgcm.CIPHERTEXT'
    const key = resendIdempotencyKey('txn_SAFE01', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')
    expect(key).not.toContain(claim)
    expect(key).not.toContain(link)
    expect(key).not.toContain(email)
    expect(key).not.toContain(cipher)
    expect(key).not.toMatch(/access\?token/)
    expect(JSON.stringify({ key })).not.toMatch(/SECRET|CIPHERTEXT|buyer@/)
  })

  it('fresh generation fields clear prior email lifecycle and rotate id', () => {
    const first = freshFulfillmentGenerationFields({
      reason: 'operator_restore',
      generationId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      nowIso: '2026-07-23T12:00:00.000Z',
    })
    const second = freshFulfillmentGenerationFields({
      reason: 'operator_restore',
      generationId: 'bbbbbbbb-bbbb-4ccc-8ddd-ffffffffffff',
      nowIso: '2026-07-23T13:00:00.000Z',
    })
    expect(first.email_generation_id).not.toBe(second.email_generation_id)
    expect(first).toMatchObject({
      status: 'pending',
      attempts: 0,
      sent_at: null,
      delivered_at: null,
      resend_email_id: null,
      last_provider_status: null,
      locked_at: null,
      locked_by: null,
      last_error: 'operator_restore',
    })
    expect(newEmailGenerationId(() => 'fixed-uuid')).toBe('fixed-uuid')
  })

  it('refuses stale provider events against a newer or pre-send generation', () => {
    expect(
      shouldApplyResendEventToOutbox({
        outboxResendEmailId: null,
        eventResendEmailId: 're_OLD',
        outboxStatus: 'pending',
        eventType: 'email.delivered',
      }).apply,
    ).toBe(false)

    expect(
      shouldApplyResendEventToOutbox({
        outboxResendEmailId: 're_NEW',
        eventResendEmailId: 're_OLD',
        outboxStatus: 'sent',
        eventType: 'email.bounced',
      }),
    ).toEqual({ apply: false, reason: 'provider_id_mismatch' })

    expect(
      shouldApplyResendEventToOutbox({
        outboxResendEmailId: 're_STALE_MATCH',
        eventResendEmailId: 're_STALE_MATCH',
        outboxStatus: 'pending',
        eventType: 'email.delivered',
      }),
    ).toEqual({ apply: false, reason: 'stale_or_pre_send_generation' })

    expect(
      shouldApplyResendEventToOutbox({
        outboxResendEmailId: 're_CUR',
        eventResendEmailId: 're_CUR',
        outboxStatus: 'sent',
        eventType: 'email.delivered',
      }).apply,
    ).toBe(true)
  })

  it('encrypt/decrypt round-trips claim secrets', async () => {
    const key = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const raw = 'claim_secret_EXAMPLE_VALUE_abcdef'
    const enc = await encryptClaimSecret(raw, key)
    expect(enc).toBeTruthy()
    expect(await decryptClaimSecret(enc, key)).toBe(raw)
    expect(await decryptClaimSecret(enc, btoa('wrongwrongwrongwrongwrongwrong12'))).toBeNull()
  })

  it('verifies Svix signatures and rejects bad ones', async () => {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32))
    const secret = `whsec_${btoa(String.fromCharCode(...keyBytes))}`
    const id = 'msg_EXAMPLE'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const payload = '{"type":"email.delivered","data":{"email_id":"re_EXAMPLE"}}'
    const toSign = `${id}.${timestamp}.${payload}`
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(toSign))
    const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))

    const ok = await verifySvixSignature({
      payload,
      headers: {
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': `v1,${sig}`,
      },
      secret,
    })
    expect(ok.ok).toBe(true)

    const bad = await verifySvixSignature({
      payload,
      headers: {
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': 'v1,notavalidsignature==',
      },
      secret,
    })
    expect(bad.ok).toBe(false)
  })

  it('authorizes cron secret via bearer', () => {
    const req = {
      headers: {
        get(name) {
          if (name.toLowerCase() === 'authorization') return 'Bearer cron-secret-example'
          return null
        },
      },
    }
    expect(authorizeCronRequest(req, 'cron-secret-example').ok).toBe(true)
    expect(authorizeCronRequest(req, 'other').ok).toBe(false)
  })
})

describe('operator restore CLI', () => {
  it('defaults to dry-run', async () => {
    const { parseRestoreArgs } = await import('../restore-purchase-access.mjs')
    expect(parseRestoreArgs(['node', 'x', 'txn_EXAMPLE01']).execute).toBe(false)
    expect(parseRestoreArgs(['node', 'x', 'txn_EXAMPLE01', '--execute']).execute).toBe(true)
  })

  it('enqueueRestoredClaim rotates generation and clears lifecycle on upsert', async () => {
    const { enqueueRestoredClaim } = await import('../restore-purchase-access.mjs')
    const key = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
    const upserts = []
    const supabase = {
      from() {
        return {
          upsert(row) {
            upserts.push(row)
            return Promise.resolve({ error: null })
          },
        }
      },
    }
    const result = await enqueueRestoredClaim(supabase, {
      purchaseId: '11111111-1111-4111-8111-111111111111',
      orderId: 'txn_RESTORE01',
      rawClaim: 'claim_EXAMPLE_RECOVERY_TOKEN',
      keyB64: key,
    })
    expect(result.ok).toBe(true)
    expect(upserts).toHaveLength(1)
    const row = upserts[0]
    expect(row.email_generation_id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(row.status).toBe('pending')
    expect(row.attempts).toBe(0)
    expect(row.sent_at).toBeNull()
    expect(row.delivered_at).toBeNull()
    expect(row.resend_email_id).toBeNull()
    expect(row.last_provider_status).toBeNull()
    expect(row.locked_at).toBeNull()
    expect(row.last_error).toBe('operator_restore')
    expect(row.encrypted_claim).toBeTruthy()
    expect(row.encrypted_claim).not.toContain('claim_EXAMPLE')
    const keyStr = resendIdempotencyKey(row.order_id, row.email_generation_id)
    expect(keyStr).not.toContain('claim_EXAMPLE')
    expect(keyStr).toContain(row.email_generation_id)

    const second = await enqueueRestoredClaim(supabase, {
      purchaseId: '11111111-1111-4111-8111-111111111111',
      orderId: 'txn_RESTORE01',
      rawClaim: 'claim_EXAMPLE_RECOVERY_TOKEN_2',
      keyB64: key,
    })
    expect(second.ok).toBe(true)
    expect(upserts[1].email_generation_id).not.toBe(upserts[0].email_generation_id)
    expect(resendIdempotencyKey('txn_RESTORE01', upserts[1].email_generation_id)).not.toBe(
      resendIdempotencyKey('txn_RESTORE01', upserts[0].email_generation_id),
    )
  })
})

describe('operator CLIs', () => {
  it('retry defaults to dry-run, parses rotate flag, and masks audit rows', () => {
    expect(parseRetryArgs(['node', 'x', 'txn_EXAMPLE01'])).toEqual({
      execute: false,
      rotateGeneration: false,
      orderId: 'txn_EXAMPLE01',
    })
    expect(parseRetryArgs(['node', 'x', 'txn_EXAMPLE01', '--execute']).execute).toBe(true)
    expect(
      parseRetryArgs(['node', 'x', 'txn_EXAMPLE01', '--rotate-generation', '--execute']),
    ).toEqual({
      execute: true,
      rotateGeneration: true,
      orderId: 'txn_EXAMPLE01',
    })
    const row = formatOutboxAuditRow({
      order_id: 'txn_EXAMPLE0123456789abcdef',
      email: 'buyer@example.invalid',
      product_id: 'rome-complete',
      purchase_status: 'active',
      status: 'failed',
      attempts: 3,
      max_attempts: 8,
      created_at: new Date(Date.now() - 120_000).toISOString(),
      encrypted_claim: 'cipher',
      resend_email_id: 're_x',
      email_generation_id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      sent_at: '2026-07-21T00:00:00Z',
      delivered_at: '2026-07-21T00:01:00Z',
      last_error: 'http_500',
    })
    expect(row.email).not.toBe('buyer@example.invalid')
    expect(row.order).not.toContain('abcdef')
    expect(row.hasEmailGenerationId).toBe(true)
    expect(row.hasSentAt).toBe(true)
    expect(row.hasDeliveredAt).toBe(true)
    expect(JSON.stringify(row)).not.toMatch(/cipher|access\?token|aaaaaaaa-bbbb/)
  })

  it('audit CLI parses filters and never echoes raw email', () => {
    expect(parseAuditArgs(['node', 'x', '--limit=10', '--status=fulfillment_failed'])).toEqual({
      limit: 10,
      status: 'fulfillment_failed',
    })
    const line = formatAuditLine({
      order_id: 'txn_EXAMPLE0123456789',
      email: 'buyer@example.invalid',
      product_id: 'rome-family',
      purchase_status: 'active',
      outbox_status: 'fulfillment_failed',
      attempts: 8,
      purchase_created_at: new Date().toISOString(),
      last_error: 'email.bounced',
    })
    expect(line.email).not.toBe('buyer@example.invalid')
    expect(line.outboxStatus).toBe('fulfillment_failed')
  })
})
