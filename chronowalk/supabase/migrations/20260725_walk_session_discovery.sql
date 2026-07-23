-- Active walk-session discovery for Couple/Family members.
-- Run after 20260721_launch_commerce_hardening.sql (and invite canonical if applied).
--
-- Members start with no cached session id. Polling previously required session.id,
-- so Seat 2 never learned that the organizer created a session.
-- get_active_walk_session_for_credential discovers the bundle's active session using
-- only device credential + binding (server derives membership). Existing active
-- Sandbox sessions remain discoverable — no remint/repurchase required.

create or replace function public._cw_walk_session_payload(
  p_session public.walk_sessions,
  p_my_seat_id uuid
)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'ok', true,
    'id', p_session.id,
    'bundleId', p_session.bundle_id,
    'joinCode', p_session.join_code,
    'leaderSeatId', p_session.leader_seat_id,
    'mySeatId', p_my_seat_id,
    'syncEnabled', p_session.sync_enabled,
    'resumePolicy', p_session.resume_policy,
    'waypointId', p_session.waypoint_id,
    'chapterIndex', p_session.chapter_index,
    'positionSeconds', p_session.position_seconds,
    'playbackRate', p_session.playback_rate,
    'playing', p_session.playing,
    'paused', p_session.paused,
    'pauseSourceSeatId', p_session.pause_source_seat_id,
    'updatedAt', p_session.updated_at,
    'expiresAt', p_session.expires_at,
    'status', p_session.status
  );
$$;

revoke all on function public._cw_walk_session_payload(public.walk_sessions, uuid)
  from public, anon, authenticated;
grant execute on function public._cw_walk_session_payload(public.walk_sessions, uuid)
  to service_role;

create index if not exists walk_sessions_bundle_active_idx
  on public.walk_sessions (bundle_id, updated_at desc)
  where status = 'active';

-- Discover the caller's bundle active session (no client-supplied session/bundle ids).
create or replace function public.get_active_walk_session_for_credential(
  p_credential text,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
begin
  select * into v_auth
  from public._cw_active_seat_for_credential(p_credential, p_device_binding)
  limit 1;

  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  select * into v_session
  from public.walk_sessions
  where bundle_id = v_auth.bundle_id
    and status = 'active'
    and expires_at > now()
  order by updated_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_active_session');
  end if;

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.get_active_walk_session_for_credential(text, text)
  from public, anon, authenticated;
grant execute on function public.get_active_walk_session_for_credential(text, text)
  to anon;

-- Recreate create/get/update to emit mySeatId and support stale rejection on update.
create or replace function public.create_walk_session_for_credential(
  p_credential text,
  p_resume_policy text default 'leader',
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
  v_code text;
  v_policy text;
begin
  select * into v_auth
  from public._cw_active_seat_for_credential(p_credential, p_device_binding)
  limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  -- Organizer-only: owners start the shared tour; members discover it.
  if v_auth.role is distinct from 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'not_owner');
  end if;

  v_policy := case when p_resume_policy = 'anyone' then 'anyone' else 'leader' end;

  update public.walk_sessions
  set expires_at = now(), status = 'ended', updated_at = now()
  where bundle_id = v_auth.bundle_id and status = 'active' and expires_at > now();

  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 5));
    exit when not exists (
      select 1 from public.walk_sessions
      where join_code = v_code and status = 'active' and expires_at > now()
    );
  end loop;

  insert into public.walk_sessions (
    bundle_id, join_code, leader_seat_id, resume_policy, sync_enabled, status
  ) values (
    v_auth.bundle_id, v_code, v_auth.seat_id, v_policy, true, 'active'
  ) returning * into v_session;

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.create_walk_session_for_credential(text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_walk_session_for_credential(text, text, text)
  to anon;

create or replace function public.get_walk_session_for_credential(
  p_credential text,
  p_session_id uuid,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
begin
  select * into v_auth
  from public._cw_active_seat_for_credential(p_credential, p_device_binding)
  limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  select * into v_session
  from public.walk_sessions
  where id = p_session_id
    and bundle_id = v_auth.bundle_id
    and status = 'active'
    and expires_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.get_walk_session_for_credential(text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.get_walk_session_for_credential(text, uuid, text)
  to anon;

create or replace function public.update_walk_session_for_credential(
  p_credential text,
  p_session_id uuid,
  p_patch jsonb,
  p_device_binding text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth record;
  v_session public.walk_sessions%rowtype;
  v_is_leader boolean;
  v_expected timestamptz;
begin
  select * into v_auth
  from public._cw_active_seat_for_credential(p_credential, p_device_binding)
  limit 1;
  if v_auth.seat_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_a_member');
  end if;

  select * into v_session
  from public.walk_sessions
  where id = p_session_id
    and bundle_id = v_auth.bundle_id
  for update;

  if not found or v_session.status is distinct from 'active' or v_session.expires_at <= now() then
    return jsonb_build_object('ok', false, 'reason', 'session_not_found');
  end if;

  -- Reject stale/out-of-order patches when the client supplies the last-seen stamp.
  if p_patch ? 'expectedUpdatedAt'
     and nullif(trim(p_patch->>'expectedUpdatedAt'), '') is not null then
    begin
      v_expected := (p_patch->>'expectedUpdatedAt')::timestamptz;
    exception when others then
      return jsonb_build_object('ok', false, 'reason', 'invalid_expected_updated_at');
    end;
    if v_session.updated_at > v_expected then
      return (public._cw_walk_session_payload(v_session, v_auth.seat_id) - 'ok')
        || jsonb_build_object('ok', false, 'reason', 'stale_update');
    end if;
  end if;

  v_is_leader := v_session.leader_seat_id = v_auth.seat_id;

  if p_patch ? 'syncEnabled' then
    if not v_is_leader then
      return jsonb_build_object('ok', false, 'reason', 'leader_only');
    end if;
    v_session.sync_enabled := (p_patch->>'syncEnabled')::boolean;
  end if;
  if p_patch ? 'resumePolicy' then
    if not v_is_leader then
      return jsonb_build_object('ok', false, 'reason', 'leader_only');
    end if;
    v_session.resume_policy := case
      when p_patch->>'resumePolicy' = 'anyone' then 'anyone'
      else 'leader'
    end;
  end if;

  if p_patch ? 'event' then
    if not v_session.sync_enabled
       and (p_patch->>'event') in ('pause', 'resume', 'seek', 'rate', 'clock') then
      null;
    else
      case p_patch->>'event'
        when 'pause' then
          v_session.playing := false;
          v_session.paused := true;
          v_session.pause_source_seat_id := v_auth.seat_id;
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
        when 'resume' then
          if v_session.resume_policy = 'leader' and not v_is_leader then
            return jsonb_build_object('ok', false, 'reason', 'resume_leader_only');
          end if;
          v_session.playing := true;
          v_session.paused := false;
          v_session.pause_source_seat_id := null;
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
        when 'seek' then
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
          if p_patch ? 'chapterIndex' then
            v_session.chapter_index := (p_patch->>'chapterIndex')::int;
          end if;
        when 'rate' then
          if p_patch ? 'playbackRate' then
            v_session.playback_rate := (p_patch->>'playbackRate')::double precision;
          end if;
        when 'clock' then
          if v_is_leader then
            if p_patch ? 'waypointId' then
              v_session.waypoint_id := nullif(p_patch->>'waypointId', '');
            end if;
            if p_patch ? 'chapterIndex' then
              v_session.chapter_index := (p_patch->>'chapterIndex')::int;
            end if;
            if p_patch ? 'positionSeconds' then
              v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
            end if;
            if p_patch ? 'playbackRate' then
              v_session.playback_rate := (p_patch->>'playbackRate')::double precision;
            end if;
            if p_patch ? 'playing' then
              v_session.playing := (p_patch->>'playing')::boolean;
            end if;
            if p_patch ? 'paused' then
              v_session.paused := (p_patch->>'paused')::boolean;
            end if;
          end if;
        else
          null;
      end case;
    end if;
  end if;

  v_session.updated_at := clock_timestamp();

  update public.walk_sessions set
    sync_enabled = v_session.sync_enabled,
    resume_policy = v_session.resume_policy,
    waypoint_id = v_session.waypoint_id,
    chapter_index = v_session.chapter_index,
    position_seconds = v_session.position_seconds,
    playback_rate = v_session.playback_rate,
    playing = v_session.playing,
    paused = v_session.paused,
    pause_source_seat_id = v_session.pause_source_seat_id,
    updated_at = v_session.updated_at
  where id = p_session_id;

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.update_walk_session_for_credential(text, uuid, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.update_walk_session_for_credential(text, uuid, jsonb, text)
  to anon;
