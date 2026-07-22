-- Rolled-back contract checks for durable fulfillment outbox.
-- Run after 20260722_fulfillment_outbox_worker.sql

begin;

do $$
declare
  v_purchase_id uuid;
  v_claim1 text;
  v_claim2 jsonb;
  v_redeem1 jsonb;
  v_redeem2 jsonb;
  v_outbox_a uuid;
  v_outbox_b uuid;
  v_claimed public.fulfillment_outbox;
  v_claimed_ids uuid[] := '{}';
  v_resend jsonb;
  v_resend2 jsonb;
  v_active_claims int;
begin
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+outbox@example.invalid',
    'txn_VERIFY_OUTBOX_01',
    'rome-couple',
    'rome-complete',
    2,
    'active',
    'pri_verify_couple'
  )
  returning id into v_purchase_id;

  -- First ensure mints exactly one claim
  v_claim2 := public.ensure_initial_purchase_claim(v_purchase_id);
  if not (v_claim2->>'ok')::boolean or not (v_claim2->>'issued')::boolean then
    raise exception 'expected first ensure to mint claim';
  end if;
  v_claim1 := v_claim2->>'claim';

  -- Second ensure must NOT mint another usable claim
  v_claim2 := public.ensure_initial_purchase_claim(v_purchase_id);
  if (v_claim2->>'issued')::boolean then
    raise exception 'outbox retry must not mint a second active claim';
  end if;
  if v_claim2->>'reason' is distinct from 'active_claim_exists' then
    raise exception 'unexpected ensure reason %', v_claim2->>'reason';
  end if;

  select count(*) into v_active_claims
  from public.purchase_claim_tokens
  where purchase_id = v_purchase_id
    and purpose = 'initial'
    and consumed_at is null
    and revoked_at is null;
  if v_active_claims <> 1 then
    raise exception 'expected exactly one active initial claim, got %', v_active_claims;
  end if;
  raise notice 'OK ensure_initial_purchase_claim single-active';

  insert into public.fulfillment_outbox (
    purchase_id, order_id, status, encrypted_claim, claim_expires_at, next_attempt_at
  ) values (
    v_purchase_id,
    'txn_VERIFY_OUTBOX_01',
    'pending',
    'cipher_EXAMPLE',
    now() + interval '2 days',
    now() - interval '1 minute'
  )
  returning id into v_outbox_a;

  -- Second due row for concurrent claim test
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+outbox2@example.invalid',
    'txn_VERIFY_OUTBOX_02',
    'rome-central',
    'rome-central',
    1,
    'active',
    'pri_verify_central'
  ) returning id into v_purchase_id;

  perform public.ensure_initial_purchase_claim(v_purchase_id);

  insert into public.fulfillment_outbox (
    purchase_id, order_id, status, encrypted_claim, claim_expires_at, next_attempt_at
  ) values (
    v_purchase_id,
    'txn_VERIFY_OUTBOX_02',
    'pending',
    'cipher_EXAMPLE_2',
    now() + interval '2 days',
    now() - interval '1 minute'
  )
  returning id into v_outbox_b;

  -- Worker A claims one; Worker B claims the other — no duplicates
  select * into v_claimed
  from public.claim_due_fulfillment_outbox(1, 'worker-a')
  limit 1;
  if v_claimed.id is null then
    raise exception 'worker-a claimed nothing';
  end if;
  v_claimed_ids := array_append(v_claimed_ids, v_claimed.id);

  select * into v_claimed
  from public.claim_due_fulfillment_outbox(1, 'worker-b')
  limit 1;
  if v_claimed.id is null then
    raise exception 'worker-b claimed nothing';
  end if;
  if v_claimed.id = any (v_claimed_ids) then
    raise exception 'workers claimed the same outbox row';
  end if;
  v_claimed_ids := array_append(v_claimed_ids, v_claimed.id);

  if exists (
    select 1 from public.fulfillment_outbox
    where status = 'pending' and order_id like 'txn_VERIFY_OUTBOX_%'
  ) then
    raise exception 'due rows should be claimed';
  end if;
  raise notice 'OK concurrent claim_due_fulfillment_outbox';

  -- Mark sent + apply delivered (wipes ciphertext)
  perform public.mark_fulfillment_outbox_sent(v_outbox_a, 're_VERIFY_1', 200);
  v_resend := public.apply_resend_email_event(
    'svix_VERIFY_1', 'email.delivered', 're_VERIFY_1', now()
  );
  if not (v_resend->>'ok')::boolean or not (v_resend->>'matched')::boolean then
    raise exception 'delivered event should match outbox';
  end if;
  v_resend2 := public.apply_resend_email_event(
    'svix_VERIFY_1', 'email.delivered', 're_VERIFY_1', now()
  );
  if not (v_resend2->>'duplicate')::boolean then
    raise exception 'svix id must dedupe';
  end if;
  if exists (
    select 1 from public.fulfillment_outbox
    where id = v_outbox_a and encrypted_claim is not null
  ) then
    raise exception 'delivered must wipe encrypted_claim';
  end if;
  raise notice 'OK resend delivered + svix dedupe';

  -- Missing outbox for unknown email id
  v_resend := public.apply_resend_email_event(
    'svix_VERIFY_MISSING', 'email.bounced', 're_UNKNOWN', now()
  );
  if (v_resend->>'matched')::boolean then
    raise exception 'missing outbox should not match';
  end if;
  raise notice 'OK missing outbox resend event';

  -- First redeem succeeds; second redeem of same claim fails
  -- Reset purchase id to couple purchase with known claim
  select purchase_id into v_purchase_id
  from public.fulfillment_outbox where id = v_outbox_a;

  -- Re-issue is blocked; use the original raw claim from first ensure — stored in v_claim1
  -- But couple purchase's claim was minted before outbox insert; reclaim from tokens impossible.
  -- Mint a fresh purchase for redeem proof:
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+redeem@example.invalid',
    'txn_VERIFY_REDEEM_01',
    'rome-complete',
    'rome-complete',
    1,
    'active',
    'pri_verify_complete'
  ) returning id into v_purchase_id;

  v_claim2 := public.ensure_initial_purchase_claim(v_purchase_id);
  v_claim1 := v_claim2->>'claim';
  v_redeem1 := public.redeem_purchase_claim(v_claim1, 'device-binding-verify-1');
  if not (v_redeem1->>'ok')::boolean then
    raise exception 'first redeem should succeed';
  end if;
  if v_redeem1->>'device_credential' is null then
    raise exception 'first redeem must return device credential once';
  end if;
  v_redeem2 := public.redeem_purchase_claim(v_claim1, 'device-binding-verify-2');
  if (v_redeem2->>'ok')::boolean then
    raise exception 'same emailed code cannot issue a second credential';
  end if;
  raise notice 'OK claim redeem once';

  -- Operator requeue refuses delivered without ciphertext
  v_resend := public.operator_requeue_fulfillment('txn_VERIFY_OUTBOX_01');
  if (v_resend->>'ok')::boolean then
    raise exception 'delivered order should not requeue without ciphertext';
  end if;
  raise notice 'OK operator requeue guards';

  raise notice 'OK fulfillment outbox worker verify complete';
end;
$$;

rollback;
