/**
 * Paddle Billing webhook — unlocks ChronoWalk purchases.
 *
 * WEBHOOK_BUILD: 2026-07-21-v4
 * Paste this ENTIRE file into Supabase Edge Function `paddle-webhook` and Deploy.
 * Logs MUST show build "2026-07-21-v4" — if not, redeploy did not take.
 *
 * Required secrets:
 *   PADDLE_API_KEY=pdl_live_apikey_...   (NOT pdl_sdbx_)
 *   PADDLE_ENV=production                (optional if key is live — key wins)
 *   PADDLE_NOTIFICATION_WEBHOOK_SECRET=pdl_ntfset_...
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM=ChronoWalk <hello@chronowalk.com>
 *   SITE_URL=https://chronowalk.com
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Environment, Paddle } from 'npm:@paddle/paddle-node-sdk@3.8.0'

const WEBHOOK_BUILD = '2026-07-21-v4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, paddle-signature',
}

/** Prefer the API key's mode over PADDLE_ENV — wrong env was silently breaking email lookup. */
function resolvePaddleMode() {
  const apiKey = Deno.env.get('PADDLE_API_KEY') ?? ''
  if (!apiKey) throw new Error('PADDLE_API_KEY is not set')

  const envName = (Deno.env.get('PADDLE_ENV') ?? '').toLowerCase()
  const envSaysLive = envName === 'production' || envName === 'live'
  const envSaysSandbox = envName === 'sandbox' || envName === 'test'
  const keyIsLive = apiKey.includes('live') || apiKey.startsWith('pdl_live_')
  const keyIsSandbox = apiKey.includes('sdbx') || apiKey.startsWith('pdl_sdbx_')

  if (keyIsLive && keyIsSandbox) {
    throw new Error('PADDLE_API_KEY looks both live and sandbox — check the secret value')
  }
  if (keyIsSandbox && envSaysLive) {
    throw new Error(
      'PADDLE_API_KEY is sandbox (pdl_sdbx_…) but PADDLE_ENV=production. Set the live pdl_live_apikey_… secret.',
    )
  }

  // Key wins when it clearly indicates mode.
  const production = keyIsLive ? true : keyIsSandbox ? false : envSaysLive || !envSaysSandbox

  if (keyIsLive && envSaysSandbox) {
    console.warn(
      '[paddle-webhook] PADDLE_ENV=sandbox but API key is live — using production API (key wins)',
      { build: WEBHOOK_BUILD },
    )
  }

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

function paddleAuthHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Paddle-Version': '1',
  }
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

function readCustomData(transaction) {
  const raw = transaction?.customData ?? transaction?.custom_data ?? {}
  const data = raw && typeof raw === 'object' ? raw : {}
  return {
    product_id: data.product_id ? String(data.product_id) : null,
    host: data.host ? String(data.host) : null,
    ab_variant: data.ab_variant != null ? Number(data.ab_variant) : null,
  }
}

function customerEmail(transaction) {
  return (
    transaction?.customer?.email ||
    transaction?.details?.totals?.customer?.email ||
    null
  )
}

function customerIdOf(transaction) {
  return (
    transaction?.customerId ||
    transaction?.customer_id ||
    transaction?.customer?.id ||
    null
  )
}

async function fetchJson(url, apiKey) {
  const res = await fetch(url, { headers: paddleAuthHeaders(apiKey) })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  return { ok: res.ok, status: res.status, json, url }
}

/**
 * Webhook payloads almost never include email — only customer_id.
 * Look it up via Paddle API. On failure, throw the REAL API error (do not hide it).
 */
async function resolveCustomerEmail(paddle, transaction, mode) {
  const errors = []
  const direct = customerEmail(transaction)
  if (direct) {
    console.log('[paddle-webhook] email from webhook payload', { build: WEBHOOK_BUILD })
    return String(direct)
  }

  const orderId = transaction?.id
  const customerId = customerIdOf(transaction)

  if (orderId) {
    const url = `${mode.apiBase}/transactions/${encodeURIComponent(orderId)}?include=customer`
    const { ok, status, json } = await fetchJson(url, mode.apiKey)
    if (ok) {
      const email = json?.data?.customer?.email
      if (email) {
        console.log('[paddle-webhook] email from transactions?include=customer', {
          build: WEBHOOK_BUILD,
          orderId,
        })
        return String(email)
      }
      errors.push(
        `transactions?include=customer returned 200 but no customer.email (customer_id=${
          json?.data?.customer_id ?? 'null'
        })`,
      )
    } else {
      const detail = JSON.stringify(json?.error ?? json)?.slice(0, 400)
      errors.push(`GET ${url} -> ${status} ${detail}`)
    }
  } else {
    errors.push('transaction id missing on webhook payload')
  }

  if (customerId) {
    const url = `${mode.apiBase}/customers/${encodeURIComponent(customerId)}`
    const { ok, status, json } = await fetchJson(url, mode.apiKey)
    if (ok) {
      const email = json?.data?.email
      if (email) {
        console.log('[paddle-webhook] email from customers.get', {
          build: WEBHOOK_BUILD,
          customerId,
        })
        return String(email)
      }
      errors.push(`customers.get returned 200 but no email for ${customerId}`)
    } else {
      const detail = JSON.stringify(json?.error ?? json)?.slice(0, 400)
      errors.push(`GET ${url} -> ${status} ${detail}`)
    }

    try {
      const customer = await paddle.customers.get(customerId)
      if (customer?.email) {
        console.log('[paddle-webhook] email from customers.get (sdk)', {
          build: WEBHOOK_BUILD,
          customerId,
        })
        return String(customer.email)
      }
      errors.push(`sdk customers.get returned no email for ${customerId}`)
    } catch (err) {
      errors.push(
        `sdk customers.get failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  } else {
    errors.push('customer_id missing on webhook payload')
  }

  throw new Error(
    [
      `could not resolve buyer email (${WEBHOOK_BUILD})`,
      `key=${mode.keyKind}`,
      `PADDLE_ENV=${mode.envName}`,
      `apiBase=${mode.apiBase}`,
      `orderId=${orderId ?? 'null'}`,
      `customerId=${customerId ?? 'null'}`,
      ...errors,
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

function buildAccessLink(accessToken) {
  return `${siteUrl()}/access?token=${encodeURIComponent(accessToken)}`
}

async function sendAccessEmail({ email, accessToken, productId }) {
  const link = buildAccessLink(accessToken)
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM') ?? 'ChronoWalk <hello@chronowalk.com>'

  if (!resendKey) {
    const msg = `[paddle-webhook] RESEND_API_KEY unset — cannot email access link for ${email}: ${link}`
    console.error(msg)
    throw new Error('RESEND_API_KEY is not set — buyer will not receive unlock email')
  }

  const packLine = productId ? `Pack: ${productId}` : null
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
        packLine,
        '',
        'Keep this email — you can restore access anytime at chronowalk.com/access',
      ]
        .filter(Boolean)
        .join('\n'),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend failed: ${res.status} ${body}`)
  }
  console.log('[paddle-webhook] access email sent', { build: WEBHOOK_BUILD, email, productId })
  return { sent: true, link }
}

async function handleTransactionCompleted(paddle, eventData, mode) {
  const transaction = eventData?.data ?? eventData
  const orderId = transaction?.id
  if (!orderId) throw new Error('transaction missing id')

  console.log('[paddle-webhook] handling transaction.completed', {
    build: WEBHOOK_BUILD,
    orderId,
    customerId: customerIdOf(transaction),
    keyKind: mode.keyKind,
    paddleEnv: mode.envName,
    apiBase: mode.apiBase,
  })

  const email = await resolveCustomerEmail(paddle, transaction, mode)

  const custom = readCustomData(transaction)
  const supabase = getSupabaseAdmin()
  const row = await upsertPurchase(supabase, {
    email: String(email).toLowerCase(),
    orderId,
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

  // Persist first. If email fails, still acknowledge the webhook so Paddle stops
  // retrying and the buyer can be unlocked from `purchases.access_token`.
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('[paddle-webhook] request', { build: WEBHOOK_BUILD, method: req.method })

  const signature = req.headers.get('paddle-signature') ?? ''
  const rawBody = await req.text()
  const secret = Deno.env.get('PADDLE_NOTIFICATION_WEBHOOK_SECRET') ?? ''

  if (!signature || !rawBody) {
    return new Response(JSON.stringify({ error: 'Missing signature or body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const mode = resolvePaddleMode()
    const paddle = getPaddle()
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature)
    const eventType = eventData?.eventType ?? eventData?.event_type

    if (eventType === 'transaction.completed') {
      await handleTransactionCompleted(paddle, eventData, mode)
    } else {
      console.log('[paddle-webhook] ignored event', eventType, { build: WEBHOOK_BUILD })
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
