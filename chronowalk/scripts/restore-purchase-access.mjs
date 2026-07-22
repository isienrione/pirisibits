/**
 * Explicit operator restoration after refund/dispute review.
 *
 * Dry-run by default. --execute calls operator_restore_purchase_access which:
 *   - revokes old claims/credentials/seats/invites/sessions
 *   - sets purchase active
 *   - rotates bundle seats (never revives old bearer values)
 *   - mints a fresh operator_recovery one-time claim
 *   - enqueues fulfillment_outbox with encrypted claim
 *
 * Never prints the access link or raw claim.
 *
 * Usage:
 *   export SUPABASE_URL=…
 *   export SUPABASE_SERVICE_ROLE_KEY=…
 *   export CLAIM_ENCRYPTION_KEY=…   # required for --execute
 *   node scripts/restore-purchase-access.mjs txn_01…
 *   node scripts/restore-purchase-access.mjs txn_01… --execute
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { encryptClaimSecret } from './lib/claimCrypto.mjs'
import {
  freshFulfillmentGenerationFields,
  maskEmail,
  maskOrderId,
} from './lib/fulfillmentWorkerLogic.mjs'

export function parseRestoreArgs(argv) {
  const args = argv.slice(2)
  return {
    execute: args.includes('--execute'),
    orderId: args.find((a) => a.startsWith('txn_')) ?? null,
  }
}

export async function enqueueRestoredClaim(supabase, { purchaseId, orderId, rawClaim, keyB64 }) {
  const encrypted = await encryptClaimSecret(rawClaim, keyB64)
  if (!encrypted) {
    return { ok: false, reason: 'claim_encryption_unavailable' }
  }
  const claimExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const generation = freshFulfillmentGenerationFields({ reason: 'operator_restore' })
  const { error } = await supabase.from('fulfillment_outbox').upsert(
    {
      purchase_id: purchaseId,
      order_id: orderId,
      encrypted_claim: encrypted,
      claim_expires_at: claimExpiresAt,
      ...generation,
    },
    { onConflict: 'purchase_id' },
  )
  if (error) return { ok: false, reason: error.message }
  return { ok: true, emailGenerationId: generation.email_generation_id }
}

async function main() {
  const { execute, orderId } = parseRestoreArgs(process.argv)
  if (!orderId) {
    console.error('Usage: node scripts/restore-purchase-access.mjs txn_… [--execute]')
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data: purchase, error } = await supabase
    .from('purchases')
    .select('id, email, product_id, status, seat_limit, order_id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (error) throw error
  if (!purchase) {
    console.error('Unknown order', maskOrderId(orderId))
    process.exit(2)
  }

  console.log('Restore target (secrets redacted):')
  console.log('  order:', maskOrderId(purchase.order_id))
  console.log('  email:', maskEmail(purchase.email))
  console.log('  product:', purchase.product_id)
  console.log('  status:', purchase.status)
  console.log('  seatLimit:', purchase.seat_limit)
  console.log('  mode:', execute ? 'execute' : 'dry-run')
  console.log('  access_link: [never printed]')
  console.log('  note: restore mints a fresh one-time claim; never reactivates a consumed code')

  if (!execute) {
    console.log('Dry-run complete. Pass --execute to restore + enqueue access email.')
    return
  }

  const claimKey = process.env.CLAIM_ENCRYPTION_KEY ?? ''
  if (!claimKey) {
    console.error('CLAIM_ENCRYPTION_KEY required for --execute')
    process.exit(3)
  }

  const { data: restored, error: restoreError } = await supabase.rpc(
    'operator_restore_purchase_access',
    { p_order_id: orderId, p_reason: 'operator_restore' },
  )
  if (restoreError) {
    console.error('Restore failed:', restoreError.message)
    process.exit(4)
  }
  if (!restored?.ok || !restored.claim) {
    console.error('Restore refused:', restored?.reason ?? 'unknown')
    process.exit(5)
  }

  const queued = await enqueueRestoredClaim(supabase, {
    purchaseId: restored.purchase_id,
    orderId,
    rawClaim: String(restored.claim),
    keyB64: claimKey,
  })
  if (!queued.ok) {
    console.error('Outbox enqueue failed:', queued.reason)
    process.exit(6)
  }

  console.log('Restored + fulfillment enqueued:', {
    order: maskOrderId(orderId),
    productId: restored.product_id,
    purpose: restored.purpose,
    hasBundle: Boolean(restored.bundle_id),
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
