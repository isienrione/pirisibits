-- Paddle adjustment handling: refunds, credits, chargebacks.
-- Run after 20260722_fulfillment_outbox_worker.sql (non-production first).

alter table public.purchase_adjustments
  add column if not exists adjustment_type text;

alter table public.purchase_adjustments
  add column if not exists occurred_at timestamptz;

alter table public.purchase_adjustments
  add column if not exists operator_review boolean not null default false;

alter table public.purchase_adjustments
  add column if not exists effect text;

alter table public.purchase_adjustments
  add column if not exists updated_at timestamptz not null default now();

alter table public.purchases
  add column if not exists last_adjustment_occurred_at timestamptz;

create index if not exists purchases_last_adjustment_occurred_at_idx
  on public.purchases (last_adjustment_occurred_at desc nulls last);

-- Reactivate / rotate a revoked paid bundle instead of returning a dead id.
create or replace function public.ensure_paid_bundle(p_purchase_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_bundle public.family_bundles%rowtype;
  v_bundle_id uuid;
  v_seat_limit int;
  v_i int;
  v_owner_seat uuid;
  v_seat_count int;
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

  select * into v_bundle
  from public.family_bundles
  where purchase_id = p_purchase_id
  order by created_at asc
  limit 1
  for update;

  if v_bundle.id is not null then
    v_bundle_id := v_bundle.id;
    update public.family_bundles
    set
      status = 'active',
      seat_limit = v_seat_limit,
      content_product_id = coalesce(v_purchase.content_product_id, content_product_id, 'rome-complete'),
      updated_at = now()
    where id = v_bundle_id;

    -- Rotate seats: clear credentials; never revive old bearer values.
    update public.family_seats
    set
      status = 'open',
      credential_hash = null,
      device_binding_hash = null,
      claimed_device_id = null,
      claimed_at = null,
      revoked_at = null,
      updated_at = now()
    where bundle_id = v_bundle_id;

    update public.bundle_invites
    set revoked_at = coalesce(revoked_at, now())
    where bundle_id = v_bundle_id and revoked_at is null;

    update public.walk_sessions
    set status = 'revoked', expires_at = least(expires_at, now()), updated_at = now()
    where bundle_id = v_bundle_id and status = 'active';

    select count(*) into v_seat_count from public.family_seats where bundle_id = v_bundle_id;
    if v_seat_count < v_seat_limit then
      for v_i in (v_seat_count + 1)..v_seat_limit loop
        insert into public.family_seats (bundle_id, label, role, status, invite_code, created_at, updated_at)
        values (
          v_bundle_id,
          case
            when v_i = 1 then 'Owner'
            when v_purchase.product_id = 'rome-couple' then 'Partner'
            else 'Walker ' || v_i::text
          end,
          case when v_i = 1 then 'owner' else 'member' end,
          'open',
          null,
          now(),
          now()
        );
      end loop;
    end if;

    -- Ensure exactly one owner seat
    if not exists (
      select 1 from public.family_seats where bundle_id = v_bundle_id and role = 'owner'
    ) then
      update public.family_seats
      set role = 'owner', label = 'Owner', updated_at = now()
      where id = (
        select id from public.family_seats
        where bundle_id = v_bundle_id
        order by created_at asc
        limit 1
      );
    end if;

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

/**
 * Idempotent adjustment apply.
 * Stores the adjustment row; revokes access only for approved full refund/credit
 * or chargeback / chargeback_warning. Never silently restores access.
 */
create or replace function public.apply_paddle_adjustment(
  p_adjustment_id text,
  p_transaction_id text,
  p_action text,
  p_status text,
  p_type text,
  p_occurred_at timestamptz,
  p_effect text,
  p_revoke boolean,
  p_purchase_status text,
  p_operator_review boolean,
  p_reason text,
  p_raw jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_existing public.purchase_adjustments%rowtype;
  v_applied boolean := false;
  v_out_of_order boolean := false;
begin
  if p_adjustment_id is null or length(trim(p_adjustment_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_adjustment_id');
  end if;
  if p_transaction_id is null or length(trim(p_transaction_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_transaction_id');
  end if;

  select * into v_existing
  from public.purchase_adjustments
  where adjustment_id = trim(p_adjustment_id)
  for update;

  if found
     and v_existing.occurred_at is not null
     and p_occurred_at is not null
     and p_occurred_at < v_existing.occurred_at
  then
    v_out_of_order := true;
  end if;

  select * into v_purchase
  from public.purchases
  where order_id = trim(p_transaction_id)
  for update;

  if not found then
    insert into public.purchase_adjustments (
      adjustment_id, order_id, purchase_id, action, status, adjustment_type,
      occurred_at, operator_review, effect, raw, processed_at, updated_at
    ) values (
      trim(p_adjustment_id),
      trim(p_transaction_id),
      null,
      p_action,
      p_status,
      p_type,
      p_occurred_at,
      true,
      coalesce(p_effect, 'record_only'),
      p_raw,
      now(),
      now()
    )
    on conflict (adjustment_id) do update set
      action = excluded.action,
      status = excluded.status,
      adjustment_type = excluded.adjustment_type,
      occurred_at = case
        when purchase_adjustments.occurred_at is null then excluded.occurred_at
        when excluded.occurred_at is null then purchase_adjustments.occurred_at
        when excluded.occurred_at >= purchase_adjustments.occurred_at then excluded.occurred_at
        else purchase_adjustments.occurred_at
      end,
      operator_review = true,
      effect = excluded.effect,
      raw = coalesce(excluded.raw, purchase_adjustments.raw),
      updated_at = now(),
      processed_at = now();

    return jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'unknown_transaction',
      'operator_review', true
    );
  end if;

  -- Purchase-level out-of-order: older adjustment must not undo newer terminal state.
  if v_purchase.last_adjustment_occurred_at is not null
     and p_occurred_at is not null
     and p_occurred_at < v_purchase.last_adjustment_occurred_at
  then
    v_out_of_order := true;
  end if;

  insert into public.purchase_adjustments (
    adjustment_id, order_id, purchase_id, action, status, adjustment_type,
    occurred_at, operator_review, effect, raw, processed_at, updated_at
  ) values (
    trim(p_adjustment_id),
    trim(p_transaction_id),
    v_purchase.id,
    p_action,
    p_status,
    p_type,
    p_occurred_at,
    coalesce(p_operator_review, false) or v_out_of_order,
    coalesce(p_effect, 'record_only'),
    p_raw,
    now(),
    now()
  )
  on conflict (adjustment_id) do update set
    purchase_id = coalesce(excluded.purchase_id, purchase_adjustments.purchase_id),
    order_id = excluded.order_id,
    action = case
      when v_out_of_order then purchase_adjustments.action
      else excluded.action
    end,
    status = case
      when v_out_of_order then purchase_adjustments.status
      else excluded.status
    end,
    adjustment_type = case
      when v_out_of_order then purchase_adjustments.adjustment_type
      else excluded.adjustment_type
    end,
    occurred_at = case
      when purchase_adjustments.occurred_at is null then excluded.occurred_at
      when excluded.occurred_at is null then purchase_adjustments.occurred_at
      when excluded.occurred_at >= purchase_adjustments.occurred_at then excluded.occurred_at
      else purchase_adjustments.occurred_at
    end,
    operator_review = purchase_adjustments.operator_review
      or coalesce(excluded.operator_review, false)
      or v_out_of_order,
    effect = case
      when v_out_of_order then purchase_adjustments.effect
      else excluded.effect
    end,
    raw = coalesce(excluded.raw, purchase_adjustments.raw),
    updated_at = now(),
    processed_at = now();

  if v_out_of_order then
    return jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'out_of_order',
      'purchase_id', v_purchase.id,
      'purchase_status', v_purchase.status
    );
  end if;

  if coalesce(p_revoke, false)
     and p_purchase_status in ('refunded', 'disputed')
  then
    perform public.revoke_purchase_access(v_purchase.id, p_purchase_status);
    v_applied := true;
    -- Only advance purchase ordering watermark when access actually changes.
    update public.purchases
    set
      last_adjustment_occurred_at = coalesce(p_occurred_at, last_adjustment_occurred_at),
      updated_at = now()
    where id = v_purchase.id;
  else
    update public.purchases
    set updated_at = now()
    where id = v_purchase.id;
  end if;

  -- Refresh purchase status after possible revoke
  select status into v_purchase.status from public.purchases where id = v_purchase.id;

  return jsonb_build_object(
    'ok', true,
    'applied', v_applied,
    'reason', coalesce(p_reason, p_effect),
    'purchase_id', v_purchase.id,
    'purchase_status', v_purchase.status,
    'operator_review', coalesce(p_operator_review, false)
  );
end;
$$;

revoke all on function public.apply_paddle_adjustment(
  text, text, text, text, text, timestamptz, text, boolean, text, boolean, text, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_paddle_adjustment(
  text, text, text, text, text, timestamptz, text, boolean, text, boolean, text, jsonb
) to service_role;

/**
 * Explicit operator restoration after refund/dispute reversal review.
 * Never reactivates a consumed claim — issues a fresh operator_recovery secret.
 * Rotates bundle seats/credentials rather than reviving old bearer values.
 */
create or replace function public.operator_restore_purchase_access(
  p_order_id text,
  p_reason text default 'operator_restore'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase public.purchases%rowtype;
  v_claim text;
  v_bundle_id uuid;
begin
  if p_order_id is null or length(trim(p_order_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_order_id');
  end if;

  select * into v_purchase
  from public.purchases
  where order_id = trim(p_order_id)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'unknown_transaction');
  end if;

  -- Invalidate everything first (claims, credentials, seats, invites, sessions).
  perform public.revoke_purchase_access(v_purchase.id, 'revoked');

  update public.purchases
  set
    status = 'active',
    revoked_at = null,
    revoked_reason = null,
    updated_at = now()
  where id = v_purchase.id;

  if v_purchase.product_id in ('rome-couple', 'rome-family') then
    v_bundle_id := public.ensure_paid_bundle(v_purchase.id);
  end if;

  v_claim := public.issue_purchase_claim(v_purchase.id, 'operator_recovery', interval '7 days');

  return jsonb_build_object(
    'ok', true,
    'purchase_id', v_purchase.id,
    'product_id', v_purchase.product_id,
    'bundle_id', v_bundle_id,
    'claim', v_claim,
    'purpose', 'operator_recovery',
    'reason', coalesce(p_reason, 'operator_restore')
  );
end;
$$;

revoke all on function public.operator_restore_purchase_access(text, text)
  from public, anon, authenticated;
grant execute on function public.operator_restore_purchase_access(text, text) to service_role;
