/**
 * Signed Resend webhook — delivery / bounce / complaint updates for outbox rows.
 * Deduplicates on Svix event id. Never logs email, tokens, or full payloads.
 *
 * BUILD: 2026-07-22-v1-resend-webhook
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { maskId, verifySvixSignature } from '../_shared/fulfillmentWorkerLogic.js'

const WEBHOOK_BUILD = '2026-07-22-v1-resend-webhook'

const HANDLED = new Set([
  'email.delivered',
  'email.delivery_delayed',
  'email.bounced',
  'email.complained',
  'email.failed',
])

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
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

function headerMap(req) {
  const out = {}
  for (const [k, v] of req.headers.entries()) out[k.toLowerCase()] = v
  // Preserve common casings for verifier
  out['svix-id'] = req.headers.get('svix-id') ?? ''
  out['svix-timestamp'] = req.headers.get('svix-timestamp') ?? ''
  out['svix-signature'] = req.headers.get('svix-signature') ?? ''
  return out
}

function extractEmailId(payload) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : {}
  return (
    data.email_id ??
    data.emailId ??
    data.id ??
    payload?.email_id ??
    null
  )
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

  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''
  const rawBody = await req.text()
  const headers = headerMap(req)

  const verified = await verifySvixSignature({
    payload: rawBody,
    headers,
    secret,
  })
  if (!verified.ok) {
    console.warn('[resend-webhook] signature rejected', {
      build: WEBHOOK_BUILD,
      reason: verified.reason,
    })
    return new Response(JSON.stringify({ error: 'Invalid signature', build: WEBHOOK_BUILD }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let envelope
  try {
    envelope = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON', build: WEBHOOK_BUILD }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const eventType = envelope?.type ?? envelope?.event_type ?? null
  const svixId = headers['svix-id']
  const emailId = extractEmailId(envelope)

  if (!eventType || !HANDLED.has(String(eventType))) {
    console.log('[resend-webhook] ignored event', {
      build: WEBHOOK_BUILD,
      eventType,
      svixId: svixId ? maskId(svixId) : null,
    })
    return new Response(JSON.stringify({ received: true, ignored: true, build: WEBHOOK_BUILD }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('apply_resend_email_event', {
      p_svix_id: svixId,
      p_event_type: String(eventType),
      p_resend_email_id: emailId ? String(emailId) : null,
      p_occurred_at: envelope?.created_at ?? envelope?.data?.created_at ?? null,
    })
    if (error) throw new Error(error.message)

    console.log('[resend-webhook] applied', {
      build: WEBHOOK_BUILD,
      eventType,
      svixId: maskId(svixId),
      emailId: emailId ? maskId(emailId) : null,
      duplicate: Boolean(data?.duplicate),
      matched: data?.matched !== false,
      reason: data?.reason ?? null,
    })

    return new Response(
      JSON.stringify({
        received: true,
        build: WEBHOOK_BUILD,
        duplicate: Boolean(data?.duplicate),
        matched: Boolean(data?.matched),
        reason: data?.reason ?? null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[resend-webhook] failed', { build: WEBHOOK_BUILD, message })
    return new Response(JSON.stringify({ error: message, build: WEBHOOK_BUILD }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
