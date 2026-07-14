/**
 * Lemon Squeezy → ChronoWalk purchase webhook (placeholder).
 *
 * Deploy with Supabase Edge Functions once store + signing secret are confirmed.
 * Does NOT run until you set secrets and `supabase functions deploy`.
 *
 * Expected Lemon event: `order_created` (and optionally `order_refunded`).
 * Custom checkout fields from the site:
 *   checkout[custom][host]
 *   checkout[custom][ab_variant]
 *   checkout[custom][product_id]
 *
 * Flow:
 *  1. Verify `X-Signature` with LEMON_SQUEEZY_WEBHOOK_SECRET
 *  2. Upsert `public.purchases` (email, order_id, host, ab_variant)
 *  3. Email magic link: https://{SITE}/access?token={access_token}
 *  4. Optional success URL: https://{SITE}/access/confirmed
 *
 * Secrets (Dashboard → Edge Functions → Secrets):
 *   LEMON_SQUEEZY_WEBHOOK_SECRET
 *   SUPABASE_SERVICE_ROLE_KEY  (auto in hosted Functions)
 *   SITE_URL=https://chronowalk.com
 *   RESEND_API_KEY (or your mail provider)
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
  const theirSig = req.headers.get('X-Signature') ?? ''
  const ours = await hmacHex(secret, raw)
  if (!theirSig || theirSig !== ours) {
    return new Response(JSON.stringify({ ok: false, reason: 'bad_signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = JSON.parse(raw)
  const eventName = payload?.meta?.event_name ?? payload?.event_name
  if (eventName !== 'order_created') {
    return new Response(JSON.stringify({ ok: true, ignored: eventName }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const attrs = payload?.data?.attributes ?? {}
  const custom = payload?.meta?.custom_data ?? attrs?.custom_data ?? {}
  const email = String(attrs.user_email ?? attrs.email ?? '').trim().toLowerCase()
  const orderId = String(payload?.data?.id ?? attrs.order_number ?? '').trim()

  if (!email || !orderId) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing_fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await supabase
    .from('purchases')
    .upsert(
      {
        email,
        order_id: orderId,
        host: custom.host ?? null,
        ab_variant: custom.ab_variant ? Number(custom.ab_variant) : null,
      },
      { onConflict: 'order_id' },
    )
    .select('access_token')
    .single()

  if (error) {
    console.error('[lemon-webhook] upsert failed', error)
    return new Response(JSON.stringify({ ok: false, reason: 'db' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const site = (Deno.env.get('SITE_URL') ?? 'https://chronowalk.com').replace(/\/$/, '')
  const accessUrl = `${site}/access?token=${data.access_token}`

  // TODO: send email with accessUrl via your provider (Resend / Postmark / etc.)
  console.log('[lemon-webhook] access ready', { email, orderId, accessUrl, product: custom.product_id })

  return new Response(JSON.stringify({ ok: true, access_token: data.access_token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
