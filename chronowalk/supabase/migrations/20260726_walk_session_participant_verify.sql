-- Rolled-back contract checks for participant detach/rejoin.
-- Run after 20260726_walk_session_participant.sql

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
  v_id uuid;
  v_part text;
begin
  if to_regclass('public.walk_session_participants') is null then
    raise exception 'walk_session_participants missing';
  end if;
  if to_regprocedure('public.detach_walk_session_for_credential(text, text)') is null then
    raise exception 'detach_walk_session_for_credential missing';
  end if;
  if to_regprocedure('public.rejoin_walk_session_for_credential(text, text)') is null then
    raise exception 'rejoin_walk_session_for_credential missing';
  end if;

  insert into public.purchases (
    email, order_id, product_id, content_product_id, seat_limit, status, price_id
  ) values (
    'buyer+walk-detach@example.invalid',
    'txn_VERIFY_WALK_DETACH_01',
    'rome-couple',
    'rome-complete',
    2,
    'active',
    'pri_verify_walk_detach'
  )
  returning id into v_purchase_id;

  perform public.ensure_paid_bundle(v_purchase_id);
  v_claim := public.issue_purchase_claim(v_purchase_id, 'initial', interval '1 day');
  v_result := public.redeem_purchase_claim(v_claim, 'owner-bind-detach');
  v_owner := v_result->>'device_credential';

  v_result := public.create_bundle_invite(v_owner, null, interval '1 hour', 'owner-bind-detach');
  v_invite := v_result->>'invite';
  v_seat_id := (v_result->>'seat_id')::uuid;
  v_result := public.redeem_bundle_invite(v_invite, 'member-bind-detach', 'Sam');
  v_member := v_result->>'device_credential';

  -- Fail closed: invalid / wrong binding / solo
  v_result := public.detach_walk_session_for_credential('not-a-real-credential', 'x');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'invalid credential must fail closed on detach';
  end if;

  v_session := public.create_walk_session_for_credential(v_owner, 'leader', 'owner-bind-detach');
  if v_session->>'ok' is distinct from 'true' then
    raise exception 'owner create failed: %', v_session;
  end if;
  if v_session->>'syncParticipation' is distinct from 'synced' then
    raise exception 'owner must start synced: %', v_session;
  end if;
  v_id := (v_session->>'id')::uuid;

  -- Leader cannot detach
  v_result := public.detach_walk_session_for_credential(v_owner, 'owner-bind-detach');
  if v_result->>'reason' is distinct from 'leader_cannot_detach' then
    raise exception 'leader detach must fail: %', v_result;
  end if;

  -- Member discovers synced
  v_session_b := public.get_active_walk_session_for_credential(v_member, 'member-bind-detach');
  if v_session_b->>'id' is distinct from v_session->>'id'
     or v_session_b->>'syncParticipation' is distinct from 'synced' then
    raise exception 'member must discover synced session: %', v_session_b;
  end if;

  -- Detach only this member
  v_result := public.detach_walk_session_for_credential(v_member, 'member-bind-detach');
  if v_result->>'ok' is distinct from 'true'
     or v_result->>'syncParticipation' is distinct from 'independent'
     or (v_result->>'id')::uuid is distinct from v_id then
    raise exception 'member detach failed: %', v_result;
  end if;

  -- Session remains active for organizer
  v_session := public.get_active_walk_session_for_credential(v_owner, 'owner-bind-detach');
  if v_session->>'ok' is distinct from 'true'
     or (v_session->>'id')::uuid is distinct from v_id
     or v_session->>'syncParticipation' is distinct from 'synced'
     or v_session->>'status' is distinct from 'active' then
    raise exception 'organizer session must remain active/synced: %', v_session;
  end if;

  -- Seat still claimed
  select status into v_part from public.family_seats where id = v_seat_id;
  if v_part is distinct from 'claimed' then
    raise exception 'detach must not revoke seat';
  end if;

  -- Idempotent detach
  v_result := public.detach_walk_session_for_credential(v_member, 'member-bind-detach');
  if v_result->>'syncParticipation' is distinct from 'independent' then
    raise exception 'idempotent detach must stay independent: %', v_result;
  end if;

  -- Wrong binding fail closed
  v_result := public.detach_walk_session_for_credential(v_member, 'wrong-binding');
  if v_result->>'ok' is distinct from 'false' then
    raise exception 'wrong binding must fail closed: %', v_result;
  end if;

  -- Rejoin restores synced on same session (no second session)
  v_result := public.rejoin_walk_session_for_credential(v_member, 'member-bind-detach');
  if v_result->>'ok' is distinct from 'true'
     or v_result->>'syncParticipation' is distinct from 'synced'
     or (v_result->>'id')::uuid is distinct from v_id then
    raise exception 'rejoin failed: %', v_result;
  end if;

  if (
    select count(*) from public.walk_sessions
    where bundle_id = (v_session->>'bundleId')::uuid and status = 'active'
  ) <> 1 then
    raise exception 'rejoin must not create a second active session';
  end if;

  raise notice 'walk_session_participant verify ok';
end;
$$;

rollback;
