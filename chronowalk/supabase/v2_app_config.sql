-- ChronoWalk v2 app configuration (run in Supabase SQL editor)

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);

insert into public.app_config (key, value) values
  ('price', '{"cents":1700,"currency":"EUR"}'::jsonb),
  ('ab', '{"enabled":true,"variants":[1400,1900],"split":0.5}'::jsonb),
  ('review_url', '"https://www.google.com/maps"'::jsonb),
  ('checkout_url', '"https://chronowalk.lemonsqueezy.com/checkout/buy/1a82bca2-f4a8-4b40-812d-fb7398afb75d"'::jsonb)
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
