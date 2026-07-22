/**
 * Paddle Billing webhook — unlocks ChronoWalk purchases.
 *
 * WEBHOOK_BUILD: 2026-07-21-v9-price-map
 *
 * Entitlement is derived only from data.items[].price.id via server secrets
 * PADDLE_PRICE_ROME_*. custom_data.product_id is attribution only.
 * Successful entitlement does not depend on Resend during the Paddle request.
 *
 * Deploy the paddle-webhook function directory (index + local modules).
 * Logs / JSON MUST contain "2026-07-21-v9-price-map".
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { Environment, Paddle } from 'npm:@paddle/paddle-node-sdk@3.8.0'
import {
  buildServerPriceMap,
  isDuplicateWebhookInbox,
  isValidEmail,
  maskEmail,
  maskId,
  paddlePayloadEmailCandidate,
  resolveLaunchEntitlementFromTransaction,
  shouldIgnoreOutOfOrderEvent,
} from './fulfillmentLogic.js'

const WEBHOOK_BUILD = '2026-07-21-v9-price-map'

function readServerPriceEnv() {
  return {
    PADDLE_PRICE_ROME_CENTRAL: Deno.env.get('PADDLE_PRICE_ROME_CENTRAL'),
    PADDLE_PRICE_ROME_ESSENTIAL: Deno.env.get('PADDLE_PRICE_ROME_ESSENTIAL'),
    PADDLE_PRICE_ROME_COMPLETE: Deno.env.get('PADDLE_PRICE_ROME_COMPLETE'),
    PADDLE_PRICE_ROME_COUPLE: Deno.env.get('PADDLE_PRICE_ROME_COUPLE'),
    PADDLE_PRICE_ROME_FAMILY: Deno.env.get('PADDLE_PRICE_ROME_FAMILY'),
  }
}

const PRICE_MAP_RESULT = buildServerPriceMap(readServerPriceEnv())
if (!PRICE_MAP_RESULT.ok) {
  console.error('[paddle-webhook] price map invalid at startup', {
    build: WEBHOOK_BUILD,
    reason: PRICE_MAP_RESULT.reason,
    message: PRICE_MAP_RESULT.message,
  })
}
const SERVER_PRICE_MAP = PRICE_MAP_RESULT.ok ? PRICE_MAP_RESULT.map : new Map()

/* Access email HTML lives in accessEmailHtml.ts / fulfillment worker — not sent during the Paddle webhook request. */


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


async function encryptClaimSecret(rawClaim) {
  const keyB64 = Deno.env.get('CLAIM_ENCRYPTION_KEY') ?? ''
  if (!keyB64) return null
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0))
  if (keyBytes.byteLength !== 32) return null
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(rawClaim),
  )
  const packed = new Uint8Array(iv.byteLength + cipher.byteLength)
  packed.set(iv, 0)
  packed.set(new Uint8Array(cipher), iv.byteLength)
  return btoa(String.fromCharCode(...packed))
}

async function recordWebhookEvent(supabase, envelope, eventType, { operatorReview = false } = {}) {
  const eventId = envelope?.event_id ?? envelope?.notification_id ?? null
  const { data, error } = await supabase.rpc('record_paddle_webhook_event', {
    p_event_id: eventId ? String(eventId) : null,
    p_event_type: eventType ? String(eventType) : 'unknown',
    p_occurred_at: envelope?.occurred_at ?? null,
    p_payload: {
      event_type: eventType,
      data_id: envelope?.data?.id ?? null,
      operator_review: operatorReview,
    },
  })
  if (error) throw new Error(`webhook inbox failed: ${error.message}`)
  if (operatorReview && eventId) {
    await supabase
      .from('paddle_webhook_events')
      .update({ operator_review: true, status: 'failed', last_error: 'operator_review' })
      .eq('event_id', String(eventId))
  }
  return data
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
  // Never use custom_data / browser fields as authoritative buyer email.
  const direct = paddlePayloadEmailCandidate(data)

  if (direct) {
    if (customerId) {
      try {
        await upsertPaddleCustomer(supabase, { customerId, email: direct })
      } catch (err) {
        console.warn('[paddle-webhook] cache direct email failed', err)
      }
    }
    return { email: direct, source: 'payload' }
  }

  const cached = await emailFromCache(supabase, customerId)
  if (cached && isValidEmail(cached)) {
    return { email: cached.toLowerCase(), source: 'paddle_customers' }
  }

  const api = await emailFromPaddleApi(mode, { orderId, customerId })
  if (api.email && isValidEmail(api.email)) {
    const email = String(api.email).trim().toLowerCase()
    if (customerId) {
      try {
        await upsertPaddleCustomer(supabase, { customerId, email })
      } catch (err) {
        console.warn('[paddle-webhook] cache api email failed', err)
      }
    }
    return { email, source: `api:${api.attempts.join(',')}` }
  }

  throw new Error(
    [
      `buyer email unresolved (${WEBHOOK_BUILD})`,
      `orderId=${orderId ? maskId(orderId) : 'null'}`,
      `customerId=${customerId ? maskId(customerId) : 'null'}`,
      'cache=miss',
      `api=[${api.attempts.join(', ') || 'skipped'}]`,
    ].join(' | '),
  )
}

async function upsertPurchase(supabase, {
  email,
  orderId,
  productId,
  contentProductId,
  seatLimit,
  priceId,
  paddleCustomerId,
  currencyCode,
  amountCents,
  host,
  abVariant,
}) {
  const { data, error } = await supabase
    .from('purchases')
    .upsert(
      {
        email,
        order_id: orderId,
        product_id: productId,
        content_product_id: contentProductId,
        seat_limit: seatLimit,
        price_id: priceId,
        paddle_customer_id: paddleCustomerId,
        currency_code: currencyCode,
        amount_cents: amountCents,
        status: 'active',
        host,
        ab_variant: Number.isFinite(abVariant) ? abVariant : null,
        fulfilled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'order_id' },
    )
    .select('id, email, product_id, content_product_id, seat_limit, order_id, status')
    .single()

  if (error) throw new Error(`purchases upsert failed: ${error.message}`)
  if (!data?.id) throw new Error('purchases upsert returned no id')
  return data
}

async function ensureBundleIfNeeded(supabase, purchase) {
  if (!['rome-couple', 'rome-family'].includes(purchase.product_id)) return null
  const { data, error } = await supabase.rpc('ensure_paid_bundle', {
    p_purchase_id: purchase.id,
  })
  if (error) throw new Error(`ensure_paid_bundle failed: ${error.message}`)
  return data
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
  await upsertPaddleCustomer(supabase, { customerId, email })
  console.log('[paddle-webhook] customer cached', {
    build: WEBHOOK_BUILD,
    customerId: maskId(customerId),
  })
}

async function markOperatorReview(supabase, envelope, reason) {
  const eventId = envelope?.event_id ?? null
  console.warn('[paddle-webhook] operator review', {
    build: WEBHOOK_BUILD,
    reason,
    eventId: eventId ? maskId(eventId) : null,
    orderId: envelope?.data?.id ? maskId(envelope.data.id) : null,
  })
  if (eventId) {
    await supabase
      .from('paddle_webhook_events')
      .update({
        operator_review: true,
        status: 'failed',
        last_error: String(reason).slice(0, 200),
      })
      .eq('event_id', String(eventId))
  }
}

async function enqueueFulfillmentOnly(supabase, purchase, rawClaim) {
  const encrypted = await encryptClaimSecret(rawClaim)
  const claimExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('fulfillment_outbox').upsert(
    {
      purchase_id: purchase.id,
      order_id: purchase.order_id,
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
      encrypted_claim: encrypted,
      claim_expires_at: claimExpiresAt,
      last_error: encrypted ? null : 'claim_encryption_unavailable',
    },
    { onConflict: 'purchase_id' },
  )
  if (error) throw new Error(`fulfillment_outbox upsert failed: ${error.message}`)
  // Raw claim must not remain in DB plaintext — only ciphertext (when key present).
}

async function handleTransactionCompleted(supabase, mode, data, envelope) {
  if (!PRICE_MAP_RESULT.ok || SERVER_PRICE_MAP.size === 0) {
    await markOperatorReview(supabase, envelope, 'price_map_invalid')
    return { ok: false, reason: 'price_map_invalid' }
  }

  const resolvedEntitlement = resolveLaunchEntitlementFromTransaction(data, SERVER_PRICE_MAP)
  if (!resolvedEntitlement.ok) {
    if (resolvedEntitlement.operatorReview) {
      await markOperatorReview(supabase, envelope, resolvedEntitlement.reason)
    }
    return resolvedEntitlement
  }

  const orderId = data?.id
  if (!orderId) {
    await markOperatorReview(supabase, envelope, 'missing_order_id')
    return { ok: false, reason: 'missing_order_id' }
  }

  const occurredAt = envelope?.occurred_at ?? null
  const { data: existing } = await supabase
    .from('purchases')
    .select('id, status, last_event_occurred_at')
    .eq('order_id', String(orderId))
    .maybeSingle()

  if (
    existing &&
    shouldIgnoreOutOfOrderEvent(occurredAt, existing.last_event_occurred_at)
  ) {
    console.log('[paddle-webhook] ignoring older event', {
      build: WEBHOOK_BUILD,
      orderId: maskId(orderId),
    })
    return { ok: true, ignored: true, reason: 'out_of_order' }
  }

  let resolvedEmail
  try {
    resolvedEmail = await resolveBuyerEmail(supabase, mode, data)
  } catch {
    await markOperatorReview(supabase, envelope, 'email_unresolved')
    return { ok: false, reason: 'email_unresolved' }
  }

  if (resolvedEntitlement.attributionMismatch) {
    console.warn('[paddle-webhook] custom_data product mismatch (using server SKU)', {
      build: WEBHOOK_BUILD,
      orderId: maskId(orderId),
      claimed: resolvedEntitlement.attributionMismatch.claimed,
      derived: resolvedEntitlement.attributionMismatch.derived,
    })
  }

  console.log('[paddle-webhook] fulfilling transaction.completed', {
    build: WEBHOOK_BUILD,
    orderId: maskId(orderId),
    email: maskEmail(resolvedEmail.email),
    source: resolvedEmail.source,
    priceId: resolvedEntitlement.priceId,
    productId: resolvedEntitlement.productId,
    contentProductId: resolvedEntitlement.contentProductId,
    seatLimit: resolvedEntitlement.seatLimit,
  })

  const row = await upsertPurchase(supabase, {
    email: resolvedEmail.email,
    orderId: String(orderId),
    productId: resolvedEntitlement.productId,
    contentProductId: resolvedEntitlement.contentProductId,
    seatLimit: resolvedEntitlement.seatLimit,
    priceId: resolvedEntitlement.priceId,
    paddleCustomerId: data?.customer_id ? String(data.customer_id) : null,
    currencyCode: resolvedEntitlement.currencyCode,
    amountCents: resolvedEntitlement.amountCents,
    host: resolvedEntitlement.custom.host,
    abVariant: resolvedEntitlement.custom.ab_variant,
  })

  await supabase
    .from('purchases')
    .update({
      last_event_occurred_at: occurredAt,
      consent_version: resolvedEntitlement.custom.consent_version,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id)

  // Bundle + seats are created only for paid couple/family SKUs (server-derived).
  await ensureBundleIfNeeded(supabase, row)

  // Issue claim + enqueue outbox atomically relative to purchase success.
  // Email delivery is async — entitlement must not depend on Resend here.
  const { data: claim, error: claimError } = await supabase.rpc('issue_purchase_claim', {
    p_purchase_id: row.id,
    p_purpose: 'initial',
  })
  if (claimError || !claim) {
    await markOperatorReview(supabase, envelope, 'claim_issue_failed')
    return { ok: false, reason: 'claim_issue_failed' }
  }
  await enqueueFulfillmentOnly(supabase, row, String(claim))

  console.log('[paddle-webhook] purchase entitled + fulfillment enqueued', {
    build: WEBHOOK_BUILD,
    orderId: maskId(row.order_id),
    productId: row.product_id,
    contentProductId: row.content_product_id,
    seatLimit: row.seat_limit,
  })

  return { ok: true, purchaseId: row.id }
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

    const { envelope, eventType, data } = readPayload(rawBody)
    const supabase = getSupabaseAdmin()

    const inbox = await recordWebhookEvent(supabase, envelope, eventType)
    if (isDuplicateWebhookInbox(inbox)) {
      console.log('[paddle-webhook] duplicate event ignored', {
        build: WEBHOOK_BUILD,
        eventType,
        eventId: envelope?.event_id ? maskId(envelope.event_id) : null,
      })
      return new Response(
        JSON.stringify({ received: true, duplicate: true, build: WEBHOOK_BUILD }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (eventType === 'customer.created' || eventType === 'customer.updated') {
      await handleCustomerEvent(supabase, data)
    } else if (eventType === 'transaction.completed') {
      await handleTransactionCompleted(supabase, mode, data, envelope)
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
