-- Durable fulfillment email generation id for Resend idempotency.
-- Run after 20260722_fulfillment_outbox_worker.sql (non-production first).
--
-- Each newly minted claim/email generation gets a distinct uuid.
-- Resend Idempotency-Key = purchase-access/<order_id>/<email_generation_id>
-- Retries of the same generation keep the same key; operator recovery rotates it.

-- ── column: email_generation_id ─────────────────────────────────────────────
alter table public.fulfillment_outbox
  add column if not exists email_generation_id uuid;

-- Legacy / existing rows: use outbox id as a stable generation fingerprint
-- (secret-safe, deterministic, distinct per row).
update public.fulfillment_outbox
set email_generation_id = id
where email_generation_id is null;

alter table public.fulfillment_outbox
  alter column email_generation_id set default gen_random_uuid();

alter table public.fulfillment_outbox
  alter column email_generation_id set not null;

-- Optional audit: which generation a provider event was correlated to (when matched)
alter table public.resend_webhook_events
  add column if not exists email_generation_id uuid;

-- ── apply_resend_email_event: refuse stale provider events on a newer gen ───
-- Correlate only via current outbox.resend_email_id. Fresh generations clear
-- that id, so older email.* events no longer match. Also refuse terminal
-- mutations while status is still pending/failed (pre-send / retry window).
create or replace function public.apply_resend_email_event(
  p_svix_id text,
  p_event_type text,
  p_resend_email_id text,
  p_occurred_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outbox public.fulfillment_outbox%rowtype;
  v_existing text;
  v_applied boolean := false;
begin
  if p_svix_id is null or length(trim(p_svix_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_svix_id');
  end if;

  select svix_id into v_existing
  from public.resend_webhook_events
  where svix_id = trim(p_svix_id);

  if v_existing is not null then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  if p_resend_email_id is not null and length(trim(p_resend_email_id)) > 0 then
    select * into v_outbox
    from public.fulfillment_outbox
    where resend_email_id = trim(p_resend_email_id)
    for update;
  end if;

  if v_outbox.id is null then
    insert into public.resend_webhook_events (
      svix_id, event_type, resend_email_id, outbox_id, email_generation_id, occurred_at
    ) values (
      trim(p_svix_id),
      coalesce(p_event_type, 'unknown'),
      nullif(trim(coalesce(p_resend_email_id, '')), ''),
      null,
      null,
      p_occurred_at
    );
    return jsonb_build_object('ok', true, 'matched', false, 'reason', 'missing_outbox');
  end if;

  -- Stale provider event vs a newer fulfillment generation that cleared
  -- resend_email_id never reaches here. Extra guard: do not apply terminal
  -- delivery/bounce mutations while the row is awaiting a (re)send.
  if v_outbox.status in ('pending', 'failed', 'cancelled') then
    insert into public.resend_webhook_events (
      svix_id, event_type, resend_email_id, outbox_id, email_generation_id, occurred_at
    ) values (
      trim(p_svix_id),
      coalesce(p_event_type, 'unknown'),
      trim(p_resend_email_id),
      v_outbox.id,
      v_outbox.email_generation_id,
      p_occurred_at
    );
    return jsonb_build_object(
      'ok', true,
      'matched', true,
      'applied', false,
      'reason', 'stale_or_pre_send_generation',
      'outbox_id', v_outbox.id,
      'email_generation_id', v_outbox.email_generation_id,
      'duplicate', false
    );
  end if;

  if p_event_type = 'email.delivered' then
    update public.fulfillment_outbox
    set
      status = 'delivered',
      delivered_at = coalesce(delivered_at, coalesce(p_occurred_at, now())),
      encrypted_claim = null,
      last_error = null,
      updated_at = now()
    where id = v_outbox.id
      and status in ('sent', 'sending', 'delivered');
    v_applied := found;
  elsif p_event_type = 'email.delivery_delayed' then
    update public.fulfillment_outbox
    set
      last_error = 'delivery_delayed',
      updated_at = now()
    where id = v_outbox.id
      and status in ('sent', 'sending');
    v_applied := found;
  elsif p_event_type in ('email.bounced', 'email.complained', 'email.failed') then
    update public.fulfillment_outbox
    set
      status = 'fulfillment_failed',
      last_error = left(p_event_type, 200),
      encrypted_claim = null,
      locked_at = null,
      locked_by = null,
      updated_at = now()
    where id = v_outbox.id
      and status in ('sent', 'sending', 'delivered');
    v_applied := found;
  end if;

  insert into public.resend_webhook_events (
    svix_id, event_type, resend_email_id, outbox_id, email_generation_id, occurred_at
  ) values (
    trim(p_svix_id),
    coalesce(p_event_type, 'unknown'),
    trim(p_resend_email_id),
    v_outbox.id,
    v_outbox.email_generation_id,
    p_occurred_at
  );

  return jsonb_build_object(
    'ok', true,
    'matched', true,
    'applied', v_applied,
    'outbox_id', v_outbox.id,
    'email_generation_id', v_outbox.email_generation_id,
    'duplicate', false
  );
end;
$$;

revoke all on function public.apply_resend_email_event(text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_resend_email_event(text, text, text, timestamptz)
  to service_role;

-- ── operator_requeue: optional generation rotate (preserve ciphertext) ──────
drop function if exists public.operator_requeue_fulfillment(text);

create or replace function public.operator_requeue_fulfillment(
  p_order_id text,
  p_rotate_generation boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outbox public.fulfillment_outbox%rowtype;
  v_active_claim boolean;
  v_new_gen uuid;
begin
  if p_order_id is null or length(trim(p_order_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_order_id');
  end if;

  select * into v_outbox
  from public.fulfillment_outbox
  where order_id = trim(p_order_id)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'missing_outbox');
  end if;

  select exists (
    select 1 from public.purchase_claim_tokens
    where purchase_id = v_outbox.purchase_id
      and purpose in ('initial', 'operator_recovery')
      and consumed_at is null
      and revoked_at is null
      and expires_at > now()
  ) into v_active_claim;

  if v_outbox.encrypted_claim is null then
    return jsonb_build_object(
      'ok', false,
      'reason', case
        when not v_active_claim then 'claim_unavailable'
        else 'ciphertext_missing'
      end,
      'outbox_status', v_outbox.status,
      'attempts', v_outbox.attempts,
      'email_generation_id', v_outbox.email_generation_id
    );
  end if;

  if v_outbox.status = 'delivered' and not coalesce(p_rotate_generation, false) then
    return jsonb_build_object(
      'ok', false,
      'reason', 'already_delivered',
      'outbox_status', v_outbox.status,
      'attempts', v_outbox.attempts,
      'email_generation_id', v_outbox.email_generation_id
    );
  end if;

  -- Rotate only when explicitly requested (fresh Resend idempotency generation).
  -- Preserves encrypted_claim; clears prior email lifecycle fields.
  if coalesce(p_rotate_generation, false) then
    v_new_gen := gen_random_uuid();
    update public.fulfillment_outbox
    set
      status = 'pending',
      next_attempt_at = now(),
      locked_at = null,
      locked_by = null,
      last_error = 'operator_requeue_rotate',
      attempts = 0,
      email_generation_id = v_new_gen,
      sent_at = null,
      delivered_at = null,
      resend_email_id = null,
      last_provider_status = null,
      updated_at = now()
    where id = v_outbox.id;

    return jsonb_build_object(
      'ok', true,
      'requeued', true,
      'rotated_generation', true,
      'outbox_status', 'pending',
      'attempts', 0,
      'has_encrypted_claim', true,
      'email_generation_id', v_new_gen
    );
  end if;

  update public.fulfillment_outbox
  set
    status = 'pending',
    next_attempt_at = now(),
    locked_at = null,
    locked_by = null,
    last_error = 'operator_requeue',
    -- Keep attempts for observability; allow another send window.
    attempts = least(attempts, greatest(max_attempts - 1, 0)),
    updated_at = now()
  where id = v_outbox.id;

  return jsonb_build_object(
    'ok', true,
    'requeued', true,
    'rotated_generation', false,
    'outbox_status', 'pending',
    'attempts', v_outbox.attempts,
    'has_encrypted_claim', true,
    'email_generation_id', v_outbox.email_generation_id
  );
end;
$$;

revoke all on function public.operator_requeue_fulfillment(text, boolean)
  from public, anon, authenticated;
grant execute on function public.operator_requeue_fulfillment(text, boolean) to service_role;
