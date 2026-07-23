-- Failed webhook reclaim + effective-full refund retry support.
-- Run after 20260726_walk_session_participant.sql.
--
-- Allows Paddle to replay a previously failed (operator_review) event so ChronoWalk
-- can reclassify effective-full item refunds without minting a new adjustment id.
-- Processed / processing events remain duplicates and are never reapplied.

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
declare
  v_existing public.paddle_webhook_events%rowtype;
  v_reclaimed text;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_event_id');
  end if;

  begin
    insert into public.paddle_webhook_events (
      event_id, event_type, occurred_at, status, attempts, payload, operator_review, last_error, processed_at
    ) values (
      trim(p_event_id),
      coalesce(p_event_type, 'unknown'),
      p_occurred_at,
      'processing',
      1,
      p_payload,
      false,
      null,
      null
    );
    return jsonb_build_object(
      'ok', true,
      'duplicate', false,
      'reclaim', false,
      'status', 'processing'
    );
  exception when unique_violation then
    select * into v_existing
    from public.paddle_webhook_events
    where event_id = trim(p_event_id);

    if not found then
      return jsonb_build_object('ok', false, 'reason', 'missing_event_row');
    end if;

    -- Successful / in-flight events stay duplicates (no double apply).
    if v_existing.status in ('processed', 'processing') then
      update public.paddle_webhook_events
      set attempts = attempts + 1
      where event_id = trim(p_event_id);
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'reclaim', false,
        'status', v_existing.status
      );
    end if;

    -- Atomically reclaim a failed event for one retry winner.
    if v_existing.status = 'failed' then
      update public.paddle_webhook_events
      set
        status = 'processing',
        attempts = attempts + 1,
        last_error = null,
        operator_review = false,
        processed_at = null,
        event_type = coalesce(p_event_type, event_type),
        occurred_at = coalesce(p_occurred_at, occurred_at),
        payload = coalesce(p_payload, payload)
      where event_id = trim(p_event_id)
        and status = 'failed'
      returning event_id into v_reclaimed;

      if v_reclaimed is not null then
        return jsonb_build_object(
          'ok', true,
          'duplicate', false,
          'reclaim', true,
          'status', 'processing'
        );
      end if;

      -- Lost the race to another concurrent reclaim / processor.
      select status into v_existing.status
      from public.paddle_webhook_events
      where event_id = trim(p_event_id);
      update public.paddle_webhook_events
      set attempts = attempts + 1
      where event_id = trim(p_event_id);
      return jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'reclaim', false,
        'status', coalesce(v_existing.status, 'processing')
      );
    end if;

    -- received / ignored / other → treat as duplicate (do not reprocess blindly).
    update public.paddle_webhook_events
    set attempts = attempts + 1
    where event_id = trim(p_event_id);
    return jsonb_build_object(
      'ok', true,
      'duplicate', true,
      'reclaim', false,
      'status', v_existing.status
    );
  end;
end;
$$;

revoke all on function public.record_paddle_webhook_event(text, text, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_paddle_webhook_event(text, text, timestamptz, jsonb)
  to service_role;

create or replace function public.complete_paddle_webhook_event(
  p_event_id text,
  p_ok boolean,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  if p_event_id is null or length(trim(p_event_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_event_id');
  end if;

  if coalesce(p_ok, false) then
    update public.paddle_webhook_events
    set
      status = 'processed',
      processed_at = now(),
      last_error = null,
      operator_review = false
    where event_id = trim(p_event_id)
    returning event_id into v_id;
  else
    update public.paddle_webhook_events
    set
      status = 'failed',
      processed_at = null,
      operator_review = true,
      last_error = left(coalesce(nullif(trim(p_error), ''), 'failed'), 200)
    where event_id = trim(p_event_id)
    returning event_id into v_id;
  end if;

  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'missing_event_row');
  end if;
  return jsonb_build_object('ok', true, 'event_id', v_id, 'status', case when p_ok then 'processed' else 'failed' end);
end;
$$;

revoke all on function public.complete_paddle_webhook_event(text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.complete_paddle_webhook_event(text, boolean, text)
  to service_role;

-- Clear operator_review when a later (non out-of-order) apply succeeds without review.
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
    operator_review = case
      when v_out_of_order then true
      else coalesce(excluded.operator_review, false)
    end,
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
