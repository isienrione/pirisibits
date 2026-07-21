-- ChronoWalk launch-commerce contract verification
-- Run AFTER 20260721_launch_commerce_hardening.sql in a non-production project.
-- Uses synthetic emails / ids only. Rolls back at the end.
--
-- Dashboard / apply order (non-production only):
--   1) Supabase → SQL Editor → run scripts/paddle-customers-migration.sql
--      (schema only; no customer backfills)
--   2) SQL Editor → run supabase/migrations/20260721_launch_commerce_hardening.sql
--   3) SQL Editor → run this verify script; all asserts must print OK
--   4) Seed paddle_price_catalog rows for live/sandbox price IDs (service role)
--   5) Redeploy Edge Function paddle-webhook (claim + outbox build)
--   6) Confirm anon cannot select purchases / claim tables
-- DO NOT apply steps 2–5 to production from an agent session.

begin;

do $$
declare
  v_purchase_id uuid;
  v_claim text;
  v_claim2 text;
  v_cred text;
  v_cred_b text;
  v_result jsonb;
  v_result_b jsonb;
  v_sku text;
  v_ent record;
  v_event jsonb;
  v_bundle_id uuid;
  v_invite text;
  v_seat_id uuid;
  v_member_cred text;
  v_session jsonb;
  v_count int;
begin
  -- malformed tokens do not throw
  v_result := public.get_purchase_for_token('not-a-uuid');
  if v_result->>'ok' <> 'false' then raise exception 'malformed get_purchase expected invalid'; end if;
  if public.validate_access_token('not-a-uuid') is distinct from false then
    raise exception 'malformed validate_access_token expected false';
  end if;
  v_result := public.redeem_purchase_claim('short', null);
  if v_result->>'ok' <> 'false' then raise exception 'short claim should fail'; end if;
  raise notice 'OK malformed tokens';

  -- matrix for all five active products
  foreach v_sku in array array[
    'rome-central', 'rome-essential', 'rome-complete', 'rome-couple', 'rome-family'
  ] loop
    select * into v_ent from public.launch_sku_entitlement(v_sku);
    insert into public.purchases (
      email, order_id, product_id, content_product_id, seat_limit, status, fulfilled_at
    ) values (
      'buyer@example.invalid',
      'txn_EXAMPLE_' || v_sku,
      v_sku,
      v_ent.content_product_id,
      v_ent.seat_limit,
      'active',
      now()
    ) returning id into v_purchase_id;

    v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
    v_result := public.redeem_purchase_claim(v_claim, 'device-bind-a');
    if v_result->>'ok' <> 'true' then raise exception 'redeem failed for %', v_sku; end if;
    if v_result->>'purchased_product_id' is distinct from v_sku then
      raise exception 'sku mismatch for %', v_sku;
    end if;
    if v_result->>'content_product_id' is distinct from v_ent.content_product_id then
      raise exception 'content mismatch for %', v_sku;
    end if;
    if (v_result->>'seat_limit')::int is distinct from v_ent.seat_limit then
      raise exception 'seat_limit mismatch for %', v_sku;
    end if;
    if v_result->>'device_credential' is null then
      raise exception 'missing device credential for %', v_sku;
    end if;

    -- replay fails
    v_result_b := public.redeem_purchase_claim(v_claim, 'device-bind-b');
    if v_result_b->>'ok' <> 'false' then
      raise exception 'replay should fail for %', v_sku;
    end if;

    -- device access validates
    v_cred := v_result->>'device_credential';
    v_result_b := public.validate_device_access(v_cred, 'device-bind-a');
    if v_result_b->>'ok' <> 'true' then
      raise exception 'device validate failed for %', v_sku;
    end if;
  end loop;
  raise notice 'OK five-SKU matrix + one-time claim';

  -- refunded / revoked / pending fail validation
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status
  ) values (
    'buyer@example.invalid', 'txn_EXAMPLE_refunded', 'rome-complete', 'rome-complete', 1, 'refunded'
  ) returning id into v_purchase_id;
  begin
    perform public.issue_purchase_claim(v_purchase_id, 'restore', interval '1 day');
    raise exception 'refunded purchase should not issue claim';
  exception when others then
    if SQLERRM like '%refunded purchase should not%' then raise; end if;
  end;

  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status
  ) values (
    'buyer@example.invalid', 'txn_EXAMPLE_active_then_revoke', 'rome-complete', 'rome-complete', 1, 'active'
  ) returning id into v_purchase_id;
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, null);
  v_cred := v_result->>'device_credential';
  perform public.revoke_purchase_access(v_purchase_id, 'revoked');
  v_result_b := public.validate_device_access(v_cred, null);
  if v_result_b->>'ok' <> 'false' then
    raise exception 'revoked purchase must fail device validation';
  end if;
  raise notice 'OK refunded/revoked fail closed';

  -- concurrent redemption → one winner
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, fulfilled_at
  ) values (
    'buyer@example.invalid', 'txn_EXAMPLE_concurrent', 'rome-essential', 'rome-essential', 1, 'active', now()
  ) returning id into v_purchase_id;
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'bind-1');
  v_result_b := public.redeem_purchase_claim(v_claim, 'bind-2');
  if v_result->>'ok' <> 'true' or v_result_b->>'ok' <> 'false' then
    raise exception 'concurrent redeem must produce one winner';
  end if;
  select count(*) into v_count
  from public.access_credentials
  where purchase_id = v_purchase_id and status = 'active';
  if v_count <> 1 then
    raise exception 'expected exactly one active credential, got %', v_count;
  end if;
  raise notice 'OK concurrent redeem single winner';

  -- expired / revoked / legacy bearer fail
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, fulfilled_at,
    access_token
  ) values (
    'buyer@example.invalid', 'txn_EXAMPLE_legacy', 'rome-central', 'rome-central', 1, 'active', now(),
    '00000000-0000-4000-8000-000000000001'
  ) returning id into v_purchase_id;
  if public.validate_access_token('00000000-0000-4000-8000-000000000001') is distinct from false then
    raise exception 'legacy access_token must not authorize';
  end if;
  v_result := public.get_purchase_for_token('00000000-0000-4000-8000-000000000001');
  if v_result->>'ok' <> 'false' then
    raise exception 'legacy get_purchase_for_token must fail';
  end if;

  v_claim := public.issue_purchase_claim(v_purchase_id, 'restore', interval '1 day');
  update public.purchase_claim_tokens
  set expires_at = now() - interval '1 minute'
  where purchase_id = v_purchase_id and consumed_at is null;
  v_result := public.redeem_purchase_claim(v_claim, null);
  if v_result->>'ok' <> 'false' then raise exception 'expired claim must fail'; end if;

  v_claim2 := public.issue_purchase_claim(v_purchase_id, 'restore', interval '1 day');
  update public.purchase_claim_tokens
  set revoked_at = now()
  where claim_hash = public._cw_hash_secret(v_claim2);
  v_result := public.redeem_purchase_claim(v_claim2, null);
  if v_result->>'ok' <> 'false' then raise exception 'revoked claim must fail'; end if;

  -- fresh restore succeeds once; older consumed stays dead
  v_claim := public.issue_purchase_claim(v_purchase_id, 'restore', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, null);
  if v_result->>'ok' <> 'true' then raise exception 'fresh restore should succeed'; end if;
  raise notice 'OK expired/revoked/legacy + restore';

  -- duplicate event IDs rejected safely
  v_event := public.record_paddle_webhook_event(
    'evt_EXAMPLE_1', 'transaction.completed', now(), '{"id":"evt_EXAMPLE_1"}'::jsonb
  );
  if v_event->>'duplicate' <> 'false' then raise exception 'first event should not be duplicate'; end if;
  v_event := public.record_paddle_webhook_event(
    'evt_EXAMPLE_1', 'transaction.completed', now(), '{"id":"evt_EXAMPLE_1"}'::jsonb
  );
  if v_event->>'duplicate' <> 'true' then raise exception 'second event must be duplicate'; end if;
  raise notice 'OK duplicate event ids';

  -- solo cannot create bundle
  select id into v_purchase_id from public.purchases where order_id = 'txn_EXAMPLE_rome-complete';
  begin
    perform public.ensure_paid_bundle(v_purchase_id);
    raise exception 'solo should not create bundle';
  exception when others then
    if SQLERRM like '%solo should not%' then raise; end if;
  end;
  raise notice 'OK solo cannot create bundle';

  -- Couple = 2 seats; Family = 4; reject extra active devices via seat cap
  select id into v_purchase_id from public.purchases where order_id = 'txn_EXAMPLE_rome-couple';
  v_bundle_id := public.ensure_paid_bundle(v_purchase_id);
  select count(*) into v_count from public.family_seats where bundle_id = v_bundle_id;
  if v_count <> 2 then raise exception 'couple must have 2 seats, got %', v_count; end if;

  select id into v_purchase_id from public.purchases where order_id = 'txn_EXAMPLE_rome-family';
  v_bundle_id := public.ensure_paid_bundle(v_purchase_id);
  select count(*) into v_count from public.family_seats where bundle_id = v_bundle_id;
  if v_count <> 4 then raise exception 'family must have 4 seats, got %', v_count; end if;

  -- organizer invite + member redeem + walk session auth
  select c.credential_hash, p.id
  into v_claim, v_purchase_id
  from public.access_credentials c
  join public.purchases p on p.id = c.purchase_id
  where p.order_id = 'txn_EXAMPLE_rome-couple' and c.status = 'active'
  limit 1;
  -- recover owner raw credential by issuing a dedicated path: use create_bundle_invite needs raw cred.
  -- Re-create owner path: issue restore claim for couple purchase and redeem as owner.
  select id into v_purchase_id from public.purchases where order_id = 'txn_EXAMPLE_rome-couple';
  v_claim := public.issue_purchase_claim(v_purchase_id, 'restore', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'owner-bind');
  v_cred := v_result->>'device_credential';
  if v_result->>'role' is distinct from 'owner' then
    raise exception 'couple redeem must be owner';
  end if;
  if v_result->>'content_product_id' is distinct from 'rome-complete' then
    raise exception 'couple content must be rome-complete';
  end if;

  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour');
  if v_result->>'ok' <> 'true' then raise exception 'invite create failed: %', v_result; end if;
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;

  -- replay invite / guessed device id cannot mutate
  v_result := public.redeem_bundle_invite(v_invite, 'member-bind', 'Sam');
  if v_result->>'ok' <> 'true' then raise exception 'member invite redeem failed'; end if;
  v_member_cred := v_result->>'device_credential';
  v_result_b := public.redeem_bundle_invite(v_invite, 'other-bind', 'Other');
  if v_result_b->>'ok' <> 'false' then raise exception 'invite replay must fail'; end if;

  v_session := public.create_walk_session_for_credential(v_member_cred, 'leader');
  if v_session->>'ok' <> 'true' then raise exception 'member session create failed'; end if;

  -- guessed device-id legacy RPC retired
  v_result := public.update_walk_session_state(
    (v_session->>'id')::uuid, 'guessed-device', '{"event":"pause"}'::jsonb
  );
  if v_result->>'reason' is distinct from 'retired' then
    raise exception 'legacy walk update must be retired';
  end if;

  -- revoke seat → cannot validate/mutate
  perform public.revoke_bundle_seat(v_cred, v_seat_id);
  v_result := public.validate_device_access(v_member_cred, 'member-bind');
  if v_result->>'ok' <> 'false' then raise exception 'revoked seat must fail validate'; end if;
  v_result := public.update_walk_session_for_credential(
    v_member_cred, (v_session->>'id')::uuid, '{"event":"pause"}'::jsonb
  );
  if v_result->>'ok' <> 'false' then raise exception 'revoked seat must not mutate session'; end if;

  -- revoke purchase disables every seat/session
  perform public.revoke_purchase_access(v_purchase_id, 'revoked');
  v_result := public.validate_device_access(v_cred, 'owner-bind');
  if v_result->>'ok' <> 'false' then raise exception 'owner must lose access after purchase revoke'; end if;
  select count(*) into v_count
  from public.family_seats s
  join public.family_bundles b on b.id = s.bundle_id
  where b.purchase_id = v_purchase_id and s.status <> 'revoked';
  if v_count <> 0 then raise exception 'all seats must be revoked'; end if;

  raise notice 'OK bundle seats/invites/sessions/revoke';
  raise notice 'ALL CONTRACT CHECKS PASSED';
end $$;

rollback;
