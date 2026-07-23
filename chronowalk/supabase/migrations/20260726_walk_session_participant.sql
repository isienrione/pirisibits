-- Participant-level shared-walk participation (synced vs walking independently).
-- Run after 20260725_walk_session_discovery.sql.
--
-- Followers may detach from group sync without ending the session, revoking seats,
-- or changing other participants. Reloads remain server-authoritative via this table.
-- Existing active Sandbox sessions stay valid: missing participant rows mean 'synced'.

create table if not exists public.walk_session_participants (
  session_id uuid not null references public.walk_sessions (id) on delete cascade,
  seat_id uuid not null references public.family_seats (id) on delete cascade,
  participation text not null default 'synced',
  updated_at timestamptz not null default now(),
  primary key (session_id, seat_id),
  constraint walk_session_participants_participation_check
    check (participation in ('synced', 'independent'))
);

create index if not exists walk_session_participants_seat_idx
  on public.walk_session_participants (seat_id);

alter table public.walk_session_participants enable row level security;

drop policy if exists "walk_session_participants service only" on public.walk_session_participants;
create policy "walk_session_participants service only"
  on public.walk_session_participants for all to service_role
  using (true) with check (true);

create or replace function public._cw_session_participation(
  p_session_id uuid,
  p_seat_id uuid
)
returns text
language sql
stable
as $$
  select coalesce(
    (
      select p.participation
      from public.walk_session_participants p
      where p.session_id = p_session_id
        and p.seat_id = p_seat_id
      limit 1
    ),
    'synced'
  );
$$;

revoke all on function public._cw_session_participation(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public._cw_session_participation(uuid, uuid)
  to service_role;

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
    'status', p_session.status,
    'syncParticipation', public._cw_session_participation(p_session.id, p_my_seat_id)
  );
$$;

revoke all on function public._cw_walk_session_payload(public.walk_sessions, uuid)
  from public, anon, authenticated;
grant execute on function public._cw_walk_session_payload(public.walk_sessions, uuid)
  to service_role;

-- Ensure organizer is synced when creating a session.
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

  insert into public.walk_session_participants (session_id, seat_id, participation, updated_at)
  values (v_session.id, v_auth.seat_id, 'synced', now())
  on conflict (session_id, seat_id) do update
    set participation = 'synced', updated_at = now();

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.create_walk_session_for_credential(text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_walk_session_for_credential(text, text, text)
  to anon;

-- Follower detaches only their own seat from sync (group session stays active).
create or replace function public.detach_walk_session_for_credential(
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

  -- Leader cannot detach via this follower RPC (would break group authority).
  if v_session.leader_seat_id is not distinct from v_auth.seat_id
     or v_auth.role = 'owner' then
    return jsonb_build_object('ok', false, 'reason', 'leader_cannot_detach');
  end if;

  insert into public.walk_session_participants (session_id, seat_id, participation, updated_at)
  values (v_session.id, v_auth.seat_id, 'independent', now())
  on conflict (session_id, seat_id) do update
    set participation = 'independent', updated_at = now();

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.detach_walk_session_for_credential(text, text)
  from public, anon, authenticated;
grant execute on function public.detach_walk_session_for_credential(text, text)
  to anon;

-- Rejoin active shared walk for this seat only (no second session).
create or replace function public.rejoin_walk_session_for_credential(
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

  insert into public.walk_session_participants (session_id, seat_id, participation, updated_at)
  values (v_session.id, v_auth.seat_id, 'synced', now())
  on conflict (session_id, seat_id) do update
    set participation = 'synced', updated_at = now();

  return public._cw_walk_session_payload(v_session, v_auth.seat_id);
end;
$$;

revoke all on function public.rejoin_walk_session_for_credential(text, text)
  from public, anon, authenticated;
grant execute on function public.rejoin_walk_session_for_credential(text, text)
  to anon;
