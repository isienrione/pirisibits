-- Rolled-back contract checks for fulfillment email_generation_id.
-- Run after 20260723_fulfillment_email_generation.sql

begin;

do $$
declare
  v_purchase_id uuid;
  v_outbox_id uuid;
  v_gen1 uuid;
  v_gen2 uuid;
  v_gen3 uuid;
  v_gen_after uuid;
  v_resend jsonb;
  v_requeue jsonb;
  v_status text;
  v_cipher text;
  v_sent timestamptz;
  v_delivered timestamptz;
  v_provider text;
  v_attempts int;
  v_provider_status int;
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fulfillment_outbox'
      and column_name = 'email_generation_id'
      and is_nullable = 'NO'
  ) then
    raise exception 'email_generation_id must exist and be NOT NULL';
  end if;
  raise notice 'OK email_generation_id column';

  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+egen@example.invalid',
    'txn_VERIFY_EGEN_01',
    'rome-complete',
    'rome-complete',
    1,
    'active',
    'pri_verify_egen'
  )
  returning id into v_purchase_id;

  insert into public.fulfillment_outbox (
    purchase_id, order_id, status, encrypted_claim, claim_expires_at, next_attempt_at
  ) values (
    v_purchase_id,
    'txn_VERIFY_EGEN_01',
    'pending',
    'cipher_EGEN_1',
    now() + interval '2 days',
    now()
  )
  returning id, email_generation_id into v_outbox_id, v_gen1;

  if v_gen1 is null then
    raise exception 'insert must assign email_generation_id';
  end if;
  raise notice 'OK default email_generation_id on insert';

  update public.fulfillment_outbox
  set
    status = 'sent',
    resend_email_id = 're_EGEN_OLD',
    sent_at = now() - interval '1 hour',
    last_provider_status = 200
  where id = v_outbox_id;

  perform public.apply_resend_email_event(
    'svix_EGEN_DELIVERED_OLD', 'email.delivered', 're_EGEN_OLD', now() - interval '50 minutes'
  );

  select status, encrypted_claim into v_status, v_cipher
  from public.fulfillment_outbox where id = v_outbox_id;
  if v_status is distinct from 'delivered' or v_cipher is not null then
    raise exception 'old delivered should wipe claim; status=% cipher=%', v_status, v_cipher;
  end if;

  update public.fulfillment_outbox
  set
    email_generation_id = gen_random_uuid(),
    status = 'pending',
    attempts = 0,
    encrypted_claim = 'cipher_EGEN_RECOVERY',
    claim_expires_at = now() + interval '7 days',
    sent_at = null,
    delivered_at = null,
    resend_email_id = null,
    last_provider_status = null,
    last_error = 'operator_restore',
    locked_at = null,
    locked_by = null,
    updated_at = now()
  where id = v_outbox_id
  returning email_generation_id into v_gen2;

  if v_gen2 is null or v_gen2 = v_gen1 then
    raise exception 'recovery must rotate email_generation_id';
  end if;
  raise notice 'OK recovery rotates generation';

  v_resend := public.apply_resend_email_event(
    'svix_EGEN_STALE_DELIVERED', 'email.delivered', 're_EGEN_OLD', now()
  );
  if (v_resend->>'matched')::boolean then
    raise exception 'stale provider id must not match after rotation';
  end if;

  select status, encrypted_claim, sent_at, delivered_at, resend_email_id
    into v_status, v_cipher, v_sent, v_delivered, v_provider
  from public.fulfillment_outbox where id = v_outbox_id;

  if v_status is distinct from 'pending'
     or v_cipher is distinct from 'cipher_EGEN_RECOVERY'
     or v_sent is not null
     or v_delivered is not null
     or v_provider is not null then
    raise exception 'stale event mutated recovery generation';
  end if;
  raise notice 'OK stale provider event ignored';

  update public.fulfillment_outbox
  set
    status = 'sent',
    resend_email_id = 're_EGEN_NEW',
    sent_at = now(),
    last_provider_status = 200,
    last_error = null
  where id = v_outbox_id;

  v_resend := public.apply_resend_email_event(
    'svix_EGEN_STALE_BOUNCE', 'email.bounced', 're_EGEN_OLD', now()
  );
  if (v_resend->>'matched')::boolean then
    raise exception 'stale bounce must not match';
  end if;

  select status, encrypted_claim into v_status, v_cipher
  from public.fulfillment_outbox where id = v_outbox_id;
  if v_status is distinct from 'sent' or v_cipher is distinct from 'cipher_EGEN_RECOVERY' then
    raise exception 'stale bounce mutated current generation';
  end if;
  raise notice 'OK stale bounce ignored';

  v_resend := public.apply_resend_email_event(
    'svix_EGEN_DELIVERED_NEW', 'email.delivered', 're_EGEN_NEW', now()
  );
  if not (v_resend->>'matched')::boolean
     or (v_resend->>'applied') is distinct from 'true' then
    raise exception 'current generation delivered should apply';
  end if;
  raise notice 'OK current generation delivered';

  update public.fulfillment_outbox
  set
    status = 'fulfillment_failed',
    encrypted_claim = 'cipher_EGEN_REQUEUE',
    claim_expires_at = now() + interval '7 days',
    last_error = 'http_409',
    sent_at = now() - interval '2 hours',
    delivered_at = now() - interval '90 minutes',
    resend_email_id = 're_EGEN_COLLISION',
    last_provider_status = 409,
    attempts = 1
  where id = v_outbox_id
  returning email_generation_id into v_gen2;

  v_requeue := public.operator_requeue_fulfillment('txn_VERIFY_EGEN_01', true);
  if not (v_requeue->>'ok')::boolean
     or (v_requeue->>'rotated_generation') is distinct from 'true' then
    raise exception 'rotate requeue should succeed: %', v_requeue;
  end if;

  select
    email_generation_id, status, encrypted_claim, sent_at, delivered_at,
    resend_email_id, last_provider_status, attempts
  into
    v_gen3, v_status, v_cipher, v_sent, v_delivered,
    v_provider, v_provider_status, v_attempts
  from public.fulfillment_outbox where id = v_outbox_id;

  if v_gen3 is null or v_gen3 = v_gen2 then
    raise exception 'rotate requeue must change email_generation_id';
  end if;
  if v_status is distinct from 'pending'
     or v_cipher is distinct from 'cipher_EGEN_REQUEUE'
     or v_sent is not null
     or v_delivered is not null
     or v_provider is not null
     or v_provider_status is not null
     or v_attempts <> 0 then
    raise exception 'rotate requeue must clear lifecycle and keep ciphertext';
  end if;
  raise notice 'OK operator_requeue rotate preserves ciphertext';

  update public.fulfillment_outbox
  set status = 'failed', last_error = 'http_500', attempts = 2
  where id = v_outbox_id
  returning email_generation_id into v_gen3;

  v_requeue := public.operator_requeue_fulfillment('txn_VERIFY_EGEN_01', false);
  if not (v_requeue->>'ok')::boolean
     or coalesce((v_requeue->>'rotated_generation')::boolean, false) then
    raise exception 'plain requeue should keep generation';
  end if;

  select email_generation_id into v_gen_after
  from public.fulfillment_outbox where id = v_outbox_id;
  if v_gen_after is distinct from v_gen3 then
    raise exception 'plain requeue must not rotate generation';
  end if;
  raise notice 'OK plain requeue preserves generation';

  raise notice 'OK fulfillment email generation verify complete';
end;
$$;

rollback;
