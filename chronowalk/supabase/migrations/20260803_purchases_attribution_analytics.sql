-- Purchases analytics columns for Paddle webhook attribution + PostHog.
-- Extends the existing public.purchases table (order_id = Paddle transaction.id).
-- Idempotent.

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  order_id text not null unique,
  host text,
  ab_variant integer,
  product_id text,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Analytics / attribution (never store raw marketing PII beyond hashed email).
alter table public.purchases
  add column if not exists email_hash text,
  add column if not exists country text,
  add column if not exists custom_data jsonb not null default '{}'::jsonb,
  add column if not exists amount_cents integer,
  add column if not exists currency_code text,
  add column if not exists product_id text;

comment on column public.purchases.order_id is
  'Paddle transaction.id (canonical transaction_id for analytics).';
comment on column public.purchases.email_hash is
  'SHA-256 hex of lowercased buyer email — raw email remains for fulfillment only.';
comment on column public.purchases.country is
  'ISO country code from Paddle billing/shipping address when present.';
comment on column public.purchases.custom_data is
  'Paddle customData attribution blob (ph_distinct_id, UTMs, gclid, ab_variant, cta_location, …).';
comment on column public.purchases.product_id is
  'Purchased tier / SKU (server-derived from price id).';
comment on column public.purchases.amount_cents is
  'Charge total in minor currency units (Paddle details.totals.total).';
comment on column public.purchases.currency_code is
  'ISO 4217 currency code from the Paddle transaction.';

create index if not exists purchases_email_hash_idx
  on public.purchases (email_hash);

create index if not exists purchases_custom_data_gin
  on public.purchases using gin (custom_data);

create index if not exists purchases_order_id_idx
  on public.purchases (order_id);

alter table public.purchases enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'purchases'
      and policyname = 'purchases service only'
  ) then
    create policy "purchases service only"
      on public.purchases for all
      to service_role
      using (true)
      with check (true);
  end if;
end $$;
