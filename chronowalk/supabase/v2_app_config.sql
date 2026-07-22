-- ChronoWalk v2 app configuration (run in Supabase SQL editor)
-- DEPRECATED for new environments: prefer
--   supabase/migrations/20260721_launch_commerce_hardening.sql
-- which extends purchases, retires legacy bearer RPCs, and hardens access.
-- Keep this file only for historical bootstrap of app_config + base purchases.

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);

insert into public.app_config (key, value) values
  ('price', '{"cents":1499,"currency":"EUR"}'::jsonb),
  ('ab', '{"enabled":false,"variants":[1499,1499],"split":0.5}'::jsonb),
  ('review_url', '"https://www.google.com/maps"'::jsonb),
  -- Legacy Lemon URL cleared; Paddle uses client token + price ids (env or paddle_prices).
  ('checkout_url', '""'::jsonb),
  ('paddle_prices', '{}'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Purchases table for commerce webhook (Paddle transaction.id → order_id)
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

alter table public.purchases
  add column if not exists product_id text;

create index if not exists purchases_access_token_idx on public.purchases (access_token);
create index if not exists purchases_email_idx on public.purchases (email);

-- Token validation for magic links (anon-safe; does not expose purchase rows)
create or replace function public.validate_access_token(p_token text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.purchases
    where access_token = p_token::uuid
  );
$$;

grant execute on function public.validate_access_token(text) to anon;

alter table public.app_config enable row level security;
alter table public.purchases enable row level security;

create policy "app_config read anon"
  on public.app_config for select
  to anon
  using (true);

create policy "purchases service only"
  on public.purchases for all
  to service_role
  using (true)
  with check (true);
