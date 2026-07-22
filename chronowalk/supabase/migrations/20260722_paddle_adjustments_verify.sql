-- Rolled-back contract checks for Paddle adjustment handling.
begin;

do $$
declare
  v_purchase_id uuid;
  v_bundle_id uuid;
  v_result jsonb;
  v_result2 jsonb;
  v_claim text;
  v_seat_revoked int;
  v_invite_revoked int;
  v_sessions_revoked int;
  v_cred_active int;
begin
  -- Solo: pending keeps active; approved full refunds; rejected retains (separate purchase)
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+adj@example.invalid', 'txn_ADJ_PENDING_01', 'rome-complete', 'rome-complete', 1, 'active', 'pri_adj_1'
  ) returning id into v_purchase_id;

  v_result := public.apply_paddle_adjustment(
    'adj_PENDING_01', 'txn_ADJ_PENDING_01', 'refund', 'pending_approval', 'full',
    '2026-07-22T10:00:00Z', 'record_only', false, null, false, 'pending_keep_access', '{}'::jsonb
  );
  if (v_result->>'applied')::boolean then
    raise exception 'pending must not revoke';
  end if;
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'active' then
    raise exception 'pending must keep active';
  end if;
  raise notice 'OK pending keeps access';

  v_result := public.apply_paddle_adjustment(
    'adj_PENDING_01', 'txn_ADJ_PENDING_01', 'refund', 'approved', 'full',
    '2026-07-22T11:00:00Z', 'refund', true, 'refunded', false, 'full_refund_approved', '{}'::jsonb
  );
  if not (v_result->>'applied')::boolean then
    raise exception 'approved full refund must apply';
  end if;
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'refunded' then
    raise exception 'approved full refund must set refunded';
  end if;
  -- duplicate approved is idempotent
  v_result2 := public.apply_paddle_adjustment(
    'adj_PENDING_01', 'txn_ADJ_PENDING_01', 'refund', 'approved', 'full',
    '2026-07-22T11:00:00Z', 'refund', true, 'refunded', false, 'full_refund_approved', '{}'::jsonb
  );
  if (select count(*) from public.purchase_adjustments where adjustment_id = 'adj_PENDING_01') <> 1 then
    raise exception 'adjustment rows must be idempotent by id';
  end if;
  raise notice 'OK approved full refund + duplicate';

  -- Rejected refund retains active
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+rej@example.invalid', 'txn_ADJ_REJECT_01', 'rome-essential', 'rome-essential', 1, 'active', 'pri_adj_2'
  ) returning id into v_purchase_id;

  perform public.apply_paddle_adjustment(
    'adj_REJECT_01', 'txn_ADJ_REJECT_01', 'refund', 'rejected', 'full',
    '2026-07-22T12:00:00Z', 'record_only', false, null, false, 'rejected_retain_active', '{}'::jsonb
  );
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'active' then
    raise exception 'rejected must retain active';
  end if;
  raise notice 'OK rejected retains active';

  -- Partial → operator review, no revoke
  perform public.apply_paddle_adjustment(
    'adj_PARTIAL_01', 'txn_ADJ_REJECT_01', 'refund', 'approved', 'partial',
    '2026-07-22T12:30:00Z', 'record_only', false, null, true, 'partial_operator_review', '{}'::jsonb
  );
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'active' then
    raise exception 'partial must not revoke';
  end if;
  if not (select operator_review from public.purchase_adjustments where adjustment_id = 'adj_PARTIAL_01') then
    raise exception 'partial must flag operator_review';
  end if;
  raise notice 'OK partial operator review';

  -- Chargeback → disputed
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+cb@example.invalid', 'txn_ADJ_CB_01', 'rome-central', 'rome-central', 1, 'active', 'pri_adj_3'
  ) returning id into v_purchase_id;

  v_result := public.apply_paddle_adjustment(
    'adj_CB_01', 'txn_ADJ_CB_01', 'chargeback', 'approved', 'full',
    '2026-07-22T13:00:00Z', 'dispute', true, 'disputed', false, 'chargeback', '{}'::jsonb
  );
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'disputed' then
    raise exception 'chargeback must set disputed';
  end if;
  raise notice 'OK chargeback disputed';

  -- Unknown transaction recorded for review
  v_result := public.apply_paddle_adjustment(
    'adj_UNKNOWN_01', 'txn_DOES_NOT_EXIST', 'refund', 'approved', 'full',
    '2026-07-22T14:00:00Z', 'refund', true, 'refunded', true, 'full_refund_approved', '{}'::jsonb
  );
  if v_result->>'reason' is distinct from 'unknown_transaction' then
    raise exception 'unknown txn must be recorded';
  end if;
  raise notice 'OK unknown transaction';

  -- Out-of-order: older pending after newer approved must not undo refunded
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+ooo@example.invalid', 'txn_ADJ_OOO_01', 'rome-complete', 'rome-complete', 1, 'active', 'pri_adj_4'
  ) returning id into v_purchase_id;

  perform public.apply_paddle_adjustment(
    'adj_OOO_NEW', 'txn_ADJ_OOO_01', 'refund', 'approved', 'full',
    '2026-07-22T16:00:00Z', 'refund', true, 'refunded', false, 'full_refund_approved', '{}'::jsonb
  );
  v_result := public.apply_paddle_adjustment(
    'adj_OOO_OLD', 'txn_ADJ_OOO_01', 'refund', 'pending_approval', 'full',
    '2026-07-22T15:00:00Z', 'record_only', false, null, false, 'pending_keep_access', '{}'::jsonb
  );
  if v_result->>'reason' is distinct from 'out_of_order' then
    raise exception 'older event after newer revoke must be out_of_order, got %', v_result;
  end if;
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'refunded' then
    raise exception 'out-of-order must not restore access';
  end if;
  raise notice 'OK out-of-order';

  -- Reversal: record + operator review, no silent restore
  v_result := public.apply_paddle_adjustment(
    'adj_REV_01', 'txn_ADJ_OOO_01', 'chargeback_reverse', 'approved', 'full',
    '2026-07-22T17:00:00Z', 'record_only', false, null, true, 'reversal_requires_operator', '{}'::jsonb
  );
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'refunded' then
    raise exception 'reversal must not silently restore';
  end if;
  if not (select operator_review from public.purchase_adjustments where adjustment_id = 'adj_REV_01') then
    raise exception 'reversal must flag operator_review';
  end if;
  raise notice 'OK reversal operator review';

  -- Couple cascade: revoke invalidates seats/invites/sessions
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+couple@example.invalid', 'txn_ADJ_COUPLE_01', 'rome-couple', 'rome-complete', 2, 'active', 'pri_adj_c'
  ) returning id into v_purchase_id;
  v_bundle_id := public.ensure_paid_bundle(v_purchase_id);
  insert into public.bundle_invites (bundle_id, invite_hash, seat_id, expires_at)
  select v_bundle_id, 'hash_example_invite_1', id, now() + interval '1 day'
  from public.family_seats where bundle_id = v_bundle_id and role = 'member' limit 1;
  insert into public.walk_sessions (bundle_id, join_code, status, expires_at)
  values (v_bundle_id, 'JOINEX01', 'active', now() + interval '2 hours');

  perform public.apply_paddle_adjustment(
    'adj_COUPLE_01', 'txn_ADJ_COUPLE_01', 'refund', 'approved', 'full',
    '2026-07-22T18:00:00Z', 'refund', true, 'refunded', false, 'full_refund_approved', '{}'::jsonb
  );

  select count(*) into v_seat_revoked
  from public.family_seats where bundle_id = v_bundle_id and status = 'revoked';
  if v_seat_revoked <> 2 then
    raise exception 'couple revoke must revoke both seats, got %', v_seat_revoked;
  end if;
  select count(*) into v_invite_revoked
  from public.bundle_invites where bundle_id = v_bundle_id and revoked_at is not null;
  if v_invite_revoked < 1 then
    raise exception 'couple revoke must revoke invites';
  end if;
  select count(*) into v_sessions_revoked
  from public.walk_sessions where bundle_id = v_bundle_id and status = 'revoked';
  if v_sessions_revoked < 1 then
    raise exception 'couple revoke must revoke walk sessions';
  end if;
  raise notice 'OK couple cascade';

  -- Family cascade + operator restore rotates rather than reviving
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+family@example.invalid', 'txn_ADJ_FAMILY_01', 'rome-family', 'rome-complete', 4, 'active', 'pri_adj_f'
  ) returning id into v_purchase_id;
  v_bundle_id := public.ensure_paid_bundle(v_purchase_id);

  perform public.apply_paddle_adjustment(
    'adj_FAMILY_01', 'txn_ADJ_FAMILY_01', 'chargeback_warning', 'approved', 'full',
    '2026-07-22T19:00:00Z', 'dispute', true, 'disputed', false, 'chargeback_warning', '{}'::jsonb
  );
  select count(*) into v_seat_revoked
  from public.family_seats where bundle_id = v_bundle_id and status = 'revoked';
  if v_seat_revoked <> 4 then
    raise exception 'family revoke must revoke 4 seats, got %', v_seat_revoked;
  end if;

  v_result := public.operator_restore_purchase_access('txn_ADJ_FAMILY_01', 'test_restore');
  if not (v_result->>'ok')::boolean or v_result->>'claim' is null then
    raise exception 'operator restore must mint fresh claim';
  end if;
  v_claim := v_result->>'claim';
  if (select status from public.purchases where id = v_purchase_id) is distinct from 'active' then
    raise exception 'restore must set active';
  end if;
  select count(*) into v_seat_revoked
  from public.family_seats where bundle_id = v_bundle_id and status = 'open';
  if v_seat_revoked <> 4 then
    raise exception 'restore must rotate seats to open, got %', v_seat_revoked;
  end if;
  select count(*) into v_cred_active
  from public.access_credentials where purchase_id = v_purchase_id and status = 'active';
  if v_cred_active <> 0 then
    raise exception 'restore must not revive old credentials';
  end if;
  -- Consumed codes stay dead: redeem once then fail
  if not (public.redeem_purchase_claim(v_claim, 'device-restore-1')->>'ok')::boolean then
    raise exception 'fresh restore claim must redeem once';
  end if;
  if (public.redeem_purchase_claim(v_claim, 'device-restore-2')->>'ok')::boolean then
    raise exception 'consumed restore claim must not issue second credential';
  end if;
  raise notice 'OK family cascade + operator restore rotate';

  raise notice 'OK paddle adjustments verify complete';
end;
$$;

rollback;
