-- Buyer self-serve: request a fresh ChronoWalk access email from /access.
-- Rate-limit log only — restore/requeue stay in the Edge function (needs claim crypto).

create table if not exists public.access_email_request_log (
  id uuid primary key default gen_random_uuid(),
  email_norm text not null,
  order_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists access_email_request_log_email_created_idx
  on public.access_email_request_log (email_norm, created_at desc);

create index if not exists access_email_request_log_order_created_idx
  on public.access_email_request_log (order_id, created_at desc);

alter table public.access_email_request_log enable row level security;

revoke all on table public.access_email_request_log from public, anon, authenticated;
grant select, insert, delete on table public.access_email_request_log to service_role;

-- Returns whether this email+order pair may proceed (and records the attempt when allowed).
create or replace function public.buyer_access_email_rate_limit(
  p_email text,
  p_order_id text,
  p_max_per_hour integer default 3
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_order text := trim(coalesce(p_order_id, ''));
  v_max int := greatest(1, least(coalesce(p_max_per_hour, 3), 10));
  v_email_count int;
  v_order_count int;
begin
  if v_email = '' or v_order = '' then
    return jsonb_build_object('ok', false, 'allowed', false, 'reason', 'missing_fields');
  end if;

  select count(*)::int into v_email_count
  from public.access_email_request_log
  where email_norm = v_email
    and created_at > now() - interval '1 hour';

  select count(*)::int into v_order_count
  from public.access_email_request_log
  where order_id = v_order
    and created_at > now() - interval '1 hour';

  if v_email_count >= v_max or v_order_count >= v_max then
    return jsonb_build_object(
      'ok', true,
      'allowed', false,
      'reason', 'rate_limited',
      'email_count', v_email_count,
      'order_count', v_order_count
    );
  end if;

  insert into public.access_email_request_log (email_norm, order_id)
  values (v_email, v_order);

  return jsonb_build_object(
    'ok', true,
    'allowed', true,
    'email_count', v_email_count + 1,
    'order_count', v_order_count + 1
  );
end;
$$;

revoke all on function public.buyer_access_email_rate_limit(text, text, integer)
  from public, anon, authenticated;
grant execute on function public.buyer_access_email_rate_limit(text, text, integer) to service_role;
