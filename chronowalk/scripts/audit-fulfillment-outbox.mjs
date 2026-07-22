/**
 * Read-only masked audit of recent purchases + fulfillment outbox.
 * Never prints tokens, access links, or raw emails.
 *
 * Usage:
 *   export SUPABASE_URL=…
 *   export SUPABASE_SERVICE_ROLE_KEY=…
 *   node scripts/audit-fulfillment-outbox.mjs
 *   node scripts/audit-fulfillment-outbox.mjs --limit=50
 *   node scripts/audit-fulfillment-outbox.mjs --status=fulfillment_failed
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { ageSeconds, maskEmail, maskOrderId } from './lib/fulfillmentWorkerLogic.mjs'

export function parseAuditArgs(argv) {
  const args = argv.slice(2)
  let limit = 25
  let status = null
  for (const a of args) {
    if (a.startsWith('--limit=')) limit = Math.max(1, Math.min(200, Number(a.slice(8)) || 25))
    if (a.startsWith('--status=')) status = a.slice(9) || null
  }
  return { limit, status }
}

export function formatAuditLine(row, nowMs = Date.now()) {
  return {
    order: maskOrderId(row.order_id),
    email: maskEmail(row.email),
    productId: row.product_id ?? null,
    purchaseStatus: row.purchase_status ?? null,
    outboxStatus: row.outbox_status ?? '(none)',
    attempts: row.attempts ?? 0,
    ageSeconds: ageSeconds(row.purchase_created_at ?? row.outbox_created_at, nowMs),
    lastError: row.last_error ? String(row.last_error).slice(0, 60) : null,
  }
}

export async function fetchFulfillmentAudit(supabase, { limit = 25, status = null } = {}) {
  let query = supabase
    .from('fulfillment_outbox')
    .select(
      'order_id, status, attempts, last_error, created_at, purchase_id, purchases(email, product_id, status, created_at)',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    order_id: row.order_id,
    outbox_status: row.status,
    attempts: row.attempts,
    last_error: row.last_error,
    outbox_created_at: row.created_at,
    email: row.purchases?.email ?? null,
    product_id: row.purchases?.product_id ?? null,
    purchase_status: row.purchases?.status ?? null,
    purchase_created_at: row.purchases?.created_at ?? null,
  }))
}

async function main() {
  const { limit, status } = parseAuditArgs(process.argv)
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const rows = await fetchFulfillmentAudit(supabase, { limit, status })
  if (!rows.length) {
    console.log('No outbox rows matched.')
    return
  }

  console.log(`Fulfillment audit (${rows.length} rows, secrets redacted):`)
  for (const row of rows) {
    const line = formatAuditLine(row)
    console.log(
      [
        line.order,
        line.email,
        line.productId ?? '-',
        `purchase=${line.purchaseStatus ?? '-'}`,
        `outbox=${line.outboxStatus}`,
        `attempts=${line.attempts}`,
        `age=${line.ageSeconds ?? '?'}s`,
        line.lastError ? `err=${line.lastError}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
    )
  }
}

const thisFile = fileURLToPath(import.meta.url)
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedAs && thisFile === invokedAs) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
