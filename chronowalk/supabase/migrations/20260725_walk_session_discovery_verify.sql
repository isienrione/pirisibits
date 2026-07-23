-- Rolled-back contract checks for active walk-session discovery.
-- Run after 20260725_walk_session_discovery.sql

begin;

do $$
declare
  v_purchase_id uuid;
  v_claim text;
  v_owner text;
  v_member text;
  v_invite text;
  v_seat_id uuid;
  v_result jsonb;
  v_session jsonb;
  v_session_b jsonb;
  v_updated_at timestamptz;
  v_id uuid;
begin
  if to_regprocedure('public.get_active_walk_session_for_credential(text, text)') is null then
    raise exception 'get_active_walk_session_for_credential missing';
  end if;

  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+walk-discover@example.invalid',
    'txn_VERIFY_WALK_DISCOVER_01',
    'rome-couple',
    'rome-complete',
    2,
    'active',
    'pri_verify_walk_discover'
  )
  returning id into v_purchase_id;

  perform public.ensure_paid_bundle(v_purchase_id);
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'owner-bind-discover');
  v_owner := v_result->>'device_credential';

  v_result := public.create_bundle_invite(v_owner, null, interval '1 hour', 'owner-bind-discover');
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;
  v_result := public.redeem_bundle_invite(v_invite, 'member-bind-discover', 'Sam');
  v_member := v_result->>'device_credential';

  -- Solo / invalid fail closed
  v_result := public.get_active_walk_session_for_credential('not-a-real-credential', 'x');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'invalid credential must fail closed';
  end if;

  -- Member with no session yet
  v_result := public.get_active_walk_session_for_credential(v_member, 'member-bind-discover');
  if v_result->>'reason' is distinct from 'no_active_session' then
    raise exception 'member should see no_active_session before create: %', v_result;
  end if;

  -- Member cannot create (organizer-only)
  v_result := public.create_walk_session_for_credential(v_member, 'leader', 'member-bind-discover');
  if v_result->>'reason' is distinct from 'not_owner' then
    raise exception 'member must not create shared session: %', v_result;
  end if;

  -- Organizer creates; member discovers without knowing session id
  v_session := public.create_walk_session_for_credential(v_owner, 'leader', 'owner-bind-discover');
  if v_session->>'ok' is distinct from 'true' or v_session->>'id' is null then
    raise exception 'owner create failed: %', v_session;
  end if;
  if v_session->>'mySeatId' is null or v_session->>'leaderSeatId' is distinct from v_session->>'mySeatId' then
    raise exception 'owner payload must identify leader seat';
  end if;
  v_id := (v_session->>'id')::uuid;

  v_session_b := public.get_active_walk_session_for_credential(v_member, 'member-bind-discover');
  if v_session_b->>'ok' is distinct from 'true'
     or (v_session_b->>'id')::uuid is distinct from v_id then
    raise exception 'member must discover organizer session: %', v_session_b;
  end if;
  if v_session_b->>'mySeatId' is null
     or v_session_b->>'mySeatId' is not distinct from v_session_b->>'leaderSeatId' then
    raise exception 'member must not appear as leader';
  end if;
  raise notice 'OK member discovers active session';

  -- Wrong binding fails closed
  v_result := public.get_active_walk_session_for_credential(v_member, 'wrong-bind');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'wrong binding must fail';
  end if;

  -- Organizer pause → member poll sees paused
  v_session := public.update_walk_session_for_credential(
    v_owner, v_id,
    jsonb_build_object(
      'event', 'pause',
      'positionSeconds', 12,
      'expectedUpdatedAt', v_session->>'updatedAt'
    ),
    'owner-bind-discover'
  );
  if v_session->>'paused' is distinct from 'true' then
    raise exception 'pause failed: %', v_session;
  end if;
  v_session_b := public.get_active_walk_session_for_credential(v_member, 'member-bind-discover');
  if v_session_b->>'paused' is distinct from 'true'
     or v_session_b->>'playing' is distinct from 'false' then
    raise exception 'member must observe pause: %', v_session_b;
  end if;
  raise notice 'OK pause propagates';

  -- Organizer resume → member observes playing
  v_session := public.update_walk_session_for_credential(
    v_owner, v_id,
    jsonb_build_object(
      'event', 'resume',
      'positionSeconds', 12,
      'expectedUpdatedAt', v_session->>'updatedAt'
    ),
    'owner-bind-discover'
  );
  v_session_b := public.get_walk_session_for_credential(v_member, v_id, 'member-bind-discover');
  if v_session_b->>'playing' is distinct from 'true'
     or v_session_b->>'paused' is distinct from 'false' then
    raise exception 'member must observe resume: %', v_session_b;
  end if;
  raise notice 'OK resume propagates';

  -- Organizer advances stop via clock
  v_updated_at := (v_session->>'updatedAt')::timestamptz;
  v_session := public.update_walk_session_for_credential(
    v_owner, v_id,
    jsonb_build_object(
      'event', 'clock',
      'waypointId', 'stop-forum',
      'chapterIndex', 2,
      'positionSeconds', 30,
      'playing', true,
      'paused', false,
      'expectedUpdatedAt', v_session->>'updatedAt'
    ),
    'owner-bind-discover'
  );
  if v_session->>'waypointId' is distinct from 'stop-forum'
     or (v_session->>'chapterIndex')::int is distinct from 2 then
    raise exception 'clock advance failed: %', v_session;
  end if;
  v_session_b := public.get_active_walk_session_for_credential(v_member, 'member-bind-discover');
  if v_session_b->>'waypointId' is distinct from 'stop-forum' then
    raise exception 'member must observe newer stop: %', v_session_b;
  end if;
  raise notice 'OK stop advance propagates';

  -- Stale update rejected; newer state preserved
  v_result := public.update_walk_session_for_credential(
    v_owner, v_id,
    jsonb_build_object(
      'event', 'pause',
      'positionSeconds', 1,
      'expectedUpdatedAt', v_updated_at::text
    ),
    'owner-bind-discover'
  );
  if v_result->>'reason' is distinct from 'stale_update' then
    raise exception 'stale update must be rejected: %', v_result;
  end if;
  if v_result->>'waypointId' is distinct from 'stop-forum' then
    raise exception 'stale reject must return current session state';
  end if;
  raise notice 'OK stale update rejected';

  -- Cross-bundle isolation
  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+walk-discover2@example.invalid',
    'txn_VERIFY_WALK_DISCOVER_02',
    'rome-family',
    'rome-complete',
    4,
    'active',
    'pri_verify_walk_discover2'
  )
  returning id into v_purchase_id;
  perform public.ensure_paid_bundle(v_purchase_id);
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'other-owner-bind');
  v_result := public.get_walk_session_for_credential(
    v_result->>'device_credential', v_id, 'other-owner-bind'
  );
  if v_result->>'reason' is distinct from 'session_not_found'
     and v_result->>'ok' is distinct from 'false' then
    raise exception 'other bundle must not read session: %', v_result;
  end if;
  raise notice 'OK cross-bundle isolation';

  -- Revoked seat fails closed
  perform public.revoke_bundle_seat(v_owner, v_seat_id, 'owner-bind-discover');
  v_result := public.get_active_walk_session_for_credential(v_member, 'member-bind-discover');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'revoked member must fail closed: %', v_result;
  end if;
  raise notice 'OK revoked seat fails closed';

  raise notice 'OK walk session discovery verify complete';
end;
$$;

rollback;
