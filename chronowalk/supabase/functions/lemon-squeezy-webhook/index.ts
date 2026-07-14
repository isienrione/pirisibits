/**
 * Lemon Squeezy → ChronoWalk purchase webhook.
 *
 * Deploy:
 *   supabase secrets set LEMON_SQUEEZY_WEBHOOK_SECRET=... SITE_URL=https://chronowalk.com RESEND_API_KEY=...
 *   supabase functions deploy lemon-squeezy-webhook
 *
 * Lemon dashboard webhook URL:
 *   https://<PROJECT_REF>.supabase.co/functions/v1/lemon-squeezy-webhook
 * Events: order_created (optional: order_refunded)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const enc = new TextEncoder()

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function sendAccessEmail(email: string, accessUrl: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('TRANSACTIONAL_FROM') ?? 'ChronoWalk <access@chronowalk.com>'
  if (!apiKey) {
    console.warn('[lemon-webhook] RESEND_API_KEY missing — skipping email', { email, accessUrl })
    return false
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your ChronoWalk access link — Rome is yours',
      text: [
        'Rome is yours.',
        '',
        'Open this link on your phone to unlock ChronoWalk:',
        accessUrl,
        '',
        'Keep this email — it works on any device.',
        '',
        '— ChronoWalk',
      ].join('\n'),
    }),
  })

  if (!res.ok) {
    console.error('[lemon-webhook] Resend failed', await res.text())
    return false
  }
  return true
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET')
  if (!secret) {
    console.error('[lemon-webhook] LEMON_SQUEEZY_WEBHOOK_SECRET missing')
    return new Response(JSON.stringify({ ok: false, reason: 'not_configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const raw = await req.text()
  const theirSig = (req.headers.get('X-Signature') ?? '').trim().toLowerCase()
  const ours = (await hmacHex(secret, raw)).toLowerCase()
  if (!timingSafeEqualHex(theirSig, ours)) {
    return new Response(JSON.stringify({ ok: false, reason: 'bad_signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'bad_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const meta = (payload.meta ?? {}) as Record<string, unknown>
  const data = (payload.data ?? {}) as Record<string, unknown>
  const attrs = (data.attributes ?? {}) as Record<string, unknown>
  const eventName = String(meta.event_name ?? '')

  if (eventName === 'order_refunded') {
    // Soft-ack — manual revoke / future flag. Do not delete access mid-tour silently.
    console.log('[lemon-webhook] refund noted', { order: data.id })
    return new Response(JSON.stringify({ ok: true, refund: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (eventName !== 'order_created') {
    return new Response(JSON.stringify({ ok: true, ignored: eventName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const custom = (meta.custom_data ?? attrs.first_order_item ?? {}) as Record<string, unknown>
  // Lemon puts checkout custom fields under meta.custom_data
  const customData = (meta.custom_data ?? {}) as Record<string, unknown>
  const email = String(attrs.user_email ?? attrs.email ?? '')
    .trim()
    .toLowerCase()
  const orderId = String(data.id ?? attrs.order_number ?? '').trim()

  if (!email || !orderId) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing_fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, reason: 'supabase_env' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const row = {
    email,
    order_id: orderId,
    host: customData.host != null ? String(customData.host) : null,
    ab_variant: customData.ab_variant != null ? Number(customData.ab_variant) : null,
    product_id: customData.product_id != null ? String(customData.product_id) : null,
  }

  const { data: purchase, error } = await supabase
    .from('purchases')
    .upsert(row, { onConflict: 'order_id' })
    .select('access_token')
    .single()

  if (error || !purchase?.access_token) {
    console.error('[lemon-webhook] upsert failed', error)
    return new Response(JSON.stringify({ ok: false, reason: 'db' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const site = (Deno.env.get('SITE_URL') ?? 'https://chronowalk.com').replace(/\/$/, '')
  const accessUrl = `${site}/access?token=${purchase.access_token}`
  const emailed = await sendAccessEmail(email, accessUrl)

  console.log('[lemon-webhook] access ready', {
    email,
    orderId,
    product: customData.product_id ?? custom?.product_id,
    emailed,
  })

  return new Response(
    JSON.stringify({ ok: true, access_token: purchase.access_token, emailed }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
})
