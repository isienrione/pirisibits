/**
 * Recover / inspect ChronoWalk purchase rows for a completed Paddle transaction.
 *
 * Dry-run by default: never prints full emails, access tokens, device credentials,
 * or magic links. Masks email and order id in console output.
 *
 * Legacy reusable bearer tokens (purchases.access_token) must NOT be emailed.
 * For durable outbox requeue, use scripts/retry-fulfillment-outbox.mjs instead.
 * `--execute` on this script still refuses legacy bearer sends.
 *
 * Entitlement (`product_id`) is never overwritten from client-controlled
 * Paddle `custom_data.product_id`. Stored product_id is preserved as-is.
 *
 * Usage:
 *   export PADDLE_API_KEY=pdl_live_apikey_...
 *   export PADDLE_ENV=production
 *   export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   # optional later:
 *   # export RESEND_API_KEY=re_...
 *   # export RESEND_FROM='ChronoWalk <access@chronowalk.com>'
 *   # export SITE_URL=https://chronowalk.com
 *
 *   node scripts/resend-purchase-access.mjs txn_01...
 *   node scripts/resend-purchase-access.mjs --email buyer@example.invalid
 *   node scripts/resend-purchase-access.mjs txn_01... --execute   # refused until claim path
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { Environment, Paddle } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendKey = process.env.RESEND_API_KEY
const siteUrl = (process.env.SITE_URL ?? 'https://chronowalk.com').replace(/\/$/, '')
const from = process.env.RESEND_FROM ?? 'ChronoWalk <access@chronowalk.com>'
const envName = String(process.env.PADDLE_ENV ?? 'production').toLowerCase()

/** @param {string | null | undefined} email */
export function maskEmail(email) {
  const raw = String(email ?? '').trim().toLowerCase()
  const at = raw.indexOf('@')
  if (at <= 0) return '[redacted-email]'
  const local = raw.slice(0, at)
  const domain = raw.slice(at + 1)
  const localMask =
    local.length <= 1 ? '*' : `${local[0]}${'*'.repeat(Math.min(local.length - 1, 6))}`
  const domainParts = domain.split('.')
  const domainMask = domainParts
    .map((part, i) => {
      if (!part) return part
      if (i === domainParts.length - 1) return part
      return part.length <= 1 ? '*' : `${part[0]}***`
    })
    .join('.')
  return `${localMask}@${domainMask}`
}

/** @param {string | null | undefined} orderId */
export function maskOrderId(orderId) {
  const raw = String(orderId ?? '').trim()
  if (!raw) return '[redacted-order]'
  if (raw.length <= 10) return `${raw.slice(0, 4)}…`
  return `${raw.slice(0, 8)}…${raw.slice(-4)}`
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const execute = args.includes('--execute')
  const emailFlag = args.indexOf('--email')
  const emailArg = emailFlag >= 0 ? args[emailFlag + 1] : null
  const transactionId = args.find((a) => a.startsWith('txn_')) ?? null
  return { execute, emailArg, transactionId }
}

async function resolveTransactionId({ transactionId, emailArg, envName: paddleEnv, apiKey: key }) {
  if (transactionId) return transactionId
  if (!emailArg) return null

  const host =
    paddleEnv === 'sandbox' ? 'sandbox-api.paddle.com' : 'api.paddle.com'
  const res = await fetch(
    `https://${host}/transactions?per_page=50&order_by=created_at[DESC]`,
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Paddle-Version': '1',
      },
    },
  )
  const json = await res.json()
  if (!res.ok) throw new Error('Paddle transactions list failed')
  for (const t of json.data ?? []) {
    if (t.status !== 'completed') continue
    const cRes = await fetch(`https://${host}/customers/${t.customer_id}`, {
      headers: { Authorization: `Bearer ${key}`, 'Paddle-Version': '1' },
    })
    const cJson = await cRes.json()
    if (
      String(cJson?.data?.email ?? '')
        .toLowerCase() === emailArg.toLowerCase()
    ) {
      return t.id
    }
  }
  return null
}

/**
 * Upsert purchase row without trusting custom_data.product_id.
 * Preserves any existing product_id / access_token; does not log secrets.
 */
export async function upsertPurchasePreservingEntitlement(supabase, {
  email,
  orderId,
  host,
  abVariant,
}) {
  const { data: existing, error: lookupError } = await supabase
    .from('purchases')
    .select('access_token, email, product_id, order_id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (lookupError) throw lookupError

  const payload = {
    email,
    order_id: orderId,
    // Never take entitlement from client-controlled custom_data.
    product_id: existing?.product_id ?? null,
    host: host ?? null,
    ab_variant: abVariant,
  }

  const { data: row, error } = await supabase
    .from('purchases')
    .upsert(payload, { onConflict: 'order_id' })
    .select('access_token, email, product_id, order_id')
    .single()

  if (error) throw error
  return { row, preservedProductId: existing?.product_id ?? null }
}

export function refuseLegacyBearerSend() {
  return {
    ok: false,
    reason: 'legacy_bearer_send_disabled',
    message:
      'Refusing to email a reusable legacy access_token. One-time claim/outbox path is required before --execute can send mail.',
  }
}

async function main() {
  if (!apiKey || !supabaseUrl || !serviceKey) {
    console.error('Need PADDLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const { execute, emailArg, transactionId: txnArg } = parseArgs(process.argv)

  // Keep SDK constructed for future claim-path work; dry-run may only need fetch.
  void new Paddle(apiKey, {
    environment:
      envName === 'sandbox' ? Environment.sandbox : Environment.production,
  })

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const transactionId = await resolveTransactionId({
    transactionId: txnArg,
    emailArg,
    envName,
    apiKey,
  })

  if (!transactionId) {
    console.error(
      'Usage: node scripts/resend-purchase-access.mjs txn_... | --email buyer@example.invalid [--execute]',
    )
    console.error('Dry-run is the default. --execute is refused until claim/outbox exists.')
    process.exit(1)
  }

  const host = envName === 'sandbox' ? 'sandbox-api.paddle.com' : 'api.paddle.com'
  const tRes = await fetch(`https://${host}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
  })
  const tJson = await tRes.json()
  if (!tRes.ok) throw new Error('Paddle transaction fetch failed')
  const transaction = tJson.data

  const cRes = await fetch(`https://${host}/customers/${transaction.customer_id}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
  })
  const cJson = await cRes.json()
  const email = String(cJson?.data?.email ?? '').toLowerCase()
  if (!email) throw new Error('No customer email on transaction')

  // Inspect custom_data for host / ab only — never for product entitlement.
  const custom = transaction.custom_data ?? {}
  void custom.product_id

  const { row } = await upsertPurchasePreservingEntitlement(supabase, {
    email,
    orderId: transaction.id,
    host: custom.host ? String(custom.host) : null,
    abVariant: custom.ab_variant != null ? Number(custom.ab_variant) : null,
  })

  const hasLegacyToken = Boolean(row.access_token)
  console.log('Purchase row ready (secrets redacted):')
  console.log('  email:', maskEmail(row.email))
  console.log('  order:', maskOrderId(row.order_id))
  console.log('  pack:', row.product_id ?? '(unset — not derived from custom_data)')
  console.log('  legacy_access_token:', hasLegacyToken ? '[present — not printed]' : '(none)')
  console.log('  magic_link:', '[redacted — never printed]')
  console.log(`  site: ${siteUrl}`)
  console.log('  mode:', execute ? 'execute' : 'dry-run')

  if (!execute) {
    console.log('Dry-run complete. Pass --execute only after the one-time claim/outbox path exists.')
    return
  }

  const refusal = refuseLegacyBearerSend()
  console.error(refusal.message)
  if (resendKey) {
    console.error('RESEND_API_KEY is set but send is disabled for legacy bearer tokens.')
  }
  void from
  process.exit(2)
}

const thisFile = fileURLToPath(import.meta.url)
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedAs && thisFile === invokedAs) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
