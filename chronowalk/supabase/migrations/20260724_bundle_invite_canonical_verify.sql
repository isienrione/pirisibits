-- Rolled-back contract checks for canonical bundle-invite normalization.
-- Run after 20260724_bundle_invite_canonical.sql

begin;

do $$
declare
  v_purchase_id uuid;
  v_bundle_id uuid;
  v_claim text;
  v_cred text;
  v_invite text;
  v_invite_upper text;
  v_invite_mixed text;
  v_seat_id uuid;
  v_result jsonb;
  v_result_b jsonb;
  v_norm_a text;
  v_norm_b text;
  v_norm_c text;
  v_bucket_a text;
  v_bucket_b text;
  v_bucket_c text;
  v_hits int;
  v_member_cred text;
begin
  if to_regprocedure('public._cw_normalize_bundle_invite(text)') is null then
    raise exception '_cw_normalize_bundle_invite missing';
  end if;

  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+invite-canon@example.invalid',
    'txn_VERIFY_INVITE_CANON_01',
    'rome-family',
    'rome-complete',
    4,
    'active',
    'pri_verify_invite_canon'
  )
  returning id into v_purchase_id;

  v_bundle_id := public.ensure_paid_bundle(v_purchase_id);
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'owner-bind-canon');
  v_cred := v_result->>'device_credential';
  if v_result->>'role' is distinct from 'owner' then
    raise exception 'expected owner role';
  end if;

  -- Canonical form: trim + lowercase
  v_norm_a := public._cw_normalize_bundle_invite('  AbCdEf0123456789abcdef0123456789  ');
  v_norm_b := public._cw_normalize_bundle_invite('ABCDEF0123456789ABCDEF0123456789');
  v_norm_c := public._cw_normalize_bundle_invite('abcdef0123456789abcdef0123456789');
  if v_norm_a is distinct from v_norm_c
     or v_norm_b is distinct from v_norm_c
     or v_norm_c is distinct from 'abcdef0123456789abcdef0123456789' then
    raise exception 'normalize must trim + lowercase; got %, %, %', v_norm_a, v_norm_b, v_norm_c;
  end if;
  raise notice 'OK _cw_normalize_bundle_invite';

  -- Rate-limit buckets must match across case / whitespace variants
  v_bucket_a := 'invite:' || left(
    encode(extensions.digest(convert_to(v_norm_a, 'utf8'), 'sha256'), 'hex'), 16
  );
  v_bucket_b := 'invite:' || left(
    encode(extensions.digest(convert_to(v_norm_b, 'utf8'), 'sha256'), 'hex'), 16
  );
  v_bucket_c := 'invite:' || left(
    encode(extensions.digest(convert_to(v_norm_c, 'utf8'), 'sha256'), 'hex'), 16
  );
  if v_bucket_a is distinct from v_bucket_b or v_bucket_a is distinct from v_bucket_c then
    raise exception 'case variants must share rate-limit bucket';
  end if;

  -- Hit rate limit via invalid invite case variants (same canonical bucket)
  perform public.redeem_bundle_invite(
    'DEADBEEFDEADBEEFDEADBEEFDEADBEEF', 'rl-bind-1', 'RL'
  );
  perform public.redeem_bundle_invite(
    'deadbeefdeadbeefdeadbeefdeadbeef', 'rl-bind-2', 'RL'
  );
  perform public.redeem_bundle_invite(
    '  DeAdBeEfDeAdBeEfDeAdBeEfDeAdBeEf  ', 'rl-bind-3', 'RL'
  );
  select hits into v_hits
  from public._rpc_rate_limits
  where bucket = 'invite:' || left(
    encode(
      extensions.digest(
        convert_to(public._cw_normalize_bundle_invite('DEADBEEFDEADBEEFDEADBEEFDEADBEEF'), 'utf8'),
        'sha256'
      ),
      'hex'
    ),
    16
  );
  if v_hits is null or v_hits < 3 then
    raise exception 'case variants must accumulate on one rate-limit bucket, hits=%', v_hits;
  end if;
  raise notice 'OK shared rate-limit bucket across case variants';

  -- Mint lowercase hex invite (matches production _cw_new_secret)
  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-canon');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'invite create failed: %', v_result;
  end if;
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;
  if v_invite is distinct from lower(v_invite) then
    raise exception 'generated invite must be lowercase hex';
  end if;

  -- Uppercase representation of the same invite must redeem
  v_invite_upper := upper(v_invite);
  v_result := public.redeem_bundle_invite(v_invite_upper, 'member-bind-upper', 'Upper');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'uppercase invite redeem failed: %', v_result;
  end if;
  v_member_cred := v_result->>'device_credential';
  if v_member_cred is null then
    raise exception 'uppercase redeem must return device credential once';
  end if;

  -- Replay (any case) must fail
  v_result_b := public.redeem_bundle_invite(v_invite, 'member-bind-replay', 'Replay');
  if v_result_b->>'ok' is distinct from 'false' then
    raise exception 'invite replay must fail';
  end if;
  v_result_b := public.redeem_bundle_invite(v_invite_upper, 'member-bind-replay2', 'Replay');
  if v_result_b->>'ok' is distinct from 'false' then
    raise exception 'uppercase replay must fail';
  end if;
  raise notice 'OK uppercase redeem + replay fail';

  -- Second seat: mixed-case + surrounding whitespace
  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-canon');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'second invite create failed: %', v_result;
  end if;
  v_invite := v_result->>'invite';
  v_invite_mixed := '  ' || upper(substr(v_invite, 1, 8)) || lower(substr(v_invite, 9)) || '  ';
  v_result := public.redeem_bundle_invite(v_invite_mixed, 'member-bind-mixed', 'Mixed');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'mixed-case+whitespace redeem failed: %', v_result;
  end if;
  raise notice 'OK mixed-case + whitespace redeem';

  -- Third seat: lowercase redeem (baseline)
  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-canon');
  v_invite := v_result->>'invite';
  v_result := public.redeem_bundle_invite(v_invite, 'member-bind-lower', 'Lower');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'lowercase invite redeem failed: %', v_result;
  end if;
  raise notice 'OK lowercase redeem';

  -- Concurrent-style one winner: second consume of same invite fails
  -- (FOR UPDATE + conditional consumed_at update). Fresh invite then double redeem.
  -- Family has 4 seats; owner claimed 1, members claimed 3 above → no open seat.
  -- Use a couple purchase for remaining concurrency / expiry / revoke checks.
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+invite-canon2@example.invalid',
    'txn_VERIFY_INVITE_CANON_02',
    'rome-couple',
    'rome-complete',
    2,
    'active',
    'pri_verify_invite_canon2'
  )
  returning id into v_purchase_id;

  perform public.ensure_paid_bundle(v_purchase_id);
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'owner-bind-couple');
  v_cred := v_result->>'device_credential';

  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-couple');
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;

  v_result := public.redeem_bundle_invite(upper(v_invite), 'winner-bind', 'Winner');
  v_result_b := public.redeem_bundle_invite(lower(v_invite), 'loser-bind', 'Loser');
  if v_result->>'ok' is distinct from 'true' then
    raise exception 'concurrent winner must succeed';
  end if;
  if v_result_b->>'ok' is distinct from 'false' then
    raise exception 'concurrent loser must fail';
  end if;
  raise notice 'OK one-winner consume guard';

  -- Expired invite fails (any case)
  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-couple');
  -- create revokes prior seat invites and resets seat — need open seat again after claim.
  -- Previous redeem claimed the only member seat; create_bundle_invite resets it.
  v_invite := v_result->>'invite';
  update public.bundle_invites
  set expires_at = now() - interval '1 minute'
  where invite_hash = public._cw_hash_secret(public._cw_normalize_bundle_invite(v_invite));
  v_result := public.redeem_bundle_invite(upper(v_invite), 'expired-bind', 'Expired');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'expired invite must fail';
  end if;
  raise notice 'OK expired invite fails';

  -- Revoked invite fails (any case)
  v_result := public.create_bundle_invite(v_cred, null, interval '1 hour', 'owner-bind-couple');
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;
  perform public.revoke_bundle_seat(v_cred, v_seat_id, 'owner-bind-couple');
  v_result := public.redeem_bundle_invite(upper(v_invite), 'revoked-bind', 'Revoked');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'revoked invite must fail';
  end if;
  raise notice 'OK revoked invite fails';

  raise notice 'OK bundle invite canonical verify complete';
end;
$$;

rollback;
