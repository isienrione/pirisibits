/**
 * Paddle Billing webhook — unlocks ChronoWalk purchases.
 *
 * WEBHOOK_BUILD: 2026-07-21-v5
 *
 * WHY v5: transaction.completed payloads do NOT include buyer email (only customer_id).
 * customer.created payloads DO include email — and Paddle already delivers those to this
 * endpoint. We cache customer_id → email, then fulfill on transaction.completed.
 * This does not depend on a follow-up Paddle Customers API read.
 *
 * Paste this ENTIRE file into Supabase → Edge Functions → paddle-webhook → Deploy.
 * Logs / JSON error body MUST contain "2026-07-21-v5".
 *
 * Also run once in SQL Editor: scripts/paddle-customers-migration.sql
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Environment, Paddle } from 'npm:@paddle/paddle-node-sdk@3.8.0'

const WEBHOOK_BUILD = '2026-07-21-v5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, paddle-signature',
}

function resolvePaddleMode() {
  const apiKey = Deno.env.get('PADDLE_API_KEY') ?? ''
  if (!apiKey) throw new Error('PADDLE_API_KEY is not set')
  const envName = (Deno.env.get('PADDLE_ENV') ?? '').toLowerCase()
  const keyIsLive = apiKey.includes('live') || apiKey.startsWith('pdl_live_')
  const keyIsSandbox = apiKey.includes('sdbx') || apiKey.startsWith('pdl_sdbx_')
  const production = keyIsLive
    ? true
    : keyIsSandbox
      ? false
      : envName === 'production' || envName === 'live'
  return {
    apiKey,
    production,
    apiBase: production ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com',
    keyKind: keyIsLive ? 'live' : keyIsSandbox ? 'sandbox' : 'unknown',
    envName: envName || '(unset)',
  }
}

function getPaddle() {
  const mode = resolvePaddleMode()
  return new Paddle(mode.apiKey, {
    environment: mode.production ? Environment.production : Environment.sandbox,
  })
}

function getSupabaseAdmin() {
  const url = Deno.env.get('SUPABASE_URL') ?? Deno.env.get('SB_URL') ?? ''
  const key =
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
    Deno.env.get('SB_SERVICE_ROLE_KEY') ??
    ''
  if (!url || !key) throw new Error('Supabase admin credentials missing')
  return createClient(url, key, { auth: { persistSession: false } })
}

function siteUrl() {
  return (Deno.env.get('SITE_URL') ?? 'https://chronowalk.com').replace(/\/$/, '')
}

function buildAccessLink(accessToken) {
  return `${siteUrl()}/access?token=${encodeURIComponent(accessToken)}`
}

/** Prefer raw webhook JSON — SDK entities strip nested fields and never have email on txns. */
function readPayload(rawBody) {
  const envelope = JSON.parse(rawBody)
  const data = envelope?.data && typeof envelope.data === 'object' ? envelope.data : {}
  return {
    envelope,
    eventType: envelope?.event_type ?? envelope?.eventType ?? null,
    data,
  }
}

function readCustomData(data) {
  const raw = data?.custom_data ?? data?.customData ?? {}
  const custom = raw && typeof raw === 'object' ? raw : {}
  return {
    product_id: custom.product_id ? String(custom.product_id) : null,
    host: custom.host ? String(custom.host) : null,
    ab_variant: custom.ab_variant != null ? Number(custom.ab_variant) : null,
  }
}

async function upsertPaddleCustomer(supabase, { customerId, email }) {
  if (!customerId || !email) return null
  const { data, error } = await supabase
    .from('paddle_customers')
    .upsert(
      {
        customer_id: String(customerId),
        email: String(email).toLowerCase(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'customer_id' },
    )
    .select('customer_id, email')
    .single()
  if (error) throw new Error(`paddle_customers upsert failed: ${error.message}`)
  return data
}

async function emailFromCache(supabase, customerId) {
  if (!customerId) return null
  const { data, error } = await supabase
    .from('paddle_customers')
    .select('email')
    .eq('customer_id', String(customerId))
    .maybeSingle()
  if (error) {
    console.error('[paddle-webhook] paddle_customers lookup failed', error.message)
    return null
  }
  return data?.email ? String(data.email) : null
}

async function emailFromPaddleApi(mode, { orderId, customerId }) {
  const headers = {
    Authorization: `Bearer ${mode.apiKey}`,
    'Paddle-Version': '1',
  }
  const attempts = []

  if (orderId) {
    const url = `${mode.apiBase}/transactions/${encodeURIComponent(orderId)}?include=customer`
    const res = await fetch(url, { headers })
    const text = await res.text()
    attempts.push(`txn ${res.status}`)
    if (res.ok) {
      try {
        const email = JSON.parse(text)?.data?.customer?.email
        if (email) return { email: String(email), attempts }
      } catch {
        /* ignore */
      }
    }
  }

  if (customerId) {
    const url = `${mode.apiBase}/customers/${encodeURIComponent(customerId)}`
    const res = await fetch(url, { headers })
    const text = await res.text()
    attempts.push(`ctm ${res.status}`)
    if (res.ok) {
      try {
        const email = JSON.parse(text)?.data?.email
        if (email) return { email: String(email), attempts }
      } catch {
        /* ignore */
      }
    }
  }

  return { email: null, attempts }
}

async function resolveBuyerEmail(supabase, mode, data) {
  const orderId = data?.id ? String(data.id) : null
  const customerId = data?.customer_id ?? data?.customerId ?? data?.customer?.id ?? null
  const direct =
    data?.customer?.email ??
    data?.email ??
    null

  if (direct) {
    if (customerId) {
      try {
        await upsertPaddleCustomer(supabase, { customerId, email: direct })
      } catch (err) {
        console.warn('[paddle-webhook] cache direct email failed', err)
      }
    }
    return { email: String(direct).toLowerCase(), source: 'payload' }
  }

  const cached = await emailFromCache(supabase, customerId)
  if (cached) return { email: cached.toLowerCase(), source: 'paddle_customers' }

  const api = await emailFromPaddleApi(mode, { orderId, customerId })
  if (api.email) {
    if (customerId) {
      try {
        await upsertPaddleCustomer(supabase, { customerId, email: api.email })
      } catch (err) {
        console.warn('[paddle-webhook] cache api email failed', err)
      }
    }
    return { email: api.email.toLowerCase(), source: `api:${api.attempts.join(',')}` }
  }

  throw new Error(
    [
      `buyer email unresolved (${WEBHOOK_BUILD})`,
      `orderId=${orderId}`,
      `customerId=${customerId}`,
      `cache=miss`,
      `api=[${api.attempts.join(', ') || 'skipped'}]`,
      'Fix: ensure customer.created is stored (run paddle-customers migration) or API can read customers',
    ].join(' | '),
  )
}

async function upsertPurchase(supabase, { email, orderId, productId, host, abVariant }) {
  const { data, error } = await supabase
    .from('purchases')
    .upsert(
      {
        email,
        order_id: orderId,
        product_id: productId,
        host,
        ab_variant: Number.isFinite(abVariant) ? abVariant : null,
      },
      { onConflict: 'order_id' },
    )
    .select('access_token, email, product_id, order_id')
    .single()

  if (error) throw new Error(`purchases upsert failed: ${error.message}`)
  if (!data?.access_token) throw new Error('purchases upsert returned no access_token')
  return data
}

async function sendAccessEmail({ email, accessToken, productId }) {
  const link = buildAccessLink(accessToken)
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM') ?? 'ChronoWalk <hello@chronowalk.com>'

  if (!resendKey) {
    console.error('[paddle-webhook] RESEND_API_KEY unset', { email, link })
    throw new Error('RESEND_API_KEY is not set')
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your ChronoWalk Rome access link',
      text: [
        'Rome is yours.',
        '',
        'Open this personal link on your phone to unlock ChronoWalk:',
        link,
        '',
        'Or go to chronowalk.com/access and paste this access code:',
        String(accessToken),
        '',
        productId ? `Pack: ${productId}` : null,
        '',
        'Keep this email — you can restore access anytime at chronowalk.com/access',
      ]
        .filter(Boolean)
        .join('\n'),
    }),
  })

  if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`)
  console.log('[paddle-webhook] access email sent', { build: WEBHOOK_BUILD, email, productId })
}

async function handleCustomerEvent(supabase, data) {
  const customerId = data?.id
  const email = data?.email
  if (!customerId || !email) {
    console.warn('[paddle-webhook] customer event missing id/email', {
      build: WEBHOOK_BUILD,
      customerId,
      hasEmail: Boolean(email),
    })
    return
  }
  const row = await upsertPaddleCustomer(supabase, { customerId, email })
  console.log('[paddle-webhook] customer cached', { build: WEBHOOK_BUILD, ...row })
}

async function handleTransactionCompleted(supabase, mode, data) {
  const orderId = data?.id
  if (!orderId) throw new Error('transaction missing id')

  const resolved = await resolveBuyerEmail(supabase, mode, data)
  const custom = readCustomData(data)

  console.log('[paddle-webhook] fulfilling transaction.completed', {
    build: WEBHOOK_BUILD,
    orderId,
    email: resolved.email,
    source: resolved.source,
    customerId: data?.customer_id ?? null,
  })

  const row = await upsertPurchase(supabase, {
    email: resolved.email,
    orderId: String(orderId),
    productId: custom.product_id,
    host: custom.host,
    abVariant: custom.ab_variant,
  })

  console.log('[paddle-webhook] purchase upserted', {
    build: WEBHOOK_BUILD,
    orderId: row.order_id,
    email: row.email,
    productId: row.product_id,
    accessToken: row.access_token,
  })

  try {
    await sendAccessEmail({
      email: row.email,
      accessToken: row.access_token,
      productId: row.product_id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[paddle-webhook] access email failed after purchase save', {
      build: WEBHOOK_BUILD,
      orderId: row.order_id,
      email: row.email,
      accessToken: row.access_token,
      link: buildAccessLink(row.access_token),
      message,
    })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', build: WEBHOOK_BUILD }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const signature = req.headers.get('paddle-signature') ?? ''
  const rawBody = await req.text()
  const secret = Deno.env.get('PADDLE_NOTIFICATION_WEBHOOK_SECRET') ?? ''

  console.log('[paddle-webhook] request', { build: WEBHOOK_BUILD })

  if (!signature || !rawBody) {
    return new Response(JSON.stringify({ error: 'Missing signature or body', build: WEBHOOK_BUILD }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const mode = resolvePaddleMode()
    const paddle = getPaddle()
    // Verify signature (throws if invalid). We still fulfill from raw JSON.
    await paddle.webhooks.unmarshal(rawBody, secret, signature)

    const { eventType, data } = readPayload(rawBody)
    const supabase = getSupabaseAdmin()

    if (eventType === 'customer.created' || eventType === 'customer.updated') {
      await handleCustomerEvent(supabase, data)
    } else if (eventType === 'transaction.completed') {
      await handleTransactionCompleted(supabase, mode, data)
    } else {
      console.log('[paddle-webhook] ignored event', { build: WEBHOOK_BUILD, eventType })
    }

    return new Response(JSON.stringify({ received: true, build: WEBHOOK_BUILD }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[paddle-webhook] failed', { build: WEBHOOK_BUILD, message }, err)
    return new Response(JSON.stringify({ error: message, build: WEBHOOK_BUILD }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
