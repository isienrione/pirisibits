-- ChronoWalk Family Walk — RETIRED insecure grant path.
-- DO NOT run this file on new or production environments.
-- Use supabase/migrations/20260721_launch_commerce_hardening.sql instead:
--   - bundles only from verified rome-couple / rome-family purchases
--   - hashed one-time invites + seat-scoped device credentials
--   - anon create_family_bundle / device-id session RPCs are revoked

-- ── Bundles & seats ──────────────────────────────────────────────────────────

create table if not exists public.family_bundles (
  id uuid primary key default gen_random_uuid(),
  access_token uuid not null,
  tier text not null check (tier in ('couple', 'family')),
  seat_limit int not null check (seat_limit between 2 and 6),
  owner_device_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists family_bundles_access_token_idx on public.family_bundles (access_token);

create table if not exists public.family_seats (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.family_bundles (id) on delete cascade,
  label text not null default 'Walker',
  invite_code text not null unique,
  claimed_device_id text,
  claimed_display_name text,
  claimed_at timestamptz,
  status text not null default 'open' check (status in ('open', 'claimed', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists family_seats_bundle_idx on public.family_seats (bundle_id);
create index if not exists family_seats_invite_idx on public.family_seats (invite_code);
create index if not exists family_seats_device_idx on public.family_seats (claimed_device_id);

-- ── Live walk sessions ───────────────────────────────────────────────────────

create table if not exists public.walk_sessions (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.family_bundles (id) on delete cascade,
  join_code text not null unique,
  leader_device_id text not null,
  sync_enabled boolean not null default true,
  -- leader = only leader resumes for everyone; anyone = any member can resume after a shared pause
  resume_policy text not null default 'leader' check (resume_policy in ('leader', 'anyone')),
  waypoint_id text,
  chapter_index int not null default 0,
  position_seconds double precision not null default 0,
  playback_rate double precision not null default 1,
  playing boolean not null default false,
  paused boolean not null default true,
  pause_source_device_id text,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '18 hours')
);

create index if not exists walk_sessions_join_idx on public.walk_sessions (join_code);
create index if not exists walk_sessions_bundle_idx on public.walk_sessions (bundle_id);

alter table public.family_bundles enable row level security;
alter table public.family_seats enable row level security;
alter table public.walk_sessions enable row level security;

-- Anon may call security-definer RPCs; direct table access stays locked down.
create policy "family_bundles service"
  on public.family_bundles for all to service_role using (true) with check (true);
create policy "family_seats service"
  on public.family_seats for all to service_role using (true) with check (true);
create policy "walk_sessions service"
  on public.walk_sessions for all to service_role using (true) with check (true);

-- ── Helpers ──────────────────────────────────────────────────────────────────

create or replace function public._family_random_code(p_len int default 6)
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..p_len loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- ── RPCs ─────────────────────────────────────────────────────────────────────

create or replace function public.create_family_bundle(
  p_access_token text,
  p_tier text,
  p_device_id text,
  p_owner_name text default 'Leader'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_limit int;
  v_bundle public.family_bundles%rowtype;
  v_code text;
  i int;
  v_label text;
begin
  if p_tier not in ('couple', 'family') then
    raise exception 'invalid_tier';
  end if;
  if p_device_id is null or length(trim(p_device_id)) < 4 then
    raise exception 'invalid_device';
  end if;

  begin
    v_token := p_access_token::uuid;
  exception when others then
    raise exception 'invalid_token';
  end;

  if not exists (select 1 from public.purchases where access_token = v_token) then
    raise exception 'token_not_found';
  end if;

  v_limit := case when p_tier = 'couple' then 2 else 4 end;

  insert into public.family_bundles (access_token, tier, seat_limit, owner_device_id)
  values (v_token, p_tier, v_limit, p_device_id)
  returning * into v_bundle;

  -- Seat 1 = owner (already claimed)
  insert into public.family_seats (bundle_id, label, invite_code, claimed_device_id, claimed_display_name, claimed_at, status)
  values (v_bundle.id, coalesce(nullif(p_owner_name, ''), 'Leader'), public._family_random_code(6), p_device_id, coalesce(nullif(p_owner_name, ''), 'Leader'), now(), 'claimed');

  for i in 2..v_limit loop
    loop
      v_code := public._family_random_code(6);
      exit when not exists (select 1 from public.family_seats where invite_code = v_code);
    end loop;
    v_label := case when p_tier = 'couple' then 'Partner' else 'Walker ' || i::text end;
    insert into public.family_seats (bundle_id, label, invite_code, status)
    values (v_bundle.id, v_label, v_code, 'open');
  end loop;

  return public.get_family_bundle(v_bundle.id, p_device_id);
end;
$$;

create or replace function public.get_family_bundle(p_bundle_id uuid, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_bundle public.family_bundles%rowtype;
  v_seats jsonb;
  v_my_seat jsonb;
begin
  select * into v_bundle from public.family_bundles where id = p_bundle_id;
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'label', s.label,
    'inviteCode', s.invite_code,
    'status', s.status,
    'claimedDeviceId', s.claimed_device_id,
    'claimedDisplayName', s.claimed_display_name,
    'claimedAt', s.claimed_at
  ) order by s.created_at), '[]'::jsonb)
  into v_seats
  from public.family_seats s
  where s.bundle_id = p_bundle_id;

  select jsonb_build_object(
    'id', s.id,
    'label', s.label,
    'status', s.status,
    'isOwner', s.claimed_device_id = v_bundle.owner_device_id
  )
  into v_my_seat
  from public.family_seats s
  where s.bundle_id = p_bundle_id and s.claimed_device_id = p_device_id
  limit 1;

  return jsonb_build_object(
    'id', v_bundle.id,
    'tier', v_bundle.tier,
    'seatLimit', v_bundle.seat_limit,
    'ownerDeviceId', v_bundle.owner_device_id,
    'isOwner', v_bundle.owner_device_id = p_device_id,
    'mySeat', v_my_seat,
    'seats', v_seats
  );
end;
$$;

create or replace function public.claim_family_seat(
  p_invite_code text,
  p_device_id text,
  p_display_name text default 'Walker'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat public.family_seats%rowtype;
  v_bundle public.family_bundles%rowtype;
begin
  if p_device_id is null or length(trim(p_device_id)) < 4 then
    raise exception 'invalid_device';
  end if;

  select * into v_seat
  from public.family_seats
  where upper(invite_code) = upper(trim(p_invite_code))
  for update;

  if not found then
    raise exception 'invite_not_found';
  end if;
  if v_seat.status = 'revoked' then
    raise exception 'invite_revoked';
  end if;
  if v_seat.status = 'claimed' and v_seat.claimed_device_id is distinct from p_device_id then
    raise exception 'invite_already_claimed';
  end if;

  select * into v_bundle from public.family_bundles where id = v_seat.bundle_id;

  update public.family_seats
  set
    status = 'claimed',
    claimed_device_id = p_device_id,
    claimed_display_name = coalesce(nullif(trim(p_display_name), ''), v_seat.label),
    claimed_at = coalesce(claimed_at, now())
  where id = v_seat.id;

  return public.get_family_bundle(v_bundle.id, p_device_id);
end;
$$;

create or replace function public.get_bundle_for_device(p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_bundle_id uuid;
begin
  select bundle_id into v_bundle_id
  from public.family_seats
  where claimed_device_id = p_device_id and status = 'claimed'
  order by claimed_at desc nulls last
  limit 1;

  if v_bundle_id is null then
    return null;
  end if;
  return public.get_family_bundle(v_bundle_id, p_device_id);
end;
$$;

create or replace function public.create_walk_session(
  p_bundle_id uuid,
  p_device_id text,
  p_resume_policy text default 'leader'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.walk_sessions%rowtype;
  v_code text;
  v_policy text;
begin
  if not exists (
    select 1 from public.family_seats
    where bundle_id = p_bundle_id and claimed_device_id = p_device_id and status = 'claimed'
  ) then
    raise exception 'not_a_member';
  end if;

  v_policy := case when p_resume_policy = 'anyone' then 'anyone' else 'leader' end;

  -- Expire any prior open sessions for this bundle
  update public.walk_sessions
  set expires_at = now()
  where bundle_id = p_bundle_id and expires_at > now();

  loop
    v_code := public._family_random_code(5);
    exit when not exists (select 1 from public.walk_sessions where join_code = v_code and expires_at > now());
  end loop;

  insert into public.walk_sessions (
    bundle_id, join_code, leader_device_id, resume_policy, sync_enabled
  ) values (
    p_bundle_id, v_code, p_device_id, v_policy, true
  ) returning * into v_session;

  return public.get_walk_session(v_session.id);
end;
$$;

create or replace function public.join_walk_session(p_join_code text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.walk_sessions%rowtype;
begin
  select * into v_session
  from public.walk_sessions
  where upper(join_code) = upper(trim(p_join_code))
    and expires_at > now()
  limit 1;

  if not found then
    raise exception 'session_not_found';
  end if;

  if not exists (
    select 1 from public.family_seats
    where bundle_id = v_session.bundle_id and claimed_device_id = p_device_id and status = 'claimed'
  ) then
    raise exception 'not_a_member';
  end if;

  return public.get_walk_session(v_session.id);
end;
$$;

create or replace function public.get_walk_session(p_session_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', s.id,
    'bundleId', s.bundle_id,
    'joinCode', s.join_code,
    'leaderDeviceId', s.leader_device_id,
    'syncEnabled', s.sync_enabled,
    'resumePolicy', s.resume_policy,
    'waypointId', s.waypoint_id,
    'chapterIndex', s.chapter_index,
    'positionSeconds', s.position_seconds,
    'playbackRate', s.playback_rate,
    'playing', s.playing,
    'paused', s.paused,
    'pauseSourceDeviceId', s.pause_source_device_id,
    'updatedAt', s.updated_at,
    'expiresAt', s.expires_at
  )
  from public.walk_sessions s
  where s.id = p_session_id;
$$;

create or replace function public.update_walk_session_state(
  p_session_id uuid,
  p_device_id text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.walk_sessions%rowtype;
  v_is_leader boolean;
  v_resume_policy text;
begin
  select * into v_session from public.walk_sessions where id = p_session_id for update;
  if not found or v_session.expires_at <= now() then
    raise exception 'session_not_found';
  end if;

  if not exists (
    select 1 from public.family_seats
    where bundle_id = v_session.bundle_id and claimed_device_id = p_device_id and status = 'claimed'
  ) then
    raise exception 'not_a_member';
  end if;

  v_is_leader := v_session.leader_device_id = p_device_id;
  v_resume_policy := v_session.resume_policy;

  -- Anyone may toggle sync_enabled / resume_policy for the group (family decision)
  if p_patch ? 'syncEnabled' then
    v_session.sync_enabled := (p_patch->>'syncEnabled')::boolean;
  end if;
  if p_patch ? 'resumePolicy' then
    v_session.resume_policy := case when p_patch->>'resumePolicy' = 'anyone' then 'anyone' else 'leader' end;
    v_resume_policy := v_session.resume_policy;
  end if;

  -- Transport events
  if p_patch ? 'event' then
    if not v_session.sync_enabled and (p_patch->>'event') in ('pause', 'resume', 'seek', 'rate', 'clock') then
      -- sync off: ignore transport from peers (local autonomy). Leaders may still update prefs above.
      null;
    else
      case p_patch->>'event'
        when 'pause' then
          v_session.playing := false;
          v_session.paused := true;
          v_session.pause_source_device_id := p_device_id;
          if p_patch ? 'positionSeconds' then
            v_session.position_seconds := (p_patch->>'positionSeconds')::double precision;
          end if;
        when 'resume' then
          if v_resume_policy = 'leader' and not v_is_leader then
            raise exception 'resume_leader_only';
          end if;
          v_session.playing := true;
          v_session.paused := false;
          v_session.pause_source_device_id := null;
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
            if p_patch ? 'waypointId' then v_session.waypoint_id := p_patch->>'waypointId'; end if;
            if p_patch ? 'chapterIndex' then v_session.chapter_index := (p_patch->>'chapterIndex')::int; end if;
            if p_patch ? 'positionSeconds' then v_session.position_seconds := (p_patch->>'positionSeconds')::double precision; end if;
            if p_patch ? 'playbackRate' then v_session.playback_rate := (p_patch->>'playbackRate')::double precision; end if;
            if p_patch ? 'playing' then v_session.playing := (p_patch->>'playing')::boolean; end if;
            if p_patch ? 'paused' then v_session.paused := (p_patch->>'paused')::boolean; end if;
          end if;
        else
          null;
      end case;
    end if;
  end if;

  if p_patch ? 'waypointId' and v_is_leader then
    v_session.waypoint_id := p_patch->>'waypointId';
  end if;

  v_session.updated_at := now();

  update public.walk_sessions set
    sync_enabled = v_session.sync_enabled,
    resume_policy = v_session.resume_policy,
    waypoint_id = v_session.waypoint_id,
    chapter_index = v_session.chapter_index,
    position_seconds = v_session.position_seconds,
    playback_rate = v_session.playback_rate,
    playing = v_session.playing,
    paused = v_session.paused,
    pause_source_device_id = v_session.pause_source_device_id,
    updated_at = v_session.updated_at
  where id = p_session_id;

  return public.get_walk_session(p_session_id);
end;
$$;

grant execute on function public.create_family_bundle(text, text, text, text) to anon;
grant execute on function public.get_family_bundle(uuid, text) to anon;
grant execute on function public.claim_family_seat(text, text, text) to anon;
grant execute on function public.get_bundle_for_device(text) to anon;
grant execute on function public.create_walk_session(uuid, text, text) to anon;
grant execute on function public.join_walk_session(text, text) to anon;
grant execute on function public.get_walk_session(uuid) to anon;
grant execute on function public.update_walk_session_state(uuid, text, jsonb) to anon;

-- Realtime: clients subscribe to walk_sessions updates for their session id
alter publication supabase_realtime add table public.walk_sessions;
