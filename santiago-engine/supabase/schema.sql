-- ChronoWalk V3.0 Spatial-Narrative schema
-- Run in the Supabase SQL editor (requires PostGIS).
-- Anon keys cannot CREATE TABLE; this file is the source of truth.

create extension if not exists postgis;

create table if not exists public.island_hubs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326),
  radius_meters integer not null default 1800,
  timezone text not null default 'America/Santiago',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pois (
  id text primary key,
  hub_id uuid references public.island_hubs(id) on delete set null,
  title text not null,
  subtitle text,
  neighborhood text,
  lat double precision not null,
  lng double precision not null,
  geom geography(point, 4326),
  radius_meters integer not null default 25,
  kind text not null check (kind in ('anchor', 'pocket', 'micro')),
  media_level smallint not null default 1 check (media_level between 1 and 5),
  dwell_minutes integer not null default 10,
  stairs boolean not null default false,
  step_free boolean not null default true,
  daylight_lock boolean not null default false,
  sensitive_memory boolean not null default false,
  img_before text,
  img_after text,
  direction_hint text,
  image_key text,
  then_image_key text,
  quote_persona text,
  quote_text text,
  soundscape_label text,
  archive_transcript text,
  forensic_hotspots jsonb not null default '[]'::jsonb,
  interactive_layer jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.poi_vectors (
  poi_id text primary key references public.pois(id) on delete cascade,
  t1 real not null default 0,
  t2 real not null default 0,
  t3 real not null default 0,
  t4 real not null default 0,
  t5 real not null default 0,
  t6 real not null default 0,
  t7 real not null default 0,
  t8 real not null default 0,
  t9 real not null default 0,
  t10 real not null default 0
);

create table if not exists public.narrative_scripts (
  id uuid primary key default gen_random_uuid(),
  poi_id text not null references public.pois(id) on delete cascade,
  lang text not null default 'es',
  module_a text not null default '',
  module_b text not null default '',
  module_c text not null default '',
  module_d text not null default '',
  audio_a text,
  audio_b text,
  audio_c text,
  audio_d text,
  unique (poi_id, lang)
);

create or replace function public.touch_point_geom()
returns trigger
language plpgsql
as $$
begin
  new.geom := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

drop trigger if exists island_hubs_geom on public.island_hubs;
create trigger island_hubs_geom
before insert or update of lat, lng on public.island_hubs
for each row execute function public.touch_point_geom();

drop trigger if exists pois_geom on public.pois;
create trigger pois_geom
before insert or update of lat, lng on public.pois
for each row execute function public.touch_point_geom();

create index if not exists pois_geom_gix on public.pois using gist (geom);
create index if not exists island_hubs_geom_gix on public.island_hubs using gist (geom);
create index if not exists pois_kind_idx on public.pois (kind);
create index if not exists pois_gating_idx on public.pois (step_free, daylight_lock, sensitive_memory);

alter table public.island_hubs enable row level security;
alter table public.pois enable row level security;
alter table public.poi_vectors enable row level security;
alter table public.narrative_scripts enable row level security;

drop policy if exists island_hubs_read on public.island_hubs;
create policy island_hubs_read on public.island_hubs for select using (true);

drop policy if exists pois_read on public.pois;
create policy pois_read on public.pois for select using (true);

drop policy if exists poi_vectors_read on public.poi_vectors;
create policy poi_vectors_read on public.poi_vectors for select using (true);

drop policy if exists narrative_scripts_read on public.narrative_scripts;
create policy narrative_scripts_read on public.narrative_scripts for select using (true);

alter table public.pois add column if not exists interactive_layer jsonb not null default '{}'::jsonb;

create or replace function public.get_spatial_catalog(p_lang text default 'es')
returns table (
  id text,
  title text,
  subtitle text,
  neighborhood text,
  lat double precision,
  lng double precision,
  radius_meters integer,
  kind text,
  media_level smallint,
  dwell_minutes integer,
  stairs boolean,
  step_free boolean,
  daylight_lock boolean,
  sensitive_memory boolean,
  img_before text,
  img_after text,
  direction_hint text,
  image_key text,
  then_image_key text,
  quote_persona text,
  quote_text text,
  soundscape_label text,
  archive_transcript text,
  forensic_hotspots jsonb,
  interactive_layer jsonb,
  hub_slug text,
  t1 real, t2 real, t3 real, t4 real, t5 real, t6 real, t7 real, t8 real, t9 real, t10 real,
  module_a text, module_b text, module_c text, module_d text,
  audio_a text, audio_b text, audio_c text, audio_d text
)
language sql
stable
as $$
  select
    p.id, p.title, p.subtitle, p.neighborhood, p.lat, p.lng, p.radius_meters,
    p.kind, p.media_level, p.dwell_minutes, p.stairs, p.step_free,
    p.daylight_lock, p.sensitive_memory, p.img_before, p.img_after,
    p.direction_hint, p.image_key, p.then_image_key, p.quote_persona, p.quote_text,
    p.soundscape_label, p.archive_transcript, p.forensic_hotspots, p.interactive_layer,
    h.slug,
    v.t1, v.t2, v.t3, v.t4, v.t5, v.t6, v.t7, v.t8, v.t9, v.t10,
    s.module_a, s.module_b, s.module_c, s.module_d,
    s.audio_a, s.audio_b, s.audio_c, s.audio_d
  from public.pois p
  left join public.island_hubs h on h.id = p.hub_id
  left join public.poi_vectors v on v.poi_id = p.id
  left join public.narrative_scripts s on s.poi_id = p.id and s.lang = p_lang;
$$;

grant execute on function public.get_spatial_catalog(text) to anon, authenticated;

insert into public.island_hubs (slug, name, lat, lng, radius_meters)
values
  ('santiago-centro', 'Santiago Centro Cívico', -33.4378, -70.6505, 1600),
  ('lastarria-bellavista', 'Lastarria · Bellavista', -33.4355, -70.6408, 1400),
  ('yungay-matucana', 'Yungay · Matucana', -33.4438, -70.677, 1500)
on conflict (slug) do update
set name = excluded.name, lat = excluded.lat, lng = excluded.lng, radius_meters = excluded.radius_meters;
