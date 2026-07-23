-- Rolled-back contract checks for failed webhook reclaim.
-- Run after 20260727_webhook_failed_reclaim.sql

begin;

do $$
declare
  v_event jsonb;
  v_result jsonb;
  v_status text;
  v_error text;
  v_attempts integer;
  v_review boolean;
  v_purchase_id uuid;
begin
  if to_regprocedure('public.complete_paddle_webhook_event(text, boolean, text)') is null then
    raise exception 'complete_paddle_webhook_event missing';
  end if;

  -- Fresh event inserts as processing
  v_event := public.record_paddle_webhook_event(
    'evt_RECLAIM_01', 'adjustment.updated', now(), '{"id":"evt_RECLAIM_01"}'::jsonb
  );
  if v_event->>'duplicate' is distinct from 'false'
     or v_event->>'status' is distinct from 'processing' then
    raise exception 'fresh event must be processing: %', v_event;
  end if;

  -- Mark failed (operator review path)
  v_event := public.complete_paddle_webhook_event('evt_RECLAIM_01', false, 'partial_operator_review');
  if v_event->>'status' is distinct from 'failed' then
    raise exception 'complete failed expected: %', v_event;
  end if;
  select status, attempts, last_error, operator_review
    into v_status, v_attempts, v_error, v_review
  from public.paddle_webhook_events
  where event_id = 'evt_RECLAIM_01';
  if v_status is distinct from 'failed' or v_review is distinct from true then
    raise exception 'row must be failed with operator_review';
  end if;

  -- Reclaim failed event once
  v_event := public.record_paddle_webhook_event(
    'evt_RECLAIM_01', 'adjustment.updated', now(), '{"id":"evt_RECLAIM_01","retry":true}'::jsonb
  );
  if v_event->>'reclaim' is distinct from 'true'
     or v_event->>'duplicate' is distinct from 'false'
     or v_event->>'status' is distinct from 'processing' then
    raise exception 'failed event must reclaim: %', v_event;
  end if;

  select attempts, last_error, operator_review
    into v_attempts, v_error, v_review
  from public.paddle_webhook_events
  where event_id = 'evt_RECLAIM_01';
  if v_attempts < 2 then
    raise exception 'reclaim must increment attempts';
  end if;
  if v_error is not null then
    raise exception 'reclaim must clear last_error';
  end if;
  if v_review is distinct from false then
    raise exception 'reclaim must clear operator_review';
  end if;

  -- Concurrent reclaim while processing → duplicate
  v_event := public.record_paddle_webhook_event(
    'evt_RECLAIM_01', 'adjustment.updated', now(), '{"id":"evt_RECLAIM_01"}'::jsonb
  );
  if v_event->>'duplicate' is distinct from 'true'
     or v_event->>'reclaim' is distinct from 'false' then
    raise exception 'processing event must stay duplicate: %', v_event;
  end if;

  -- Successful complete
  v_event := public.complete_paddle_webhook_event('evt_RECLAIM_01', true, null);
  if v_event->>'status' is distinct from 'processed' then
    raise exception 'complete ok expected processed: %', v_event;
  end if;

  -- Processed remains duplicate (no reapply)
  v_event := public.record_paddle_webhook_event(
    'evt_RECLAIM_01', 'adjustment.updated', now(), '{"id":"evt_RECLAIM_01"}'::jsonb
  );
  if v_event->>'duplicate' is distinct from 'true'
     or v_event->>'reclaim' is distinct from 'false' then
    raise exception 'processed event must stay duplicate: %', v_event;
  end if;

  -- Adjustment idempotency: apply revoke twice → second applied still safe
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+reclaim-adj@example.invalid',
    'txn_VERIFY_RECLAIM_ADJ_01',
    'rome-couple',
    'rome-complete',
    2,
    'active',
    'pri_verify_reclaim_adj'
  ) returning id into v_purchase_id;

  perform public.ensure_paid_bundle(v_purchase_id);

  v_result := public.apply_paddle_adjustment(
    'adj_VERIFY_RECLAIM_01',
    'txn_VERIFY_RECLAIM_ADJ_01',
    'refund',
    'approved',
    'partial',
    '2026-07-27T12:00:00Z',
    'refund',
    true,
    'refunded',
    false,
    'effective_full_item_coverage',
    '{}'::jsonb
  );
  if v_result->>'applied' is distinct from 'true'
     or v_result->>'purchase_status' is distinct from 'refunded' then
    raise exception 'first effective full apply failed: %', v_result;
  end if;

  v_result := public.apply_paddle_adjustment(
    'adj_VERIFY_RECLAIM_01',
    'txn_VERIFY_RECLAIM_ADJ_01',
    'refund',
    'approved',
    'partial',
    '2026-07-27T12:00:00Z',
    'refund',
    true,
    'refunded',
    false,
    'effective_full_item_coverage',
    '{}'::jsonb
  );
  if v_result->>'purchase_status' is distinct from 'refunded' then
    raise exception 'retry apply must remain refunded: %', v_result;
  end if;
  if (select operator_review from public.purchase_adjustments where adjustment_id = 'adj_VERIFY_RECLAIM_01')
     is distinct from false then
    raise exception 'successful retry must clear operator_review';
  end if;

  raise notice 'webhook_failed_reclaim verify ok';
end;
$$;

rollback;
