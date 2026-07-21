/**
 * Recover / resend ChronoWalk access email for a completed Paddle transaction.
 *
 * Usage:
 *   export PADDLE_API_KEY=pdl_live_apikey_...
 *   export PADDLE_ENV=production
 *   export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   export RESEND_API_KEY=re_...
 *   # optional:
 *   # export RESEND_FROM='ChronoWalk <access@chronowalk.com>'
 *   # export SITE_URL=https://chronowalk.com
 *
 *   node scripts/resend-purchase-access.mjs txn_01...
 *   node scripts/resend-purchase-access.mjs --email buyer@example.com
 */

import { createClient } from '@supabase/supabase-js'
import { Environment, Paddle } from '@paddle/paddle-node-sdk'

const apiKey = process.env.PADDLE_API_KEY
const supabaseUrl = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendKey = process.env.RESEND_API_KEY
const siteUrl = (process.env.SITE_URL ?? 'https://chronowalk.com').replace(/\/$/, '')
const from = process.env.RESEND_FROM ?? 'ChronoWalk <access@chronowalk.com>'
const envName = String(process.env.PADDLE_ENV ?? 'production').toLowerCase()

if (!apiKey || !supabaseUrl || !serviceKey) {
  console.error('Need PADDLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const paddle = new Paddle(apiKey, {
  environment:
    envName === 'sandbox' ? Environment.sandbox : Environment.production,
})
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
})

async function findTransactionId(arg) {
  if (!arg) return null
  if (arg.startsWith('txn_')) return arg
  if (arg === '--email' || arg.startsWith('--')) return null
  return arg.startsWith('txn_') ? arg : null
}

async function latestCompletedForEmail(email) {
  const list = await paddle.transactions.list({ perPage: 50 }).next()
  const rows = list ?? []
  // SDK pagination differs by version — also try raw fetch fallback shape
  const items = Array.isArray(rows) ? rows : rows?.data ?? []
  const needle = email.toLowerCase()
  for (const t of items) {
    if (t.status !== 'completed') continue
    const customerId = t.customerId ?? t.customer_id
    if (!customerId) continue
    const customer = await paddle.customers.get(customerId)
    if (String(customer?.email ?? '').toLowerCase() === needle) return t.id
  }
  return null
}

async function main() {
  const args = process.argv.slice(2)
  let transactionId = args.find((a) => a.startsWith('txn_'))
  const emailFlag = args.indexOf('--email')
  const emailArg = emailFlag >= 0 ? args[emailFlag + 1] : null

  if (!transactionId && emailArg) {
    // Prefer API list via fetch for compatibility
    const host =
      envName === 'sandbox' ? 'sandbox-api.paddle.com' : 'api.paddle.com'
    const res = await fetch(`https://${host}/transactions?per_page=50&order_by=created_at[DESC]`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Paddle-Version': '1',
      },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(JSON.stringify(json))
    for (const t of json.data ?? []) {
      if (t.status !== 'completed') continue
      const cRes = await fetch(`https://${host}/customers/${t.customer_id}`, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
      })
      const cJson = await cRes.json()
      if (String(cJson?.data?.email ?? '').toLowerCase() === emailArg.toLowerCase()) {
        transactionId = t.id
        break
      }
    }
  }

  if (!transactionId) {
    console.error('Usage: node scripts/resend-purchase-access.mjs txn_... | --email buyer@example.com')
    process.exit(1)
  }

  const host = envName === 'sandbox' ? 'sandbox-api.paddle.com' : 'api.paddle.com'
  const tRes = await fetch(`https://${host}/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
  })
  const tJson = await tRes.json()
  if (!tRes.ok) throw new Error(JSON.stringify(tJson))
  const transaction = tJson.data

  const cRes = await fetch(`https://${host}/customers/${transaction.customer_id}`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Paddle-Version': '1' },
  })
  const cJson = await cRes.json()
  const email = String(cJson?.data?.email ?? '').toLowerCase()
  if (!email) throw new Error('No customer email on transaction')

  const custom = transaction.custom_data ?? {}
  const { data: row, error } = await supabase
    .from('purchases')
    .upsert(
      {
        email,
        order_id: transaction.id,
        product_id: custom.product_id ? String(custom.product_id) : null,
        host: custom.host ? String(custom.host) : null,
        ab_variant: custom.ab_variant != null ? Number(custom.ab_variant) : null,
      },
      { onConflict: 'order_id' },
    )
    .select('access_token, email, product_id, order_id')
    .single()

  if (error) throw error

  const link = `${siteUrl()}/access?token=${encodeURIComponent(row.access_token)}`
  console.log('Purchase row ready:')
  console.log('  email:', row.email)
  console.log('  order:', row.order_id)
  console.log('  pack:', row.product_id)
  console.log('  access_token:', row.access_token)
  console.log('  link:', link)

  if (!resendKey) {
    console.warn('RESEND_API_KEY unset — not emailing. Share the link/token above manually.')
    return
  }

  const mailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [row.email],
      subject: 'Your ChronoWalk Rome access link',
      text: [
        'Rome is yours.',
        '',
        'Open this personal link on your phone to unlock ChronoWalk:',
        link,
        '',
        'Or go to chronowalk.com/access and paste this access code:',
        String(row.access_token),
        '',
        row.product_id ? `Pack: ${row.product_id}` : '',
        '',
        'Keep this email — you can restore access anytime at chronowalk.com/access',
      ]
        .filter(Boolean)
        .join('\n'),
    }),
  })

  if (!mailRes.ok) {
    throw new Error(`Resend failed: ${mailRes.status} ${await mailRes.text()}`)
  }
  console.log('Access email sent via Resend.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
