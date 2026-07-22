/**
 * Operator CLI: requeue a stuck fulfillment outbox row by Paddle order id.
 *
 * Dry-run by default. Requires explicit --execute to call operator_requeue_fulfillment.
 * Masks all customer data. Never prints access links, claim codes, or emails.
 *
 * Usage:
 *   export SUPABASE_URL=…
 *   export SUPABASE_SERVICE_ROLE_KEY=…
 *   node scripts/retry-fulfillment-outbox.mjs txn_01…
 *   node scripts/retry-fulfillment-outbox.mjs txn_01… --execute
 *   # After Resend http_409 / stale lifecycle on a still-valid encrypted claim:
 *   node scripts/retry-fulfillment-outbox.mjs txn_01… --rotate-generation --execute
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { ageSeconds, maskEmail, maskOrderId } from './lib/fulfillmentWorkerLogic.mjs'

export function parseRetryArgs(argv) {
  const args = argv.slice(2)
  const execute = args.includes('--execute')
  const rotateGeneration = args.includes('--rotate-generation')
  const orderId = args.find((a) => a.startsWith('txn_')) ?? null
  return { execute, rotateGeneration, orderId }
}

export function formatOutboxAuditRow(row, nowMs = Date.now()) {
  return {
    order: maskOrderId(row.order_id),
    email: maskEmail(row.email),
    productId: row.product_id ?? null,
    purchaseStatus: row.purchase_status ?? null,
    outboxStatus: row.status ?? null,
    attempts: row.attempts ?? null,
    maxAttempts: row.max_attempts ?? null,
    ageSeconds: ageSeconds(row.created_at, nowMs),
    nextAttemptAt: row.next_attempt_at ?? null,
    hasCiphertext: Boolean(row.encrypted_claim),
    hasResendId: Boolean(row.resend_email_id),
    hasEmailGenerationId: Boolean(row.email_generation_id),
    hasSentAt: Boolean(row.sent_at),
    hasDeliveredAt: Boolean(row.delivered_at),
    lastError: row.last_error ? String(row.last_error).slice(0, 80) : null,
  }
}

export async function loadOutboxByOrder(supabase, orderId) {
  const { data: outbox, error } = await supabase
    .from('fulfillment_outbox')
    .select(
      'id, purchase_id, order_id, status, attempts, max_attempts, next_attempt_at, created_at, encrypted_claim, resend_email_id, email_generation_id, sent_at, delivered_at, last_error, claim_expires_at',
    )
    .eq('order_id', orderId)
    .maybeSingle()
  if (error) throw error
  if (!outbox) return null

  const { data: purchase } = await supabase
    .from('purchases')
    .select('email, product_id, status, seat_limit')
    .eq('id', outbox.purchase_id)
    .maybeSingle()

  return {
    ...outbox,
    email: purchase?.email ?? null,
    product_id: purchase?.product_id ?? null,
    purchase_status: purchase?.status ?? null,
    seat_limit: purchase?.seat_limit ?? null,
  }
}

async function main() {
  const { execute, rotateGeneration, orderId } = parseRetryArgs(process.argv)
  if (!orderId) {
    console.error(
      'Usage: node scripts/retry-fulfillment-outbox.mjs txn_… [--rotate-generation] [--execute]',
    )
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const row = await loadOutboxByOrder(supabase, orderId)
  if (!row) {
    console.error('No outbox row for order', maskOrderId(orderId))
    process.exit(2)
  }

  const audit = formatOutboxAuditRow(row)
  console.log('Fulfillment outbox (secrets redacted):')
  for (const [k, v] of Object.entries(audit)) {
    console.log(`  ${k}:`, v)
  }
  console.log('  mode:', execute ? 'execute' : 'dry-run')
  console.log('  rotateGeneration:', rotateGeneration)
  console.log('  access_link: [never printed]')
  if (rotateGeneration) {
    console.log(
      '  note: --rotate-generation keeps encrypted_claim, clears prior email lifecycle, and mints a new Resend idempotency generation (does not mint a new claim)',
    )
  }

  if (!execute) {
    console.log('Dry-run complete. Pass --execute to requeue (does not mint a new claim).')
    return
  }

  const { data, error } = await supabase.rpc('operator_requeue_fulfillment', {
    p_order_id: orderId,
    p_rotate_generation: rotateGeneration,
  })
  if (error) {
    console.error('Requeue failed:', error.message)
    process.exit(3)
  }
  if (!data?.ok) {
    console.error('Requeue refused:', data?.reason ?? 'unknown')
    process.exit(4)
  }
  console.log('Requeued:', {
    order: maskOrderId(orderId),
    outboxStatus: data.outbox_status,
    hasEncryptedClaim: data.has_encrypted_claim,
    rotatedGeneration: Boolean(data.rotated_generation),
    hasEmailGenerationId: Boolean(data.email_generation_id),
  })
}

const thisFile = fileURLToPath(import.meta.url)
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedAs && thisFile === invokedAs) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
