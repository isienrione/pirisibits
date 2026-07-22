import { describe, expect, it } from 'vitest'
import { decryptClaimSecret, encryptClaimSecret } from '../lib/claimCrypto.mjs'
import {
  authorizeCronRequest,
  classifyResendResponse,
  computeBackoffSeconds,
  decideInitialClaimIssue,
  MAX_FULFILLMENT_ATTEMPTS,
  resendEventOutboxPatch,
  resendIdempotencyKey,
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

  it('idempotency key is stable per order', () => {
    expect(resendIdempotencyKey('txn_ABC')).toBe('purchase-access/txn_ABC')
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
})

describe('operator CLIs', () => {
  it('retry defaults to dry-run and masks audit rows', () => {
    expect(parseRetryArgs(['node', 'x', 'txn_EXAMPLE01']).execute).toBe(false)
    expect(parseRetryArgs(['node', 'x', 'txn_EXAMPLE01', '--execute']).execute).toBe(true)
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
      last_error: 'http_500',
    })
    expect(row.email).not.toBe('buyer@example.invalid')
    expect(row.order).not.toContain('abcdef')
    expect(JSON.stringify(row)).not.toMatch(/cipher|access\?token/)
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
