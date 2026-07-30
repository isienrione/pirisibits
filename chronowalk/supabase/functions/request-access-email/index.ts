/**
 * request-access-email — buyer self-serve fresh ChronoWalk access email.
 *
 * Public (anon key). Always returns a generic ack. Requires email + Paddle order id.
 * Never logs email, order id, claim, or access link in full.
 *
 * BUILD: 2026-07-30-v1-buyer-resend
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { encryptClaimSecret } from '../_shared/claimCrypto.js'
import { freshFulfillmentGenerationFields, maskEmail, maskOrderId } from '../_shared/fulfillmentWorkerLogic.js'
import {
  decideAccessEmailAction,
  genericAccessEmailAck,
  isPlausibleBuyerEmail,
  isPlausibleOrderId,
  normalizeBuyerEmail,
  normalizeOrderId,
} from '../_shared/requestAccessEmailLogic.js'

const BUILD = '2026-07-30-v1-buyer-resend'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

async function enqueueRestoredClaim(supabase, { purchaseId, orderId, rawClaim, keyB64 }) {
  const encrypted = await encryptClaimSecret(rawClaim, keyB64)
  if (!encrypted) return { ok: false, reason: 'claim_encryption_unavailable' }
  const claimExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const generation = freshFulfillmentGenerationFields({ reason: 'buyer_request' })
  generation.last_error = null
  const { error } = await supabase.from('fulfillment_outbox').upsert(
    {
      purchase_id: purchaseId,
      order_id: orderId,
      encrypted_claim: encrypted,
      claim_expires_at: claimExpiresAt,
      ...generation,
    },
    { onConflict: 'purchase_id' },
  )
  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json(405, { ok: false, reason: 'method_not_allowed' })
  }

  const ack = genericAccessEmailAck()

  try {
    let payload: Record<string, unknown> = {}
    try {
      payload = await req.json()
    } catch {
      return json(200, ack)
    }

    const email = normalizeBuyerEmail(payload.email)
    const orderId = normalizeOrderId(payload.orderId ?? payload.order_id)

    if (!isPlausibleBuyerEmail(email) || !isPlausibleOrderId(orderId)) {
      return json(200, ack)
    }

    const supabase = getSupabaseAdmin()
    const claimKey = Deno.env.get('CLAIM_ENCRYPTION_KEY') ?? ''

    const { data: gate } = await supabase.rpc('buyer_access_email_rate_limit', {
      p_email: email,
      p_order_id: orderId,
      p_max_per_hour: 3,
    })

    if (!gate?.allowed) {
      console.log('[request-access-email] rate limited or refused', {
        build: BUILD,
        order: maskOrderId(orderId),
        reason: gate?.reason ?? 'unknown',
      })
      return json(200, ack)
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .select('id, email, product_id, status, seat_limit, order_id')
      .eq('order_id', orderId)
      .maybeSingle()

    if (purchaseError || !purchase) {
      console.log('[request-access-email] no purchase', {
        build: BUILD,
        order: maskOrderId(orderId),
      })
      return json(200, ack)
    }

    const emailMatches = normalizeBuyerEmail(purchase.email) === email
    if (!emailMatches) {
      console.log('[request-access-email] email mismatch', {
        build: BUILD,
        order: maskOrderId(orderId),
        email: maskEmail(email),
      })
      return json(200, ack)
    }

    const { data: outbox } = await supabase
      .from('fulfillment_outbox')
      .select('id, status, encrypted_claim')
      .eq('purchase_id', purchase.id)
      .maybeSingle()

    const { count: activeClaimCount } = await supabase
      .from('purchase_claim_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('purchase_id', purchase.id)
      .in('purpose', ['initial', 'operator_recovery'])
      .is('consumed_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())

    const action = decideAccessEmailAction({
      emailMatches: true,
      purchaseActive: purchase.status === 'active',
      hasCiphertext: Boolean(outbox?.encrypted_claim),
      hasActiveClaim: (activeClaimCount ?? 0) > 0,
    })

    if (action === 'requeue_rotate') {
      const { data: requeued, error: requeueError } = await supabase.rpc(
        'operator_requeue_fulfillment',
        { p_order_id: orderId, p_rotate_generation: true },
      )
      console.log('[request-access-email] requeue', {
        build: BUILD,
        order: maskOrderId(orderId),
        ok: Boolean(requeued?.ok),
        reason: requeued?.reason ?? requeueError?.message ?? null,
      })
      return json(200, ack)
    }

    if (action === 'restore') {
      if (!claimKey) {
        console.warn('[request-access-email] CLAIM_ENCRYPTION_KEY missing', { build: BUILD })
        return json(200, ack)
      }

      const { data: restored, error: restoreError } = await supabase.rpc(
        'operator_restore_purchase_access',
        { p_order_id: orderId, p_reason: 'buyer_request' },
      )

      if (restoreError || !restored?.ok || !restored.claim) {
        console.warn('[request-access-email] restore refused', {
          build: BUILD,
          order: maskOrderId(orderId),
          reason: restored?.reason ?? restoreError?.message ?? 'unknown',
        })
        return json(200, ack)
      }

      const queued = await enqueueRestoredClaim(supabase, {
        purchaseId: restored.purchase_id,
        orderId,
        rawClaim: String(restored.claim),
        keyB64: claimKey,
      })

      console.log('[request-access-email] restore+enqueue', {
        build: BUILD,
        order: maskOrderId(orderId),
        email: maskEmail(email),
        ok: queued.ok,
        reason: queued.ok ? null : queued.reason,
      })
      return json(200, ack)
    }

    return json(200, ack)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown'
    console.error('[request-access-email] failed', { build: BUILD, message })
    return json(200, ack)
  }
})
