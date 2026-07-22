-- Canonical bundle-invite normalization (trim + lowercase).
-- Run after 20260721_launch_commerce_hardening.sql (non-production first).
--
-- Existing invite secrets are lowercase hex from encode(..., 'hex').
-- Clients (and third parties) may submit upper/mixed case; redeem must
-- canonicalize before rate-limit bucketing and _cw_hash_secret so case
-- variants cannot miss the hash or bypass rate limits.

create or replace function public._cw_normalize_bundle_invite(p_invite text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(p_invite, '')));
$$;

revoke all on function public._cw_normalize_bundle_invite(text)
  from public, anon, authenticated;
grant execute on function public._cw_normalize_bundle_invite(text) to service_role;

-- Hash newly minted invites through the same canonical form (identity for hex).
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

  v_raw := public._cw_new_secret(16); -- 128 bits, lowercase hex
  v_invite_hash := public._cw_hash_secret(public._cw_normalize_bundle_invite(v_raw));
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

revoke all on function public.create_bundle_invite(text, uuid, interval, text)
  from public, anon, authenticated;
grant execute on function public.create_bundle_invite(text, uuid, interval, text) to anon;

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
  v_invite_raw text;
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
  v_invite_raw := public._cw_normalize_bundle_invite(p_invite);
  if length(v_invite_raw) < 16 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Schema-qualify: hosted Supabase keeps pgcrypto in `extensions`, and this
  -- SECURITY DEFINER function uses search_path = public only.
  -- Bucket uses the canonical invite so case variants share one limiter.
  v_bucket := 'invite:' || left(
    encode(extensions.digest(convert_to(v_invite_raw, 'utf8'), 'sha256'), 'hex'),
    16
  );
  if not public._cw_rate_limit(v_bucket, 10, interval '10 minutes') then
    return jsonb_build_object('ok', false, 'reason', 'rate_limited');
  end if;

  begin
    v_hash := public._cw_hash_secret(v_invite_raw);
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

revoke all on function public.redeem_bundle_invite(text, text, text)
  from public, anon, authenticated;
grant execute on function public.redeem_bundle_invite(text, text, text) to anon;
