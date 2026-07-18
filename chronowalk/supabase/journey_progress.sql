-- Cloud journey resume — run in Supabase SQL editor after v2_app_config.sql

alter table public.purchases
  add column if not exists product_id text;

create table if not exists public.journey_progress (
  access_token uuid primary key references public.purchases (access_token) on delete cascade,
  snapshot jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.journey_progress enable row level security;

create policy "journey_progress service only"
  on public.journey_progress for all
  to service_role
  using (true)
  with check (true);

-- Detailed purchase lookup for magic-link unlock (product + ok flag)
create or replace function public.get_purchase_for_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_row public.purchases%rowtype;
begin
  if p_token is null or p_token = '' then
    return jsonb_build_object('ok', false);
  end if;

  select * into v_row
  from public.purchases
  where access_token = p_token::uuid
  limit 1;

  if not found then
    return jsonb_build_object('ok', false);
  end if;

  return jsonb_build_object(
    'ok', true,
    'product_id', v_row.product_id,
    'access_token', v_row.access_token::text
  );
end;
$$;

grant execute on function public.get_purchase_for_token(text) to anon;

create or replace function public.upsert_journey_progress(p_token text, p_snapshot jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if p_token is null or p_snapshot is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_args');
  end if;

  v_token := p_token::uuid;

  if not exists (select 1 from public.purchases where access_token = v_token) then
    return jsonb_build_object('ok', false, 'reason', 'token_not_found');
  end if;

  insert into public.journey_progress (access_token, snapshot, updated_at)
  values (v_token, p_snapshot, now())
  on conflict (access_token) do update
    set snapshot = excluded.snapshot,
        updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.upsert_journey_progress(text, jsonb) to anon;

create or replace function public.get_journey_progress(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_row public.journey_progress%rowtype;
begin
  if p_token is null or p_token = '' then
    return null;
  end if;

  select * into v_row
  from public.journey_progress
  where access_token = p_token::uuid
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'snapshot', v_row.snapshot,
    'updated_at', v_row.updated_at
  );
end;
$$;

grant execute on function public.get_journey_progress(text) to anon;
