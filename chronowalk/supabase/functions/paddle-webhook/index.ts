/**
 * Paddle Billing webhook — unlocks ChronoWalk purchases.
 *
 * Deploy:
 *   supabase functions deploy paddle-webhook
 *   supabase secrets set PADDLE_API_KEY=... PADDLE_NOTIFICATION_WEBHOOK_SECRET=... \
 *     SITE_URL=https://chronowalk.com SUPABASE_SERVICE_ROLE_KEY=...
 *
 * Paddle notification URL:
 *   https://<PROJECT_REF>.supabase.co/functions/v1/paddle-webhook
 * Events: transaction.completed (minimum)
 *
 * Email: wire RESEND_API_KEY (or another provider) in sendAccessEmail below.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Environment, Paddle } from 'npm:@paddle/paddle-node-sdk@3.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, paddle-signature',
}

function getPaddle() {
  const apiKey = Deno.env.get('PADDLE_API_KEY') ?? ''
  if (!apiKey) throw new Error('PADDLE_API_KEY is not set')
  const envName = (Deno.env.get('PADDLE_ENV') ?? 'sandbox').toLowerCase()
  const environment =
    envName === 'production' || envName === 'live'
      ? Environment.production
      : Environment.sandbox
  return new Paddle(apiKey, { environment })
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

/** Webhook payloads often only include customer_id — look up email via API. */
async function resolveCustomerEmail(paddle, transaction) {
  const direct = customerEmail(transaction)
  if (direct) return String(direct)

  const customerId = customerIdOf(transaction)
  if (!customerId) return null

  try {
    const customer = await paddle.customers.get(customerId)
    return customer?.email ? String(customer.email) : null
  } catch (err) {
    console.error('[paddle-webhook] customers.get failed', customerId, err)
    return null
  }
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
    .select('access_token, email, product_id')
    .single()

  if (error) throw error
  return data
}

async function sendAccessEmail({ email, accessToken, productId }) {
  const link = `${siteUrl()}/access?token=${encodeURIComponent(accessToken)}`
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('RESEND_FROM') ?? 'ChronoWalk <access@chronowalk.com>'

  if (!resendKey) {
    console.warn('[paddle-webhook] RESEND_API_KEY unset — access link:', link)
    return { sent: false, link }
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
        productId ? `Pack: ${productId}` : '',
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
  return { sent: true, link }
}

async function handleTransactionCompleted(paddle, eventData) {
  const transaction = eventData?.data ?? eventData
  const orderId = transaction?.id
  if (!orderId) throw new Error('transaction missing id')

  const email = await resolveCustomerEmail(paddle, transaction)
  if (!email) {
    console.warn('[paddle-webhook] no email on transaction', orderId)
    throw new Error('transaction.completed missing customer email')
  }

  const custom = readCustomData(transaction)
  const supabase = getSupabaseAdmin()
  const row = await upsertPurchase(supabase, {
    email: String(email).toLowerCase(),
    orderId,
    productId: custom.product_id,
    host: custom.host,
    abVariant: custom.ab_variant,
  })

  await sendAccessEmail({
    email: row.email,
    accessToken: row.access_token,
    productId: row.product_id,
  })
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
    const paddle = getPaddle()
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature)
    const eventType = eventData?.eventType ?? eventData?.event_type

    if (eventType === 'transaction.completed') {
      await handleTransactionCompleted(paddle, eventData)
    } else {
      // Other subscribed events are acknowledged so Paddle stops retrying.
      console.log('[paddle-webhook] ignored event', eventType)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[paddle-webhook]', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
