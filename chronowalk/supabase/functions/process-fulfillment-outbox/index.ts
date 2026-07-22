/**
 * process-fulfillment-outbox — durable Resend delivery worker.
 *
 * Auth: FULFILLMENT_CRON_SECRET via Authorization: Bearer … or X-Fulfillment-Cron-Secret.
 * Claims due rows with SKIP LOCKED, sends access email, never logs secrets.
 *
 * BUILD: 2026-07-22-v1-outbox-worker
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  accessEmailSubject,
  buildAccessEmailHtml,
  buildAccessEmailText,
  buildAccessLink,
} from '../_shared/accessEmailTemplate.js'
import { decryptClaimSecret } from '../_shared/claimCrypto.js'
import {
  authorizeCronRequest,
  classifyResendResponse,
  computeBackoffSeconds,
  maskOrderId,
  resendIdempotencyKey,
} from '../_shared/fulfillmentWorkerLogic.js'

const WORKER_BUILD = '2026-07-22-v1-outbox-worker'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-fulfillment-cron-secret',
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

async function sendResendAccessEmail({
  to,
  orderId,
  productId,
  seatLimit,
  claim,
  claimExpiresAt,
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''
  const from = Deno.env.get('RESEND_FROM') ?? 'ChronoWalk <hello@chronowalk.com>'
  if (!resendKey) {
    return { ok: false, kind: 'permanent', reason: 'resend_api_key_unset', status: null }
  }

  const link = buildAccessLink(siteUrl(), claim)
  const body = {
    from,
    to: [to],
    subject: accessEmailSubject(productId),
    html: buildAccessEmailHtml({
      accessToken: claim,
      accessLink: link,
      productId,
      seatLimit,
      claimExpiresAt,
      siteUrl: siteUrl(),
    }),
    text: buildAccessEmailText({
      accessToken: claim,
      accessLink: link,
      productId,
      seatLimit,
      claimExpiresAt,
      siteUrl: siteUrl(),
    }),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': resendIdempotencyKey(orderId),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const status = res.status
    // Do not retain full provider body in logs — parse id only.
    let emailId = null
    try {
      const json = await res.json()
      emailId = json?.id ? String(json.id) : null
    } catch {
      emailId = null
    }
    const classified = classifyResendResponse({ status })
    return {
      ok: classified.kind === 'success',
      kind: classified.kind,
      reason: classified.reason,
      status,
      emailId,
    }
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'AbortError'
    const classified = classifyResendResponse({
      status: null,
      timedOut,
      networkError: !timedOut,
    })
    return {
      ok: false,
      kind: classified.kind,
      reason: classified.reason,
      status: null,
      emailId: null,
    }
  } finally {
    clearTimeout(timer)
  }
}

async function processOne(supabase, row, claimKey) {
  const orderId = row.order_id
  const claim = await decryptClaimSecret(row.encrypted_claim, claimKey)
  if (!claim) {
    await supabase.rpc('mark_fulfillment_outbox_permanent_failure', {
      p_outbox_id: row.id,
      p_error: 'decrypt_failed',
      p_provider_status: null,
      p_wipe_claim: false,
    })
    return { orderId, result: 'permanent', reason: 'decrypt_failed' }
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('id, email, product_id, content_product_id, seat_limit, status')
    .eq('id', row.purchase_id)
    .maybeSingle()

  if (purchaseError || !purchase?.email || purchase.status !== 'active') {
    await supabase.rpc('mark_fulfillment_outbox_permanent_failure', {
      p_outbox_id: row.id,
      p_error: 'purchase_unavailable',
      p_provider_status: null,
      p_wipe_claim: false,
    })
    return { orderId, result: 'permanent', reason: 'purchase_unavailable' }
  }

  const send = await sendResendAccessEmail({
    to: purchase.email,
    orderId,
    productId: purchase.product_id,
    seatLimit: purchase.seat_limit,
    claim,
    claimExpiresAt: row.claim_expires_at,
  })

  if (send.ok) {
    await supabase.rpc('mark_fulfillment_outbox_sent', {
      p_outbox_id: row.id,
      p_resend_email_id: send.emailId,
      p_provider_status: send.status,
    })
    console.log('[fulfillment-outbox] sent', {
      build: WORKER_BUILD,
      orderId: maskOrderId(orderId),
      productId: purchase.product_id,
      attempts: row.attempts,
      hasResendId: Boolean(send.emailId),
    })
    return { orderId, result: 'sent' }
  }

  if (send.kind === 'permanent') {
    await supabase.rpc('mark_fulfillment_outbox_permanent_failure', {
      p_outbox_id: row.id,
      p_error: send.reason,
      p_provider_status: send.status,
      p_wipe_claim: false,
    })
    console.warn('[fulfillment-outbox] permanent failure', {
      build: WORKER_BUILD,
      orderId: maskOrderId(orderId),
      reason: send.reason,
      status: send.status,
    })
    return { orderId, result: 'permanent', reason: send.reason }
  }

  const backoff = computeBackoffSeconds(row.attempts)
  await supabase.rpc('mark_fulfillment_outbox_retry', {
    p_outbox_id: row.id,
    p_error: send.reason,
    p_provider_status: send.status,
    p_backoff_seconds: backoff,
  })
  console.warn('[fulfillment-outbox] transient retry scheduled', {
    build: WORKER_BUILD,
    orderId: maskOrderId(orderId),
    reason: send.reason,
    status: send.status,
    backoffSeconds: backoff,
    attempts: row.attempts,
  })
  return { orderId, result: 'retry', reason: send.reason }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', build: WORKER_BUILD }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const cronSecret = Deno.env.get('FULFILLMENT_CRON_SECRET') ?? ''
  const auth = authorizeCronRequest(req, cronSecret)
  if (!auth.ok) {
    return new Response(JSON.stringify({ error: 'Unauthorized', build: WORKER_BUILD }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = getSupabaseAdmin()
    const claimKey = Deno.env.get('CLAIM_ENCRYPTION_KEY') ?? ''
    if (!claimKey) {
      return new Response(
        JSON.stringify({ error: 'CLAIM_ENCRYPTION_KEY unset', build: WORKER_BUILD }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    await supabase.rpc('expire_stale_fulfillment_claims', { p_limit: 50 })

    let limit = 10
    try {
      const body = await req.json()
      if (body?.limit != null) limit = Number(body.limit) || 10
    } catch {
      /* empty body ok */
    }

    const workerId = `edge-${crypto.randomUUID().slice(0, 8)}`
    const { data: rows, error } = await supabase.rpc('claim_due_fulfillment_outbox', {
      p_limit: limit,
      p_worker_id: workerId,
    })
    if (error) throw new Error(error.message)

    const claimed = Array.isArray(rows) ? rows : []
    const results = []
    for (const row of claimed) {
      results.push(await processOne(supabase, row, claimKey))
    }

    console.log('[fulfillment-outbox] batch complete', {
      build: WORKER_BUILD,
      claimed: claimed.length,
      sent: results.filter((r) => r.result === 'sent').length,
      retry: results.filter((r) => r.result === 'retry').length,
      permanent: results.filter((r) => r.result === 'permanent').length,
    })

    return new Response(
      JSON.stringify({
        received: true,
        build: WORKER_BUILD,
        claimed: claimed.length,
        results: results.map((r) => ({
          orderId: maskOrderId(r.orderId),
          result: r.result,
          reason: r.reason ?? null,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[fulfillment-outbox] failed', { build: WORKER_BUILD, message })
    return new Response(JSON.stringify({ error: message, build: WORKER_BUILD }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
