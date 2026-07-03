-- ChronoWalk v2 app configuration (run in Supabase SQL editor)

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);

insert into public.app_config (key, value) values
  ('price', '{"cents":1700,"currency":"EUR"}'::jsonb),
  ('ab', '{"enabled":true,"variants":[1400,1900],"split":0.5}'::jsonb),
  ('review_url', '"https://www.google.com/maps"'::jsonb),
  ('checkout_url', '""'::jsonb)
on conflict (key) do update set value = excluded.value;

-- Purchases table for Lemon Squeezy webhook (M9)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  order_id text not null unique,
  host text,
  ab_variant integer,
  access_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists purchases_access_token_idx on public.purchases (access_token);
create index if not exists purchases_email_idx on public.purchases (email);

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
