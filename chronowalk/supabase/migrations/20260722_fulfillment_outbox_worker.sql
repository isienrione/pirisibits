-- Durable fulfillment outbox worker support.
-- Run after 20260721_paddle_price_fulfillment.sql (non-production first).
--
-- Retry policy (documented):
--   max attempts = 8
--   backoff = min(30s * 2^attempt, 6h) after each transient failure
--   permanent provider/client errors → status = fulfillment_failed

-- ── status: add fulfillment_failed ──────────────────────────────────────────
alter table public.fulfillment_outbox drop constraint if exists fulfillment_outbox_status_check;
alter table public.fulfillment_outbox
  add constraint fulfillment_outbox_status_check
  check (status in (
    'pending', 'sending', 'sent', 'delivered', 'failed',
    'fulfillment_failed', 'cancelled'
  ));

alter table public.fulfillment_outbox
  add column if not exists locked_at timestamptz;

alter table public.fulfillment_outbox
  add column if not exists locked_by text;

alter table public.fulfillment_outbox
  add column if not exists max_attempts integer not null default 8;

alter table public.fulfillment_outbox
  add column if not exists last_provider_status integer;

-- Svix / Resend webhook inbox (dedupe by svix-id)
create table if not exists public.resend_webhook_events (
  svix_id text primary key,
  event_type text not null,
  resend_email_id text,
  outbox_id uuid references public.fulfillment_outbox (id) on delete set null,
  occurred_at timestamptz,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists resend_webhook_events_email_idx
  on public.resend_webhook_events (resend_email_id);

alter table public.resend_webhook_events enable row level security;
drop policy if exists "resend_webhook_events service only" on public.resend_webhook_events;
create policy "resend_webhook_events service only"
  on public.resend_webhook_events for all
  to service_role
  using (true)
  with check (true);

alter table public.fulfillment_outbox
  add column if not exists updated_at timestamptz not null default now();

-- Wipe ciphertext when claim is consumed / revoked / expired cleanup
create or replace function public._cw_wipe_outbox_claim(p_purchase_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.fulfillment_outbox
  set
    encrypted_claim = null,
    updated_at = now()
  where purchase_id = p_purchase_id
    and encrypted_claim is not null;
$$;

revoke all on function public._cw_wipe_outbox_claim(uuid) from public, anon, authenticated;
grant execute on function public._cw_wipe_outbox_claim(uuid) to service_role;

create or replace function public._cw_on_claim_token_terminal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    (new.consumed_at is not null and old.consumed_at is null)
    or (new.revoked_at is not null and old.revoked_at is null)
  ) then
    perform public._cw_wipe_outbox_claim(new.purchase_id);
  end if;
  return new;
end;
$$;

drop trigger if exists purchase_claim_tokens_wipe_outbox on public.purchase_claim_tokens;
create trigger purchase_claim_tokens_wipe_outbox
  after update of consumed_at, revoked_at on public.purchase_claim_tokens
  for each row
  execute function public._cw_on_claim_token_terminal();

-- Issue at most one active initial claim; return raw only when newly minted.
create or replace function public.ensure_initial_purchase_claim(
  p_purchase_id uuid,
  p_ttl interval default interval '7 days'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_id uuid;
  v_outbox public.fulfillment_outbox%rowtype;
  v_raw text;
begin
  if not exists (
    select 1 from public.purchases
    where id = p_purchase_id and status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'purchase_not_active');
  end if;

  select id into v_active_id
  from public.purchase_claim_tokens
  where purchase_id = p_purchase_id
    and purpose = 'initial'
    and consumed_at is null
    and revoked_at is null
    and expires_at > now()
  order by created_at asc
  limit 1
  for update;

  select * into v_outbox
  from public.fulfillment_outbox
  where purchase_id = p_purchase_id
  for update;

  if v_active_id is not null then
    -- Still-active claim: never mint another usable secret.
    return jsonb_build_object(
      'ok', true,
      'issued', false,
      'reason', 'active_claim_exists',
      'has_encrypted_outbox', (v_outbox.encrypted_claim is not null),
      'outbox_status', v_outbox.status
    );
  end if;

  if v_outbox.id is not null
     and v_outbox.encrypted_claim is not null
     and v_outbox.status in ('pending', 'sending', 'sent', 'failed')
  then
    -- Ciphertext retained for retry; do not mint.
    return jsonb_build_object(
      'ok', true,
      'issued', false,
      'reason', 'outbox_ciphertext_present',
      'has_encrypted_outbox', true,
      'outbox_status', v_outbox.status
    );
  end if;

  v_raw := public.issue_purchase_claim(p_purchase_id, 'initial', p_ttl);
  return jsonb_build_object(
    'ok', true,
    'issued', true,
    'claim', v_raw,
    'has_encrypted_outbox', false
  );
end;
$$;

revoke all on function public.ensure_initial_purchase_claim(uuid, interval)
  from public, anon, authenticated;
grant execute on function public.ensure_initial_purchase_claim(uuid, interval) to service_role;

-- Concurrent-safe claim of due outbox rows
create or replace function public.claim_due_fulfillment_outbox(
  p_limit integer default 10,
  p_worker_id text default 'worker'
)
returns setof public.fulfillment_outbox
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int := greatest(1, least(coalesce(p_limit, 10), 50));
  v_stale interval := interval '10 minutes';
begin
  return query
  with due as (
    select o.id
    from public.fulfillment_outbox o
    where o.next_attempt_at <= now()
      and (
        o.status in ('pending', 'failed')
        or (
          o.status = 'sending'
          and o.locked_at is not null
          and o.locked_at < now() - v_stale
        )
      )
      and o.attempts < o.max_attempts
      and o.encrypted_claim is not null
      and (o.claim_expires_at is null or o.claim_expires_at > now())
    order by o.next_attempt_at asc
    for update skip locked
    limit v_limit
  )
  update public.fulfillment_outbox o
  set
    status = 'sending',
    locked_at = now(),
    locked_by = left(coalesce(p_worker_id, 'worker'), 120),
    attempts = o.attempts + 1,
    updated_at = now()
  from due
  where o.id = due.id
  returning o.*;
end;
$$;

revoke all on function public.claim_due_fulfillment_outbox(integer, text)
  from public, anon, authenticated;
grant execute on function public.claim_due_fulfillment_outbox(integer, text) to service_role;

create or replace function public.mark_fulfillment_outbox_sent(
  p_outbox_id uuid,
  p_resend_email_id text,
  p_provider_status integer default 200
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.fulfillment_outbox
  set
    status = 'sent',
    resend_email_id = coalesce(nullif(trim(p_resend_email_id), ''), resend_email_id),
    last_provider_status = p_provider_status,
    last_error = null,
    sent_at = coalesce(sent_at, now()),
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_outbox_id
    and status = 'sending';
end;
$$;

revoke all on function public.mark_fulfillment_outbox_sent(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.mark_fulfillment_outbox_sent(uuid, text, integer) to service_role;

create or replace function public.mark_fulfillment_outbox_retry(
  p_outbox_id uuid,
  p_error text,
  p_provider_status integer default null,
  p_backoff_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.fulfillment_outbox%rowtype;
  v_backoff int;
begin
  select * into v_row from public.fulfillment_outbox where id = p_outbox_id for update;
  if not found then
    return;
  end if;

  if v_row.attempts >= v_row.max_attempts then
    update public.fulfillment_outbox
    set
      status = 'fulfillment_failed',
      last_error = left(coalesce(p_error, 'max_attempts'), 200),
      last_provider_status = p_provider_status,
      locked_at = null,
      locked_by = null,
      updated_at = now()
    where id = p_outbox_id;
    return;
  end if;

  v_backoff := greatest(30, least(coalesce(p_backoff_seconds, 60), 21600));

  update public.fulfillment_outbox
  set
    status = 'failed',
    next_attempt_at = now() + make_interval(secs => v_backoff),
    last_error = left(coalesce(p_error, 'transient'), 200),
    last_provider_status = p_provider_status,
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_outbox_id;
end;
$$;

revoke all on function public.mark_fulfillment_outbox_retry(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.mark_fulfillment_outbox_retry(uuid, text, integer, integer)
  to service_role;

create or replace function public.mark_fulfillment_outbox_permanent_failure(
  p_outbox_id uuid,
  p_error text,
  p_provider_status integer default null,
  p_wipe_claim boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.fulfillment_outbox
  set
    status = 'fulfillment_failed',
    last_error = left(coalesce(p_error, 'permanent'), 200),
    last_provider_status = p_provider_status,
    encrypted_claim = case when p_wipe_claim then null else encrypted_claim end,
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = p_outbox_id;
end;
$$;

revoke all on function public.mark_fulfillment_outbox_permanent_failure(uuid, text, integer, boolean)
  from public, anon, authenticated;
grant execute on function public.mark_fulfillment_outbox_permanent_failure(uuid, text, integer, boolean)
  to service_role;

-- Resend delivery events → outbox (deduped by svix_id)
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
      svix_id, event_type, resend_email_id, outbox_id, occurred_at
    ) values (
      trim(p_svix_id),
      coalesce(p_event_type, 'unknown'),
      nullif(trim(coalesce(p_resend_email_id, '')), ''),
      null,
      p_occurred_at
    );
    return jsonb_build_object('ok', true, 'matched', false, 'reason', 'missing_outbox');
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
      and status in ('sent', 'sending', 'delivered', 'pending', 'failed');
  elsif p_event_type = 'email.delivery_delayed' then
    update public.fulfillment_outbox
    set
      last_error = 'delivery_delayed',
      updated_at = now()
    where id = v_outbox.id
      and status in ('sent', 'sending');
  elsif p_event_type in ('email.bounced', 'email.complained', 'email.failed') then
    update public.fulfillment_outbox
    set
      status = 'fulfillment_failed',
      last_error = left(p_event_type, 200),
      encrypted_claim = null,
      locked_at = null,
      locked_by = null,
      updated_at = now()
    where id = v_outbox.id;
  end if;

  insert into public.resend_webhook_events (
    svix_id, event_type, resend_email_id, outbox_id, occurred_at
  ) values (
    trim(p_svix_id),
    coalesce(p_event_type, 'unknown'),
    trim(p_resend_email_id),
    v_outbox.id,
    p_occurred_at
  );

  return jsonb_build_object(
    'ok', true,
    'matched', true,
    'outbox_id', v_outbox.id,
    'duplicate', false
  );
end;
$$;

revoke all on function public.apply_resend_email_event(text, text, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_resend_email_event(text, text, text, timestamptz)
  to service_role;

-- Operator requeue: never mints claims; never prints secrets
create or replace function public.operator_requeue_fulfillment(p_order_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outbox public.fulfillment_outbox%rowtype;
  v_active_claim boolean;
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
      and purpose = 'initial'
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
      'attempts', v_outbox.attempts
    );
  end if;

  if v_outbox.status = 'delivered' then
    return jsonb_build_object(
      'ok', false,
      'reason', 'already_delivered',
      'outbox_status', v_outbox.status,
      'attempts', v_outbox.attempts
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
    'outbox_status', 'pending',
    'attempts', v_outbox.attempts,
    'has_encrypted_claim', true
  );
end;
$$;

revoke all on function public.operator_requeue_fulfillment(text)
  from public, anon, authenticated;
grant execute on function public.operator_requeue_fulfillment(text) to service_role;

-- Expire ciphertext for stale claims (callable by worker)
create or replace function public.expire_stale_fulfillment_claims(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  with stale as (
    select id
    from public.fulfillment_outbox
    where encrypted_claim is not null
      and claim_expires_at is not null
      and claim_expires_at <= now()
    order by claim_expires_at asc
    for update skip locked
    limit greatest(1, least(coalesce(p_limit, 50), 200))
  )
  update public.fulfillment_outbox o
  set
    encrypted_claim = null,
    status = case
      when o.status in ('pending', 'failed', 'sending') then 'fulfillment_failed'
      else o.status
    end,
    last_error = coalesce(o.last_error, 'claim_expired'),
    locked_at = null,
    locked_by = null,
    updated_at = now()
  from stale
  where o.id = stale.id;

  get diagnostics v_count = row_count;
  return coalesce(v_count, 0);
end;
$$;

revoke all on function public.expire_stale_fulfillment_claims(integer)
  from public, anon, authenticated;
grant execute on function public.expire_stale_fulfillment_claims(integer) to service_role;
