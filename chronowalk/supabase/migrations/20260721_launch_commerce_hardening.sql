-- ChronoWalk launch-commerce + paid-bundle hardening
-- Idempotent. Safe when purchases exists, journey_progress absent, family_bundles empty
-- (and when a test env already has progress/seat/session rows).
--
-- DO NOT apply to production from an agent. Dashboard apply order is documented at the
-- bottom of supabase/migrations/20260721_launch_commerce_hardening_verify.sql
--
-- Does NOT run the retired family_walk.sql grant path. Old anon RPCs are revoked/replaced.

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- 0) Crypto pepper (service-only; never returned)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public._access_pepper (
  id int primary key default 1 check (id = 1),
  pepper text not null,
  created_at timestamptz not null default now()
);

alter table public._access_pepper enable row level security;

drop policy if exists "_access_pepper service only" on public._access_pepper;
create policy "_access_pepper service only"
  on public._access_pepper for all
  to service_role
  using (true)
  with check (true);

revoke all on table public._access_pepper from anon, authenticated;

insert into public._access_pepper (id, pepper)
select 1, encode(gen_random_bytes(32), 'hex')
where not exists (select 1 from public._access_pepper where id = 1);

create or replace function public._cw_hash_secret(p_raw text)
returns text
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_pepper text;
begin
  if p_raw is null or length(p_raw) = 0 then
    return null;
  end if;
  select pepper into v_pepper from public._access_pepper where id = 1;
  if v_pepper is null then
    raise exception 'access pepper missing';
  end if;
  return encode(
    hmac(convert_to(p_raw, 'utf8'), convert_to(v_pepper, 'utf8'), 'sha256'),
    'hex'
  );
end;
$$;

revoke all on function public._cw_hash_secret(text) from public, anon, authenticated;
grant execute on function public._cw_hash_secret(text) to service_role;

create or replace function public._cw_new_secret(p_bytes int default 32)
returns text
language sql
volatile
security definer
set search_path = public, extensions
as $$
  select encode(gen_random_bytes(greatest(coalesce(p_bytes, 32), 16)), 'hex');
$$;

revoke all on function public._cw_new_secret(int) from public, anon, authenticated;
grant execute on function public._cw_new_secret(int) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1) Server-owned launch SKU matrix
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.launch_sku_entitlement(p_product_id text)
returns table (content_product_id text, seat_limit integer)
language sql
immutable
as $$
  select
    case p_product_id
      when 'rome-central' then 'rome-central'
      when 'rome-essential' then 'rome-essential'
      when 'rome-complete' then 'rome-complete'
      when 'rome-couple' then 'rome-complete'
      when 'rome-family' then 'rome-complete'
      else null
    end,
    case p_product_id
      when 'rome-central' then 1
      when 'rome-essential' then 1
      when 'rome-complete' then 1
      when 'rome-couple' then 2
      when 'rome-family' then 4
      else null
    end;
$$;

create table if not exists public.paddle_price_catalog (
  price_id text primary key,
  product_id text not null
    check (product_id in (
      'rome-central', 'rome-essential', 'rome-complete', 'rome-couple', 'rome-family'
    )),
  content_product_id text not null,
  seat_limit integer not null check (seat_limit between 1 and 4),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.paddle_price_catalog enable row level security;
drop policy if exists "paddle_price_catalog service only" on public.paddle_price_catalog;
create policy "paddle_price_catalog service only"
  on public.paddle_price_catalog for all
  to service_role
  using (true)
  with check (true);

create or replace function public.resolve_entitlement_from_price_id(p_price_id text)
returns table (product_id text, content_product_id text, seat_limit integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_price_id is null or length(trim(p_price_id)) = 0 then
    return;
  end if;
  return query
  select c.product_id, c.content_product_id, c.seat_limit
  from public.paddle_price_catalog c
  where c.price_id = trim(p_price_id)
    and c.active = true
  limit 1;
end;
$$;

revoke all on function public.resolve_entitlement_from_price_id(text) from public, anon, authenticated;
grant execute on function public.resolve_entitlement_from_price_id(text) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2) purchases extensions + backfill
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  order_id text not null,
  host text,
  ab_variant integer,
  product_id text,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.purchases add column if not exists product_id text;
alter table public.purchases add column if not exists price_id text;
alter table public.purchases add column if not exists paddle_customer_id text;
alter table public.purchases add column if not exists currency_code text;
alter table public.purchases add column if not exists amount_cents integer;
alter table public.purchases add column if not exists content_product_id text;
alter table public.purchases add column if not exists seat_limit integer;
alter table public.purchases add column if not exists status text;
alter table public.purchases add column if not exists consent_version text;
alter table public.purchases add column if not exists consent_at timestamptz;
alter table public.purchases add column if not exists fulfilled_at timestamptz;
alter table public.purchases add column if not exists revoked_at timestamptz;
alter table public.purchases add column if not exists updated_at timestamptz;
alter table public.purchases add column if not exists revoked_reason text;

-- Defaults / backfill for existing rows (preserve product_id SKU).
-- PostgreSQL rejects referencing the UPDATE target alias inside FROM
-- set-returning functions (42P10). Compute entitlements in a CTE first.
with entitlement_backfill as (
  select
    p.id as purchase_id,
    coalesce(p.seat_limit, coalesce(e.seat_limit, 1)) as seat_limit,
    coalesce(
      p.content_product_id,
      e.content_product_id,
      case
        when p.product_id in ('rome-couple', 'rome-family') then 'rome-complete'
        else p.product_id
      end
    ) as content_product_id,
    coalesce(p.status, 'active') as status,
    coalesce(p.updated_at, p.created_at, now()) as updated_at,
    coalesce(p.fulfilled_at, p.created_at) as fulfilled_at
  from public.purchases p
  cross join lateral public.launch_sku_entitlement(p.product_id) e
  where p.seat_limit is null
     or p.content_product_id is null
     or p.status is null
     or p.updated_at is null
)
update public.purchases p
set
  seat_limit = b.seat_limit,
  content_product_id = b.content_product_id,
  status = b.status,
  updated_at = b.updated_at,
  fulfilled_at = b.fulfilled_at
from entitlement_backfill b
where p.id = b.purchase_id;

update public.purchases
set
  seat_limit = coalesce(seat_limit, 1),
  status = coalesce(status, 'active'),
  updated_at = coalesce(updated_at, created_at, now())
where seat_limit is null or status is null or updated_at is null;

alter table public.purchases
  alter column seat_limit set default 1,
  alter column status set default 'active',
  alter column updated_at set default now();

alter table public.purchases
  alter column seat_limit set not null,
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_status_check'
      and conrelid = 'public.purchases'::regclass
  ) then
    alter table public.purchases
      add constraint purchases_status_check
      check (status in (
        'pending_fulfillment',
        'active',
        'refunded',
        'disputed',
        'revoked',
        'fulfillment_failed'
      ));
  end if;
end $$;

-- Active purchases must be one of the five launch SKUs
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_active_launch_sku_check'
      and conrelid = 'public.purchases'::regclass
  ) then
    alter table public.purchases
      add constraint purchases_active_launch_sku_check
      check (
        status is distinct from 'active'
        or product_id in (
          'rome-central',
          'rome-essential',
          'rome-complete',
          'rome-couple',
          'rome-family'
        )
      );
  end if;
end $$;

-- Unique order_id (audit duplicates first; keep earliest row)
do $$
declare
  dup_count bigint;
begin
  select count(*) into dup_count
  from (
    select order_id
    from public.purchases
    where order_id is not null
    group by order_id
    having count(*) > 1
  ) d;

  if dup_count > 0 then
    delete from public.purchases p
    using (
      select id
      from (
        select id,
               row_number() over (
                 partition by order_id
                 order by created_at asc nulls last, id asc
               ) as rn
        from public.purchases
        where order_id is not null
      ) ranked
      where ranked.rn > 1
    ) doomed
    where p.id = doomed.id;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'purchases_order_id_key'
      and conrelid = 'public.purchases'::regclass
  ) then
    begin
      alter table public.purchases add constraint purchases_order_id_key unique (order_id);
    exception when unique_violation then
      raise exception 'purchases.order_id still has duplicates after audit';
    end;
  end if;
end $$;

create index if not exists purchases_order_id_idx on public.purchases (order_id);
create index if not exists purchases_price_id_idx on public.purchases (price_id);
create index if not exists purchases_paddle_customer_id_idx on public.purchases (paddle_customer_id);
create index if not exists purchases_status_idx on public.purchases (status);
create index if not exists purchases_product_status_idx on public.purchases (product_id, status);
create index if not exists purchases_email_idx on public.purchases (email);

alter table public.purchases enable row level security;
drop policy if exists "purchases service only" on public.purchases;
create policy "purchases service only"
  on public.purchases for all
  to service_role
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3) paddle_customers (idempotent; no hard-coded backfills)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.paddle_customers (
  customer_id text primary key,
  email text not null,
  updated_at timestamptz not null default now()
);

create index if not exists paddle_customers_email_idx
  on public.paddle_customers (email);

alter table public.paddle_customers enable row level security;
drop policy if exists "paddle_customers service only" on public.paddle_customers;
create policy "paddle_customers service only"
  on public.paddle_customers for all
  to service_role
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4) Event inbox, outbox, adjustments
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  event_type text not null,
  occurred_at timestamptz,
  status text not null default 'received'
    check (status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  attempts integer not null default 0,
  last_error text,
  processed_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists paddle_webhook_events_status_idx
  on public.paddle_webhook_events (status, created_at);

alter table public.paddle_webhook_events enable row level security;
drop policy if exists "paddle_webhook_events service only" on public.paddle_webhook_events;
create policy "paddle_webhook_events service only"
  on public.paddle_webhook_events for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.fulfillment_outbox (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  order_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'delivered', 'failed', 'cancelled')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  resend_email_id text,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  unique (purchase_id)
);

create index if not exists fulfillment_outbox_status_next_idx
  on public.fulfillment_outbox (status, next_attempt_at);

create index if not exists fulfillment_outbox_order_id_idx
  on public.fulfillment_outbox (order_id);

alter table public.fulfillment_outbox enable row level security;
drop policy if exists "fulfillment_outbox service only" on public.fulfillment_outbox;
create policy "fulfillment_outbox service only"
  on public.fulfillment_outbox for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.purchase_adjustments (
  adjustment_id text primary key,
  order_id text not null,
  purchase_id uuid references public.purchases (id) on delete set null,
  action text,
  status text,
  raw jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists purchase_adjustments_order_id_idx
  on public.purchase_adjustments (order_id);

alter table public.purchase_adjustments enable row level security;
drop policy if exists "purchase_adjustments service only" on public.purchase_adjustments;
create policy "purchase_adjustments service only"
  on public.purchase_adjustments for all
  to service_role
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5) Claim tokens + device credentials (legacy access_token retired)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.purchase_claim_tokens (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  claim_hash text not null,
  purpose text not null check (purpose in ('initial', 'restore', 'operator_recovery')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  revoked_at timestamptz,
  constraint purchase_claim_tokens_expiry_max_7d
    check (expires_at <= created_at + interval '7 days')
);

create unique index if not exists purchase_claim_tokens_claim_hash_uidx
  on public.purchase_claim_tokens (claim_hash);

create index if not exists purchase_claim_tokens_purchase_idx
  on public.purchase_claim_tokens (purchase_id);

create index if not exists purchase_claim_tokens_active_idx
  on public.purchase_claim_tokens (claim_hash, expires_at)
  where consumed_at is null and revoked_at is null;

alter table public.purchase_claim_tokens enable row level security;
drop policy if exists "purchase_claim_tokens service only" on public.purchase_claim_tokens;
create policy "purchase_claim_tokens service only"
  on public.purchase_claim_tokens for all
  to service_role
  using (true)
  with check (true);

-- family_seats needed before access_credentials optional FK; ensure base tables exist
create table if not exists public.family_bundles (
  id uuid primary key default gen_random_uuid(),
  access_token uuid,
  tier text,
  seat_limit int,
  owner_device_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.family_seats (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.family_bundles (id) on delete cascade,
  label text not null default 'Walker',
  invite_code text,
  claimed_device_id text,
  claimed_display_name text,
  claimed_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.access_credentials (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  bundle_seat_id uuid references public.family_seats (id) on delete set null,
  credential_hash text not null,
  device_binding_hash text,
  issued_at timestamptz not null default now(),
  last_validated_at timestamptz,
  revoked_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'revoked', 'replaced'))
);

create unique index if not exists access_credentials_hash_uidx
  on public.access_credentials (credential_hash);

create index if not exists access_credentials_purchase_idx
  on public.access_credentials (purchase_id);

create index if not exists access_credentials_status_idx
  on public.access_credentials (status)
  where status = 'active';

create index if not exists access_credentials_seat_idx
  on public.access_credentials (bundle_seat_id)
  where bundle_seat_id is not null;

alter table public.access_credentials enable row level security;
drop policy if exists "access_credentials service only" on public.access_credentials;
create policy "access_credentials service only"
  on public.access_credentials for all
  to service_role
  using (true)
  with check (true);

-- Idempotent cutover: rotate every legacy reusable bearer so old emailed UUIDs die
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'purchases'
      and column_name = 'access_token'
  ) then
    update public.purchases
    set
      access_token = gen_random_uuid(),
      updated_at = now(),
      revoked_reason = coalesce(revoked_reason, 'legacy_access_token_rotated')
    where coalesce(revoked_reason, '') not like '%legacy_access_token_rotated%';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6) journey_progress — subject-isolated (credential / seat), not claim codes
-- ═══════════════════════════════════════════════════════════════════════════

do $$
begin
  if to_regclass('public.journey_progress') is null then
    create table public.journey_progress (
      id uuid primary key default gen_random_uuid(),
      purchase_id uuid not null references public.purchases (id) on delete cascade,
      access_credential_id uuid references public.access_credentials (id) on delete cascade,
      bundle_seat_id uuid references public.family_seats (id) on delete cascade,
      snapshot jsonb not null,
      updated_at timestamptz not null default now(),
      constraint journey_progress_subject_check check (
        (access_credential_id is not null and bundle_seat_id is null)
        or (bundle_seat_id is not null)
      )
    );
  else
    -- Legacy shape used access_token PK. Migrate idempotently when present.
    alter table public.journey_progress add column if not exists id uuid;
    alter table public.journey_progress add column if not exists purchase_id uuid;
    alter table public.journey_progress add column if not exists access_credential_id uuid;
    alter table public.journey_progress add column if not exists bundle_seat_id uuid;
    alter table public.journey_progress add column if not exists snapshot jsonb;
    alter table public.journey_progress add column if not exists updated_at timestamptz;

    update public.journey_progress jp
    set id = coalesce(jp.id, gen_random_uuid())
    where jp.id is null;

    -- Best-effort: map legacy access_token rows onto purchases via rotated token
    -- (will usually find nothing after cutover — leftover orphan rows are dropped).
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'journey_progress'
        and column_name = 'access_token'
    ) then
      update public.journey_progress jp
      set purchase_id = p.id
      from public.purchases p
      where jp.purchase_id is null
        and jp.access_token = p.access_token;

      delete from public.journey_progress
      where purchase_id is null
        and access_credential_id is null
        and bundle_seat_id is null;
    end if;

    begin
      alter table public.journey_progress alter column id set default gen_random_uuid();
      alter table public.journey_progress alter column id set not null;
    exception when others then
      null;
    end;
  end if;
end $$;

create unique index if not exists journey_progress_credential_uidx
  on public.journey_progress (access_credential_id)
  where access_credential_id is not null;

create unique index if not exists journey_progress_seat_uidx
  on public.journey_progress (bundle_seat_id)
  where bundle_seat_id is not null;

create index if not exists journey_progress_purchase_idx
  on public.journey_progress (purchase_id);

alter table public.journey_progress enable row level security;
drop policy if exists "journey_progress service only" on public.journey_progress;
create policy "journey_progress service only"
  on public.journey_progress for all
  to service_role
  using (true)
  with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7) Harden shared-walk schema (bundles / seats / invites / sessions)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.family_bundles add column if not exists purchase_id uuid;
alter table public.family_bundles add column if not exists product_id text;
alter table public.family_bundles add column if not exists content_product_id text;
alter table public.family_bundles add column if not exists status text;
alter table public.family_bundles add column if not exists updated_at timestamptz;

update public.family_bundles
set
  status = coalesce(status, 'active'),
  content_product_id = coalesce(content_product_id, 'rome-complete'),
  updated_at = coalesce(updated_at, created_at, now())
where status is null or content_product_id is null or updated_at is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'family_bundles_purchase_id_fkey'
      and conrelid = 'public.family_bundles'::regclass
  ) then
    begin
      alter table public.family_bundles
        add constraint family_bundles_purchase_id_fkey
        foreign key (purchase_id) references public.purchases (id) on delete cascade;
    exception when others then
      null;
    end;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'family_bundles_purchase_id_key'
      and conrelid = 'public.family_bundles'::regclass
  ) then
    begin
      alter table public.family_bundles
        add constraint family_bundles_purchase_id_key unique (purchase_id);
    exception when others then
      null;
    end;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'family_bundles_status_check'
      and conrelid = 'public.family_bundles'::regclass
  ) then
    alter table public.family_bundles
      add constraint family_bundles_status_check
      check (status in ('active', 'revoked'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'family_bundles_product_check'
      and conrelid = 'public.family_bundles'::regclass
  ) then
    alter table public.family_bundles
      add constraint family_bundles_product_check
      check (
        product_id is null
        or product_id in ('rome-couple', 'rome-family')
      );
  end if;
end $$;

alter table public.family_seats add column if not exists role text;
alter table public.family_seats add column if not exists credential_hash text;
alter table public.family_seats add column if not exists device_binding_hash text;
alter table public.family_seats add column if not exists revoked_at timestamptz;
alter table public.family_seats add column if not exists updated_at timestamptz;

update public.family_seats
set
  role = coalesce(role, case when claimed_device_id is not null then 'member' else 'member' end),
  updated_at = coalesce(updated_at, created_at, now())
where role is null or updated_at is null;

-- Mark first claimed seat per bundle as owner when role unset historically
with ranked as (
  select id,
         row_number() over (partition by bundle_id order by claimed_at asc nulls last, created_at asc) as rn
  from public.family_seats
  where status = 'claimed'
)
update public.family_seats s
set role = 'owner'
from ranked r
where s.id = r.id and r.rn = 1 and coalesce(s.role, '') <> 'owner';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'family_seats_role_check'
      and conrelid = 'public.family_seats'::regclass
  ) then
    alter table public.family_seats
      add constraint family_seats_role_check
      check (role in ('owner', 'member'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'family_seats_status_check'
      and conrelid = 'public.family_seats'::regclass
  ) then
    begin
      alter table public.family_seats
        add constraint family_seats_status_check
        check (status in ('open', 'claimed', 'revoked'));
    exception when others then
      null;
    end;
  end if;
end $$;

create unique index if not exists family_seats_one_owner_uidx
  on public.family_seats (bundle_id)
  where role = 'owner' and status <> 'revoked';

create index if not exists family_seats_bundle_status_idx
  on public.family_seats (bundle_id, status);

create index if not exists family_seats_credential_hash_idx
  on public.family_seats (credential_hash)
  where credential_hash is not null;

create table if not exists public.bundle_invites (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.family_bundles (id) on delete cascade,
  seat_id uuid not null references public.family_seats (id) on delete cascade,
  invite_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz,
  revoked_at timestamptz,
  constraint bundle_invites_expiry_positive check (expires_at > created_at)
);

create unique index if not exists bundle_invites_hash_uidx
  on public.bundle_invites (invite_hash);

create unique index if not exists bundle_invites_open_seat_uidx
  on public.bundle_invites (seat_id)
  where consumed_at is null and revoked_at is null;

create index if not exists bundle_invites_expiry_idx
  on public.bundle_invites (expires_at)
  where consumed_at is null and revoked_at is null;

alter table public.bundle_invites enable row level security;
drop policy if exists "bundle_invites service only" on public.bundle_invites;
create policy "bundle_invites service only"
  on public.bundle_invites for all
  to service_role
  using (true)
  with check (true);

create table if not exists public.walk_sessions (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.family_bundles (id) on delete cascade,
  join_code text not null,
  leader_device_id text,
  leader_seat_id uuid references public.family_seats (id) on delete set null,
  sync_enabled boolean not null default true,
  resume_policy text not null default 'leader'
    check (resume_policy in ('leader', 'anyone')),
  waypoint_id text,
  chapter_index int not null default 0,
  position_seconds double precision not null default 0,
  playback_rate double precision not null default 1,
  playing boolean not null default false,
  paused boolean not null default true,
  pause_source_device_id text,
  pause_source_seat_id uuid references public.family_seats (id) on delete set null,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '18 hours'),
  status text not null default 'active' check (status in ('active', 'ended', 'revoked'))
);

alter table public.walk_sessions add column if not exists leader_seat_id uuid;
alter table public.walk_sessions add column if not exists pause_source_seat_id uuid;
alter table public.walk_sessions add column if not exists status text;

update public.walk_sessions
set status = coalesce(status, 'active')
where status is null;

create index if not exists walk_sessions_join_idx on public.walk_sessions (join_code);
create index if not exists walk_sessions_bundle_idx on public.walk_sessions (bundle_id);
create index if not exists walk_sessions_lookup_idx
  on public.walk_sessions (id, status, expires_at);

alter table public.family_bundles enable row level security;
alter table public.family_seats enable row level security;
alter table public.walk_sessions enable row level security;

drop policy if exists "family_bundles service" on public.family_bundles;
drop policy if exists "family_bundles service only" on public.family_bundles;
create policy "family_bundles service only"
  on public.family_bundles for all to service_role using (true) with check (true);

drop policy if exists "family_seats service" on public.family_seats;
drop policy if exists "family_seats service only" on public.family_seats;
create policy "family_seats service only"
  on public.family_seats for all to service_role using (true) with check (true);

drop policy if exists "walk_sessions service" on public.walk_sessions;
drop policy if exists "walk_sessions service only" on public.walk_sessions;
create policy "walk_sessions service only"
  on public.walk_sessions for all to service_role using (true) with check (true);

-- Remove insecure Realtime anon path if publication exists
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime drop table public.walk_sessions;
    exception when undefined_object then
      null;
    when others then
      null;
    end;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8) Service helpers: ensure paid bundle, issue claim, revoke purchase
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.ensure_paid_bundle(p_purchase_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_bundle_id uuid;
  v_seat_limit int;
  v_i int;
  v_seat_id uuid;
  v_owner_seat uuid;
begin
  select * into v_purchase from public.purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'purchase_not_found';
  end if;
  if v_purchase.status is distinct from 'active' then
    raise exception 'purchase_not_active';
  end if;
  if v_purchase.product_id not in ('rome-couple', 'rome-family') then
    raise exception 'not_a_bundle_sku';
  end if;

  select e.seat_limit into v_seat_limit
  from public.launch_sku_entitlement(v_purchase.product_id) e;
  v_seat_limit := coalesce(v_purchase.seat_limit, v_seat_limit);
  if v_seat_limit not in (2, 4) then
    raise exception 'invalid_seat_limit';
  end if;

  select id into v_bundle_id
  from public.family_bundles
  where purchase_id = p_purchase_id
  limit 1;

  if v_bundle_id is not null then
    return v_bundle_id;
  end if;

  insert into public.family_bundles (
    purchase_id, product_id, content_product_id, seat_limit, status, tier, created_at, updated_at
  ) values (
    p_purchase_id,
    v_purchase.product_id,
    coalesce(v_purchase.content_product_id, 'rome-complete'),
    v_seat_limit,
    'active',
    case when v_purchase.product_id = 'rome-couple' then 'couple' else 'family' end,
    now(),
    now()
  )
  returning id into v_bundle_id;

  -- Owner seat (counts toward cap)
  insert into public.family_seats (bundle_id, label, role, status, invite_code, created_at, updated_at)
  values (v_bundle_id, 'Owner', 'owner', 'open', null, now(), now())
  returning id into v_owner_seat;

  for v_i in 2..v_seat_limit loop
    insert into public.family_seats (bundle_id, label, role, status, invite_code, created_at, updated_at)
    values (
      v_bundle_id,
      case when v_purchase.product_id = 'rome-couple' then 'Partner' else 'Walker ' || v_i::text end,
      'member',
      'open',
      null,
      now(),
      now()
    );
  end loop;

  return v_bundle_id;
end;
$$;

revoke all on function public.ensure_paid_bundle(uuid) from public, anon, authenticated;
grant execute on function public.ensure_paid_bundle(uuid) to service_role;

create or replace function public.issue_purchase_claim(
  p_purchase_id uuid,
  p_purpose text default 'initial',
  p_ttl interval default interval '7 days'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw text;
  v_hash text;
  v_ttl interval;
  v_expires timestamptz;
begin
  if p_purpose not in ('initial', 'restore', 'operator_recovery') then
    raise exception 'invalid_purpose';
  end if;
  if not exists (
    select 1 from public.purchases
    where id = p_purchase_id and status = 'active'
  ) then
    raise exception 'purchase_not_active';
  end if;

  v_ttl := least(coalesce(p_ttl, interval '7 days'), interval '7 days');
  v_raw := public._cw_new_secret(32);
  v_hash := public._cw_hash_secret(v_raw);
  v_expires := now() + v_ttl;

  insert into public.purchase_claim_tokens (
    purchase_id, claim_hash, purpose, expires_at
  ) values (
    p_purchase_id, v_hash, p_purpose, v_expires
  );

  -- Return raw once to caller (webhook/outbox). Never persist raw.
  return v_raw;
end;
$$;

revoke all on function public.issue_purchase_claim(uuid, text, interval) from public, anon, authenticated;
grant execute on function public.issue_purchase_claim(uuid, text, interval) to service_role;

create or replace function public.revoke_purchase_access(
  p_purchase_id uuid,
  p_reason text default 'revoked'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.purchases
  set
    status = case
      when p_reason in ('refunded', 'disputed') then p_reason
      else 'revoked'
    end,
    revoked_at = now(),
    revoked_reason = coalesce(p_reason, 'revoked'),
    updated_at = now()
  where id = p_purchase_id;

  update public.purchase_claim_tokens
  set revoked_at = coalesce(revoked_at, now())
  where purchase_id = p_purchase_id and revoked_at is null;

  update public.access_credentials
  set status = 'revoked', revoked_at = coalesce(revoked_at, now())
  where purchase_id = p_purchase_id and status = 'active';

  update public.family_bundles
  set status = 'revoked', updated_at = now()
  where purchase_id = p_purchase_id and status = 'active';

  update public.family_seats s
  set status = 'revoked', revoked_at = coalesce(s.revoked_at, now()), updated_at = now()
  from public.family_bundles b
  where s.bundle_id = b.id
    and b.purchase_id = p_purchase_id
    and s.status <> 'revoked';

  update public.bundle_invites i
  set revoked_at = coalesce(i.revoked_at, now())
  from public.family_bundles b
  where i.bundle_id = b.id
    and b.purchase_id = p_purchase_id
    and i.revoked_at is null;

  update public.walk_sessions w
  set status = 'revoked', expires_at = least(w.expires_at, now()), updated_at = now()
  from public.family_bundles b
  where w.bundle_id = b.id
    and b.purchase_id = p_purchase_id
    and w.status = 'active';
end;
$$;

revoke all on function public.revoke_purchase_access(uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_purchase_access(uuid, text) to service_role;

-- Rate-limit helper for invite claims (per hash prefix / minute)
create table if not exists public._rpc_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null,
  hits integer not null default 0
);

alter table public._rpc_rate_limits enable row level security;
drop policy if exists "_rpc_rate_limits service only" on public._rpc_rate_limits;
create policy "_rpc_rate_limits service only"
  on public._rpc_rate_limits for all to service_role using (true) with check (true);

create or replace function public._cw_rate_limit(p_bucket text, p_limit int, p_window interval)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public._rpc_rate_limits%rowtype;
begin
  select * into v_row from public._rpc_rate_limits where bucket = p_bucket for update;
  if not found then
    insert into public._rpc_rate_limits (bucket, window_started_at, hits)
    values (p_bucket, now(), 1);
    return true;
  end if;
  if v_row.window_started_at + p_window <= now() then
    update public._rpc_rate_limits
    set window_started_at = now(), hits = 1
    where bucket = p_bucket;
    return true;
  end if;
  if v_row.hits >= p_limit then
    return false;
  end if;
  update public._rpc_rate_limits set hits = hits + 1 where bucket = p_bucket;
  return true;
end;
$$;

revoke all on function public._cw_rate_limit(text, int, interval) from public, anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9) New anon RPCs (fail closed; no hash/claim echo except one-time credential)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.redeem_purchase_claim(
  p_claim text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_claim public.purchase_claim_tokens%rowtype;
  v_purchase public.purchases%rowtype;
  v_ent record;
  v_raw_cred text;
  v_cred_hash text;
  v_bind_hash text;
  v_seat_id uuid;
  v_bundle public.family_bundles%rowtype;
  v_role text := 'solo';
  v_bundle_status text := null;
  v_cred_id uuid;
  v_updated int;
begin
  if p_claim is null or length(trim(p_claim)) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  begin
    v_hash := public._cw_hash_secret(trim(p_claim));
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end;

  select * into v_claim
  from public.purchase_claim_tokens
  where claim_hash = v_hash
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if v_claim.revoked_at is not null or v_claim.consumed_at is not null or v_claim.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_purchase from public.purchases where id = v_claim.purchase_id for update;
  if not found or v_purchase.status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_ent from public.launch_sku_entitlement(v_purchase.product_id);
  if v_ent.content_product_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Atomic consume — concurrent redeemers: exactly one winner
  update public.purchase_claim_tokens
  set consumed_at = now()
  where id = v_claim.id
    and consumed_at is null
    and revoked_at is null
    and expires_at > now();
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  v_raw_cred := public._cw_new_secret(32);
  v_cred_hash := public._cw_hash_secret(v_raw_cred);
  v_bind_hash := case
    when p_device_binding is null or length(trim(p_device_binding)) = 0 then null
    else public._cw_hash_secret(trim(p_device_binding))
  end;

  if v_purchase.product_id in ('rome-couple', 'rome-family') then
    perform public.ensure_paid_bundle(v_purchase.id);
    select * into v_bundle from public.family_bundles where purchase_id = v_purchase.id;
    v_bundle_status := v_bundle.status;

    select id into v_seat_id
    from public.family_seats
    where bundle_id = v_bundle.id
      and role = 'owner'
      and status in ('open', 'claimed')
    for update;

    if v_seat_id is null then
      return jsonb_build_object('ok', false, 'reason', 'invalid');
    end if;

    -- One active device per seat: replace prior owner credential if any
    update public.access_credentials
    set status = 'replaced', revoked_at = coalesce(revoked_at, now())
    where bundle_seat_id = v_seat_id and status = 'active';

    update public.family_seats
    set
      status = 'claimed',
      role = 'owner',
      credential_hash = v_cred_hash,
      device_binding_hash = v_bind_hash,
      claimed_at = coalesce(claimed_at, now()),
      updated_at = now()
    where id = v_seat_id;

    v_role := 'owner';
  end if;

  insert into public.access_credentials (
    purchase_id, bundle_seat_id, credential_hash, device_binding_hash,
    issued_at, last_validated_at, status
  ) values (
    v_purchase.id, v_seat_id, v_cred_hash, v_bind_hash,
    now(), now(), 'active'
  )
  returning id into v_cred_id;

  return jsonb_build_object(
    'ok', true,
    'device_credential', v_raw_cred,
    'purchased_product_id', v_purchase.product_id,
    'content_product_id', coalesce(v_purchase.content_product_id, v_ent.content_product_id),
    'seat_limit', coalesce(v_purchase.seat_limit, v_ent.seat_limit),
    'role', v_role,
    'bundle_status', v_bundle_status,
    'offline_lease_expires_at', (now() + interval '48 hours')
  );
end;
$$;

create or replace function public.validate_device_access(
  p_credential text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_purchase public.purchases%rowtype;
  v_ent record;
  v_seat public.family_seats%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_role text := 'solo';
  v_bundle_status text := null;
  v_bind_hash text;
begin
  if p_credential is null or length(trim(p_credential)) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  begin
    v_hash := public._cw_hash_secret(trim(p_credential));
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end;

  select * into v_cred
  from public.access_credentials
  where credential_hash = v_hash
  limit 1;

  if not found or v_cred.status is distinct from 'active' or v_cred.revoked_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_purchase from public.purchases where id = v_cred.purchase_id;
  if not found or v_purchase.status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_ent from public.launch_sku_entitlement(v_purchase.product_id);
  if v_ent.content_product_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if v_cred.device_binding_hash is not null then
    if p_device_binding is null or length(trim(p_device_binding)) = 0 then
      return jsonb_build_object('ok', false, 'reason', 'invalid');
    end if;
    v_bind_hash := public._cw_hash_secret(trim(p_device_binding));
    if v_bind_hash is distinct from v_cred.device_binding_hash then
      return jsonb_build_object('ok', false, 'reason', 'invalid');
    end if;
  end if;

  if v_cred.bundle_seat_id is not null then
    select * into v_seat from public.family_seats where id = v_cred.bundle_seat_id;
    select * into v_bundle from public.family_bundles where id = v_seat.bundle_id;
    if not found
       or v_seat.status is distinct from 'claimed'
       or v_bundle.status is distinct from 'active'
       or v_bundle.purchase_id is distinct from v_purchase.id
    then
      return jsonb_build_object('ok', false, 'reason', 'invalid');
    end if;
    v_role := coalesce(v_seat.role, 'member');
    v_bundle_status := v_bundle.status;
  end if;

  update public.access_credentials
  set last_validated_at = now()
  where id = v_cred.id;

  return jsonb_build_object(
    'ok', true,
    'purchased_product_id', v_purchase.product_id,
    'content_product_id', coalesce(v_purchase.content_product_id, v_ent.content_product_id),
    'seat_limit', coalesce(v_purchase.seat_limit, v_ent.seat_limit),
    'role', v_role,
    'bundle_status', v_bundle_status,
    'offline_lease_expires_at', (now() + interval '48 hours')
  );
end;
$$;

-- Retire legacy bearer RPCs — never authorize purchases.access_token
create or replace function public.validate_access_token(p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Malformed / legacy / unknown → false (never throw)
  if p_token is null or length(trim(p_token)) = 0 then
    return false;
  end if;
  return false;
end;
$$;

create or replace function public.get_purchase_for_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Retired: claim codes must use redeem_purchase_claim; device credentials use validate_device_access.
  -- Do not echo tokens. Malformed input returns invalid, never throws.
  if p_token is null or length(trim(p_token)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  begin
    perform p_token::uuid;
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end;
  return jsonb_build_object('ok', false, 'reason', 'invalid');
end;
$$;

drop function if exists public.get_organizer_bundle_status(text);
drop function if exists public.get_organizer_bundle_status(text, text);

create or replace function public.get_organizer_bundle_status(
  p_credential text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_seats jsonb;
begin
  v_access := public.validate_device_access(p_credential, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if v_access->>'role' is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  v_hash := public._cw_hash_secret(trim(p_credential));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;
  select * into v_bundle from public.family_bundles where purchase_id = v_cred.purchase_id;

  if not found or v_bundle.status is distinct from 'active' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'label', s.label,
    'role', s.role,
    'status', s.status,
    'claimedAt', s.claimed_at
  ) order by s.created_at), '[]'::jsonb)
  into v_seats
  from public.family_seats s
  where s.bundle_id = v_bundle.id;

  return jsonb_build_object(
    'ok', true,
    'bundleId', v_bundle.id,
    'purchased_product_id', v_bundle.product_id,
    'content_product_id', v_bundle.content_product_id,
    'seat_limit', v_bundle.seat_limit,
    'bundle_status', v_bundle.status,
    'seats', v_seats
  );
end;
$$;

drop function if exists public.create_bundle_invite(text, uuid, interval);
drop function if exists public.create_bundle_invite(text, uuid, interval, text);

create or replace function public.create_bundle_invite(
  p_credential text,
  p_seat_id uuid default null,
  p_ttl interval default interval '48 hours',
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_seat public.family_seats%rowtype;
  v_raw text;
  v_invite_hash text;
  v_expires timestamptz;
begin
  v_access := public.validate_device_access(p_credential, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if v_access->>'role' is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  v_hash := public._cw_hash_secret(trim(p_credential));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;
  select * into v_bundle
  from public.family_bundles
  where purchase_id = v_cred.purchase_id and status = 'active'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if p_seat_id is null then
    select * into v_seat
    from public.family_seats
    where bundle_id = v_bundle.id
      and role = 'member'
      and status in ('open', 'revoked')
    order by created_at
    limit 1
    for update;
  else
    select * into v_seat
    from public.family_seats
    where id = p_seat_id and bundle_id = v_bundle.id
    for update;
  end if;

  if not found or v_seat.role is distinct from 'member' then
    return jsonb_build_object('ok', false, 'reason', 'no_seat');
  end if;

  -- Reset seat without increasing cap
  update public.bundle_invites
  set revoked_at = coalesce(revoked_at, now())
  where seat_id = v_seat.id and revoked_at is null and consumed_at is null;

  update public.access_credentials
  set status = 'revoked', revoked_at = coalesce(revoked_at, now())
  where bundle_seat_id = v_seat.id and status = 'active';

  update public.family_seats
  set
    status = 'open',
    credential_hash = null,
    device_binding_hash = null,
    claimed_device_id = null,
    claimed_display_name = null,
    claimed_at = null,
    revoked_at = null,
    updated_at = now()
  where id = v_seat.id;

  v_raw := public._cw_new_secret(16); -- 128 bits
  v_invite_hash := public._cw_hash_secret(v_raw);
  v_expires := now() + least(coalesce(p_ttl, interval '48 hours'), interval '7 days');

  insert into public.bundle_invites (bundle_id, seat_id, invite_hash, expires_at)
  values (v_bundle.id, v_seat.id, v_invite_hash, v_expires);

  return jsonb_build_object(
    'ok', true,
    'invite', v_raw,
    'seat_id', v_seat.id,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.redeem_bundle_invite(
  p_invite text,
  p_device_binding text default null,
  p_display_name text default 'Walker'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_invite public.bundle_invites%rowtype;
  v_seat public.family_seats%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_purchase public.purchases%rowtype;
  v_raw_cred text;
  v_cred_hash text;
  v_bind_hash text;
  v_updated int;
  v_bucket text;
begin
  if p_invite is null or length(trim(p_invite)) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  v_bucket := 'invite:' || left(encode(digest(trim(p_invite), 'sha256'), 'hex'), 16);
  if not public._cw_rate_limit(v_bucket, 10, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  begin
    v_hash := public._cw_hash_secret(trim(p_invite));
  exception when others then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end;

  select * into v_invite
  from public.bundle_invites
  where invite_hash = v_hash
  for update;

  if not found
     or v_invite.revoked_at is not null
     or v_invite.consumed_at is not null
     or v_invite.expires_at <= now()
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select * into v_seat from public.family_seats where id = v_invite.seat_id for update;
  select * into v_bundle from public.family_bundles where id = v_invite.bundle_id for update;
  select * into v_purchase from public.purchases where id = v_bundle.purchase_id;

  if v_seat.status is distinct from 'open'
     or v_bundle.status is distinct from 'active'
     or v_purchase.status is distinct from 'active'
  then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  update public.bundle_invites
  set consumed_at = now()
  where id = v_invite.id
    and consumed_at is null
    and revoked_at is null
    and expires_at > now();
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  v_raw_cred := public._cw_new_secret(32);
  v_cred_hash := public._cw_hash_secret(v_raw_cred);
  v_bind_hash := case
    when p_device_binding is null or length(trim(p_device_binding)) = 0 then null
    else public._cw_hash_secret(trim(p_device_binding))
  end;

  update public.family_seats
  set
    status = 'claimed',
    credential_hash = v_cred_hash,
    device_binding_hash = v_bind_hash,
    claimed_display_name = coalesce(nullif(trim(p_display_name), ''), label),
    claimed_at = now(),
    claimed_device_id = null,
    updated_at = now()
  where id = v_seat.id;

  insert into public.access_credentials (
    purchase_id, bundle_seat_id, credential_hash, device_binding_hash,
    issued_at, last_validated_at, status
  ) values (
    v_purchase.id, v_seat.id, v_cred_hash, v_bind_hash,
    now(), now(), 'active'
  );

  return jsonb_build_object(
    'ok', true,
    'device_credential', v_raw_cred,
    'purchased_product_id', v_purchase.product_id,
    'content_product_id', coalesce(v_purchase.content_product_id, 'rome-complete'),
    'seat_limit', v_purchase.seat_limit,
    'role', 'member',
    'bundle_status', v_bundle.status,
    'offline_lease_expires_at', (now() + interval '48 hours')
  );
end;
$$;

drop function if exists public.revoke_bundle_seat(text, uuid);
drop function if exists public.revoke_bundle_seat(text, uuid, text);

create or replace function public.revoke_bundle_seat(
  p_credential text,
  p_seat_id uuid,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_seat public.family_seats%rowtype;
begin
  v_access := public.validate_device_access(p_credential, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if v_access->>'role' is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  v_hash := public._cw_hash_secret(trim(p_credential));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;
  select * into v_bundle from public.family_bundles where purchase_id = v_cred.purchase_id;
  select * into v_seat from public.family_seats where id = p_seat_id and bundle_id = v_bundle.id;

  if not found or v_seat.role is distinct from 'member' then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  update public.bundle_invites
  set revoked_at = coalesce(revoked_at, now())
  where seat_id = v_seat.id and revoked_at is null;

  update public.access_credentials
  set status = 'revoked', revoked_at = coalesce(revoked_at, now())
  where bundle_seat_id = v_seat.id and status = 'active';

  update public.family_seats
  set
    status = 'revoked',
    revoked_at = now(),
    credential_hash = null,
    device_binding_hash = null,
    claimed_device_id = null,
    updated_at = now()
  where id = v_seat.id;

  return jsonb_build_object('ok', true, 'seat_id', v_seat.id, 'status', 'revoked');
end;
$$;

drop function if exists public.upsert_journey_progress(text, jsonb);
drop function if exists public.upsert_journey_progress(text, jsonb, text);

create or replace function public.upsert_journey_progress(
  p_token text,
  p_snapshot jsonb,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
begin
  -- p_token is the device credential (never a one-time claim)
  v_access := public.validate_device_access(p_token, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if p_snapshot is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_args');
  end if;

  v_hash := public._cw_hash_secret(trim(p_token));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;

  if v_cred.bundle_seat_id is not null then
    insert into public.journey_progress (purchase_id, bundle_seat_id, snapshot, updated_at)
    values (v_cred.purchase_id, v_cred.bundle_seat_id, p_snapshot, now())
    on conflict (bundle_seat_id) where bundle_seat_id is not null
    do update set snapshot = excluded.snapshot, updated_at = now();
  else
    insert into public.journey_progress (purchase_id, access_credential_id, snapshot, updated_at)
    values (v_cred.purchase_id, v_cred.id, p_snapshot, now())
    on conflict (access_credential_id) where access_credential_id is not null
    do update set snapshot = excluded.snapshot, updated_at = now();
  end if;

  return jsonb_build_object('ok', true);
exception when others then
  -- Partial unique indexes cannot be targeted by ON CONFLICT inference on all PG versions.
  -- Fall back to manual upsert.
  if v_cred.bundle_seat_id is not null then
    update public.journey_progress
    set snapshot = p_snapshot, updated_at = now()
    where bundle_seat_id = v_cred.bundle_seat_id;
    if not found then
      insert into public.journey_progress (purchase_id, bundle_seat_id, snapshot, updated_at)
      values (v_cred.purchase_id, v_cred.bundle_seat_id, p_snapshot, now());
    end if;
  else
    update public.journey_progress
    set snapshot = p_snapshot, updated_at = now()
    where access_credential_id = v_cred.id;
    if not found then
      insert into public.journey_progress (purchase_id, access_credential_id, snapshot, updated_at)
      values (v_cred.purchase_id, v_cred.id, p_snapshot, now());
    end if;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

drop function if exists public.get_journey_progress(text);
drop function if exists public.get_journey_progress(text, text);

create or replace function public.get_journey_progress(
  p_token text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_row public.journey_progress%rowtype;
begin
  v_access := public.validate_device_access(p_token, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return null;
  end if;

  v_hash := public._cw_hash_secret(trim(p_token));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;

  if v_cred.bundle_seat_id is not null then
    select * into v_row from public.journey_progress where bundle_seat_id = v_cred.bundle_seat_id;
  else
    select * into v_row from public.journey_progress where access_credential_id = v_cred.id;
  end if;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'snapshot', v_row.snapshot,
    'updated_at', v_row.updated_at
  );
end;
$$;

-- Credential-authorized walk sessions (no device-id-only auth)
drop function if exists public._cw_active_seat_for_credential(text);
drop function if exists public._cw_active_seat_for_credential(text, text);

create or replace function public._cw_active_seat_for_credential(
  p_credential text,
  p_device_binding text default null
)
returns table (
  credential_id uuid,
  purchase_id uuid,
  bundle_id uuid,
  seat_id uuid,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_seat public.family_seats%rowtype;
  v_bundle public.family_bundles%rowtype;
begin
  v_access := public.validate_device_access(p_credential, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return;
  end if;
  v_hash := public._cw_hash_secret(trim(p_credential));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;
  if v_cred.bundle_seat_id is null then
    return;
  end if;
  select * into v_seat from public.family_seats where id = v_cred.bundle_seat_id;
  select * into v_bundle from public.family_bundles where id = v_seat.bundle_id;
  if v_seat.status is distinct from 'claimed'
     or v_bundle.status is distinct from 'active'
  then
    return;
  end if;
  credential_id := v_cred.id;
  purchase_id := v_cred.purchase_id;
  bundle_id := v_bundle.id;
  seat_id := v_seat.id;
  role := v_seat.role;
  return next;
end;
$$;

drop function if exists public.create_walk_session_for_credential(text, text);
drop function if exists public.create_walk_session_for_credential(text, text, text);

create or replace function public.create_walk_session_for_credential(
  p_credential text,
  p_resume_policy text default 'leader',
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
  v_code text;
  v_policy text;
begin
  select * into v_auth from public._cw_active_seat_for_credential(p_credential, p_device_binding) limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  v_policy := case when p_resume_policy = 'anyone' then 'anyone' else 'leader' end;

  update public.walk_sessions
  set expires_at = now(), status = 'ended', updated_at = now()
  where bundle_id = v_auth.bundle_id and status = 'active' and expires_at > now();

  loop
    v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 5));
    exit when not exists (
      select 1 from public.walk_sessions
      where join_code = v_code and status = 'active' and expires_at > now()
    );
  end loop;

  insert into public.walk_sessions (
    bundle_id, join_code, leader_seat_id, resume_policy, sync_enabled, status
  ) values (
    v_auth.bundle_id, v_code, v_auth.seat_id, v_policy, true, 'active'
  ) returning * into v_session;

  return jsonb_build_object(
    'ok', true,
    'id', v_session.id,
    'bundleId', v_session.bundle_id,
    'joinCode', v_session.join_code,
    'leaderSeatId', v_session.leader_seat_id,
    'syncEnabled', v_session.sync_enabled,
    'resumePolicy', v_session.resume_policy,
    'waypointId', v_session.waypoint_id,
    'chapterIndex', v_session.chapter_index,
    'positionSeconds', v_session.position_seconds,
    'playbackRate', v_session.playback_rate,
    'playing', v_session.playing,
    'paused', v_session.paused,
    'updatedAt', v_session.updated_at,
    'expiresAt', v_session.expires_at
  );
end;
$$;

drop function if exists public.get_walk_session_for_credential(text, uuid);
drop function if exists public.get_walk_session_for_credential(text, uuid, text);

create or replace function public.get_walk_session_for_credential(
  p_credential text,
  p_session_id uuid,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
begin
  select * into v_auth from public._cw_active_seat_for_credential(p_credential, p_device_binding) limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  select * into v_session
  from public.walk_sessions
  where id = p_session_id
    and bundle_id = v_auth.bundle_id
    and status = 'active'
    and expires_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;

  return jsonb_build_object(
    'ok', true,
    'id', v_session.id,
    'bundleId', v_session.bundle_id,
    'joinCode', v_session.join_code,
    'leaderSeatId', v_session.leader_seat_id,
    'syncEnabled', v_session.sync_enabled,
    'resumePolicy', v_session.resume_policy,
    'waypointId', v_session.waypoint_id,
    'chapterIndex', v_session.chapter_index,
    'positionSeconds', v_session.position_seconds,
    'playbackRate', v_session.playback_rate,
    'playing', v_session.playing,
    'paused', v_session.paused,
    'pauseSourceSeatId', v_session.pause_source_seat_id,
    'updatedAt', v_session.updated_at,
    'expiresAt', v_session.expires_at
  );
end;
$$;

drop function if exists public.update_walk_session_for_credential(text, uuid, jsonb);
drop function if exists public.update_walk_session_for_credential(text, uuid, jsonb, text);

create or replace function public.update_walk_session_for_credential(
  p_credential text,
  p_session_id uuid,
  p_patch jsonb,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
  v_is_leader boolean;
begin
  select * into v_auth from public._cw_active_seat_for_credential(p_credential, p_device_binding) limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  select * into v_session
  from public.walk_sessions
  where id = p_session_id
    and bundle_id = v_auth.bundle_id
  for update;

  if not found or v_session.status is distinct from 'active' or v_session.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;

  v_is_leader := v_session.leader_seat_id = v_auth.seat_id;

  if p_patch ? 'syncEnabled' then
    v_session.sync_enabled := (p_patch->>'syncEnabled')::boolean;
  end if;
  if p_patch ? 'resumePolicy' then
    v_session.resume_policy := case when p_patch->>'resumePolicy' = 'anyone' then 'anyone' else 'leader' end;
  end if;

  if p_patch ? 'event' then
    if not v_session.sync_enabled and (p_patch->>'event') in ('pause', 'resume', 'seek', 'rate', 'clock') then
      null;
    else
      case p_patch->>'event'
        when 'pause' then
          v_session.playing := false;
          v_session.paused := true;
          v_session.pause_source_seat_id := v_auth.seat_id;
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
        when 'resume' then
          if v_session.resume_policy = 'leader' and not v_is_leader then
            return jsonb_build_object('ok', false, 'reason', 'resume_leader_only');
          end if;
          v_session.playing := true;
          v_session.paused := false;
          v_session.pause_source_seat_id := null;
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
        when 'seek' then
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
          if p_patch ? 'chapterIndex' then
            v_session.chapter_index := (p_patch->>'chapterIndex')::int;
          end if;
        when 'rate' then
          if p_patch ? 'playbackRate' then
            v_session.playback_rate := (p_patch->>'playbackRate')::double precision;
          end if;
        when 'clock' then
          if v_is_leader then
            if p_patch ? 'waypointId' then v_session.waypoint_id := p_patch->>'waypointId'; end if;
            if p_patch ? 'chapterIndex' then v_session.chapter_index := (p_patch->>'chapterIndex')::int; end if;
            if p_patch ? 'positionSeconds' then v_session.position_seconds := (p_patch->>'positionSeconds')::double precision; end if;
            if p_patch ? 'playbackRate' then v_session.playback_rate := (p_patch->>'playbackRate')::double precision; end if;
            if p_patch ? 'playing' then v_session.playing := (p_patch->>'playing')::boolean; end if;
            if p_patch ? 'paused' then v_session.paused := (p_patch->>'paused')::boolean; end if;
          end if;
        else
          null;
      end case;
    end if;
  end if;

  v_session.updated_at := now();

  update public.walk_sessions set
    sync_enabled = v_session.sync_enabled,
    resume_policy = v_session.resume_policy,
    waypoint_id = v_session.waypoint_id,
    chapter_index = v_session.chapter_index,
    position_seconds = v_session.position_seconds,
    playback_rate = v_session.playback_rate,
    playing = v_session.playing,
    paused = v_session.paused,
    pause_source_seat_id = v_session.pause_source_seat_id,
    updated_at = v_session.updated_at
  where id = p_session_id;

  return public.get_walk_session_for_credential(p_credential, p_session_id, p_device_binding);
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10) Retire insecure anon RPCs (replace with fail-closed stubs)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.create_family_bundle(
  p_access_token text,
  p_tier text,
  p_device_id text,
  p_owner_name text default 'Leader'
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.get_family_bundle(p_bundle_id uuid, p_device_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.claim_family_seat(
  p_invite_code text,
  p_device_id text,
  p_display_name text default 'Walker'
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.get_bundle_for_device(p_device_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.create_walk_session(
  p_bundle_id uuid,
  p_device_id text,
  p_resume_policy text default 'leader'
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.join_walk_session(p_join_code text, p_device_id text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.get_walk_session(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

create or replace function public.update_walk_session_state(
  p_session_id uuid,
  p_device_id text,
  p_patch jsonb
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('ok', false, 'reason', 'retired');
$$;

-- Fix journey upsert to avoid partial-index ON CONFLICT inference issues
create or replace function public.upsert_journey_progress(
  p_token text,
  p_snapshot jsonb,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_existing uuid;
begin
  v_access := public.validate_device_access(p_token, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if p_snapshot is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_args');
  end if;

  v_hash := public._cw_hash_secret(trim(p_token));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;

  if v_cred.bundle_seat_id is not null then
    select id into v_existing from public.journey_progress where bundle_seat_id = v_cred.bundle_seat_id;
    if v_existing is null then
      insert into public.journey_progress (purchase_id, bundle_seat_id, snapshot, updated_at)
      values (v_cred.purchase_id, v_cred.bundle_seat_id, p_snapshot, now());
    else
      update public.journey_progress
      set snapshot = p_snapshot, updated_at = now()
      where id = v_existing;
    end if;
  else
    select id into v_existing from public.journey_progress where access_credential_id = v_cred.id;
    if v_existing is null then
      insert into public.journey_progress (purchase_id, access_credential_id, snapshot, updated_at)
      values (v_cred.purchase_id, v_cred.id, p_snapshot, now());
    else
      update public.journey_progress
      set snapshot = p_snapshot, updated_at = now()
      where id = v_existing;
    end if;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.get_journey_progress(
  p_token text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_access jsonb;
  v_hash text;
  v_cred public.access_credentials%rowtype;
  v_row public.journey_progress%rowtype;
begin
  v_access := public.validate_device_access(p_token, p_device_binding);
  if coalesce((v_access->>'ok')::boolean, false) is not true then
    return null;
  end if;

  v_hash := public._cw_hash_secret(trim(p_token));
  select * into v_cred from public.access_credentials where credential_hash = v_hash;

  if v_cred.bundle_seat_id is not null then
    select * into v_row from public.journey_progress where bundle_seat_id = v_cred.bundle_seat_id;
  else
    select * into v_row from public.journey_progress where access_credential_id = v_cred.id;
  end if;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'snapshot', v_row.snapshot,
    'updated_at', v_row.updated_at
  );
end;
$$;

-- Grants: anon only audited RPCs
revoke all on function public.create_family_bundle(text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_family_bundle(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_family_seat(text, text, text) from public, anon, authenticated;
revoke all on function public.get_bundle_for_device(text) from public, anon, authenticated;
revoke all on function public.create_walk_session(uuid, text, text) from public, anon, authenticated;
revoke all on function public.join_walk_session(text, text) from public, anon, authenticated;
revoke all on function public.get_walk_session(uuid) from public, anon, authenticated;
revoke all on function public.update_walk_session_state(uuid, text, jsonb) from public, anon, authenticated;

grant execute on function public.validate_access_token(text) to anon;
grant execute on function public.get_purchase_for_token(text) to anon;
grant execute on function public.redeem_purchase_claim(text, text) to anon;
grant execute on function public.validate_device_access(text, text) to anon;
grant execute on function public.get_organizer_bundle_status(text, text) to anon;
grant execute on function public.create_bundle_invite(text, uuid, interval, text) to anon;
grant execute on function public.redeem_bundle_invite(text, text, text) to anon;
grant execute on function public.revoke_bundle_seat(text, uuid, text) to anon;
grant execute on function public.upsert_journey_progress(text, jsonb, text) to anon;
grant execute on function public.get_journey_progress(text, text) to anon;
grant execute on function public.create_walk_session_for_credential(text, text, text) to anon;
grant execute on function public.get_walk_session_for_credential(text, uuid, text) to anon;
grant execute on function public.update_walk_session_for_credential(text, uuid, jsonb, text) to anon;

-- Inbox helper: reject duplicate event IDs safely
create or replace function public.record_paddle_webhook_event(
  p_event_id text,
  p_event_type text,
  p_occurred_at timestamptz,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_event_id');
  end if;

  begin
    insert into public.paddle_webhook_events (
      event_id, event_type, occurred_at, status, attempts, payload
    ) values (
      trim(p_event_id), coalesce(p_event_type, 'unknown'), p_occurred_at, 'received', 1, p_payload
    );
    return jsonb_build_object('ok', true, 'duplicate', false);
  exception when unique_violation then
    update public.paddle_webhook_events
    set attempts = attempts + 1
    where event_id = trim(p_event_id);
    return jsonb_build_object('ok', true, 'duplicate', true);
  end;
end;
$$;

revoke all on function public.record_paddle_webhook_event(text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_paddle_webhook_event(text, text, timestamptz, jsonb)
  to service_role;

-- See docs/LAUNCH_COMMERCE_APPLY_ORDER.md for dashboard apply order.
