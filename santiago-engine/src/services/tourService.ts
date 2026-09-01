import { haversineMeters, walkingMinutesBetween } from '@/src/data/geo';
import { LocalImages, type LocalImageKey } from '@/src/data/localImages';
import {
  CENTRO_TOUR_IDS,
  getPoiById,
  parseInteractiveLayer,
  SANTIAGO_POIS,
  type ForensicHotspot,
  type InteractiveLayer,
  type MediaLevel,
  type POIStop,
  type StopKind,
} from '@/src/data/pois';
import { isSupabaseConfigured, supabase } from '@/src/services/api';
import type { GeneratedTour } from '@/src/services/routeEngine';

export const DEFAULT_TOUR_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export interface TourStop {
  stop_id: string;
  title: string;
  order_index: number;
  latitude: number;
  longitude: number;
  radius_meters: number;
  img_before?: string;
  img_after?: string;
  module_a: string;
  module_b: string;
  module_c?: string;
  module_d: string;
  audio_a?: string;
  audio_b?: string;
  audio_c?: string;
  audio_d?: string;
}

type ManifestRow = {
  stop_id?: string;
  title?: string;
  order_index?: number;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  radius?: number;
  radius_meters?: number;
  img_before?: string;
  img_after?: string;
  module_a?: string;
  module_b?: string;
  module_c?: string;
  module_d?: string;
  audio_a?: string;
  audio_b?: string;
  audio_c?: string;
  audio_d?: string;
};

function mapRow(row: ManifestRow, index: number): TourStop {
  return {
    stop_id: row.stop_id || `stop-${index + 1}`,
    title: row.title || `Parada ${index + 1}`,
    order_index: row.order_index ?? index + 1,
    latitude: Number(row.latitude ?? row.lat ?? 0),
    longitude: Number(row.longitude ?? row.lon ?? 0),
    radius_meters: Number(row.radius_meters ?? row.radius ?? 25),
    img_before: row.img_before,
    img_after: row.img_after,
    module_a: row.module_a || '',
    module_b: row.module_b || '',
    module_c: row.module_c || '',
    module_d: row.module_d || '',
    audio_a: row.audio_a,
    audio_b: row.audio_b,
    audio_c: row.audio_c,
    audio_d: row.audio_d,
  };
}

function matchLocalPoi(row: TourStop): POIStop | undefined {
  const byId = getPoiById(row.stop_id);
  if (byId) return byId;
  const haystack = `${row.stop_id} ${row.title}`.toLowerCase();
  return SANTIAGO_POIS.find((poi) => {
    if (haystack.includes(poi.id)) return true;
    const title = poi.title.toLowerCase();
    if (haystack.includes(title)) return true;
    if (haystack.includes('phillips') && poi.id === 'pasaje-phillips') return true;
    if (haystack.includes('catedral') && poi.id === 'catedral') return true;
    if (haystack.includes('moneda') && poi.id === 'la-moneda') return true;
    if ((haystack.includes('morandé') || haystack.includes('morande')) && poi.id === 'morande-80') {
      return true;
    }
    if (haystack.includes('armas') && poi.id === 'plaza-de-armas') return true;
    return false;
  });
}

export function localCentroManifest(): TourStop[] {
  return CENTRO_TOUR_IDS.map((id, index) => {
    const poi = getPoiById(id)!;
    return {
      stop_id: poi.id,
      title: poi.title,
      order_index: index + 1,
      latitude: poi.lat,
      longitude: poi.lng,
      radius_meters: 25,
      module_a: poi.audio.A,
      module_b: poi.audio.B,
      module_c: poi.audio.C,
      module_d: poi.audio.D,
    };
  });
}

export function tourStopToPoi(row: TourStop): POIStop {
  const local = matchLocalPoi(row);
  const module_a = row.module_a || local?.audio.A || '';
  const module_b = row.module_b || local?.audio.B || '';
  const module_c = row.module_c || local?.audio.C || '';
  const module_d = row.module_d || local?.audio.D || '';
  const base: POIStop = local ?? {
    id: row.stop_id,
    title: row.title,
    subtitle: 'Parada de la ruta ChronoWalk.',
    neighborhood: 'Santiago Centro',
    lat: row.latitude,
    lng: row.longitude,
    kind: 'micro',
    mediaLevel: 1,
    thematicVector: Array.from({ length: 10 }, () => 0.1),
    dwellMinutes: 10,
    stairs: false,
    imageKey: 'plaza',
    directionHint: 'Sigue hacia la próxima historia',
    audio: { A: module_a, B: module_b, C: module_c, D: module_d },
  };

  return {
    ...base,
    id: local?.id ?? row.stop_id,
    title: row.title || base.title,
    lat: row.latitude || base.lat,
    lng: row.longitude || base.lng,
    audio: { A: module_a, B: module_b, C: module_c, D: module_d },
    modules: { module_a, module_b, module_c, module_d },
    radius_meters: row.radius_meters || local?.radius_meters || 25,
    img_before: row.img_before || local?.img_before,
    img_after: row.img_after || local?.img_after,
    thenImageKey: local?.thenImageKey,
  };
}

export function manifestToTour(rows: TourStop[], tourId = DEFAULT_TOUR_ID): GeneratedTour {
  const ordered = [...rows].sort((a, b) => a.order_index - b.order_index);
  const stops = ordered.map(tourStopToPoi);
  let distanceM = 0;
  let totalMinutes = 0;
  stops.forEach((stop, i) => {
    totalMinutes += stop.dwellMinutes;
    if (i === 0) return;
    const prev = stops[i - 1];
    distanceM += haversineMeters(
      { lat: prev.lat, lng: prev.lng },
      { lat: stop.lat, lng: stop.lng },
    );
    totalMinutes += walkingMinutesBetween(
      { lat: prev.lat, lng: prev.lng },
      { lat: stop.lat, lng: stop.lng },
    );
  });

  return {
    tourId,
    title: 'Santiago: Poder, Memoria y Arte',
    currentStopIndex: 0,
    stops,
    completedStops: [],
    isPaused: false,
    startTime: 0,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10 || 1.4,
    totalMinutes: totalMinutes || 75,
    harmonic: {
      anchors: stops.filter((s) => s.kind === 'anchor').length,
      pockets: stops.filter((s) => s.kind === 'pocket').length,
      micros: stops.filter((s) => s.kind === 'micro').length,
    },
    resonance: 0,
  };
}

export async function fetchTourManifest(
  tourId: string = DEFAULT_TOUR_ID,
  lang: string = 'es',
): Promise<TourStop[]> {
  if (!isSupabaseConfigured) {
    return localCentroManifest();
  }

  const { data, error } = await supabase.rpc('get_tour_manifest', {
    p_tour_id: tourId,
    p_lang: lang,
  });

  if (error) {
    console.warn('Error fetching tour manifest:', error.message);
    return localCentroManifest();
  }

  const rows = ((data as ManifestRow[]) || []).map(mapRow);
  if (!rows.length) return localCentroManifest();
  return rows.sort((a, b) => a.order_index - b.order_index);
}

type SpatialRow = {
  id?: string;
  title?: string;
  subtitle?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  radius_meters?: number;
  kind?: string;
  media_level?: number;
  dwell_minutes?: number;
  stairs?: boolean;
  step_free?: boolean;
  daylight_lock?: boolean;
  sensitive_memory?: boolean;
  img_before?: string;
  img_after?: string;
  direction_hint?: string;
  image_key?: string;
  then_image_key?: string;
  quote_persona?: string;
  quote_text?: string;
  soundscape_label?: string;
  archive_transcript?: string;
  forensic_hotspots?: ForensicHotspot[];
  interactive_layer?: InteractiveLayer | Record<string, unknown>;
  hub_slug?: string;
  t1?: number; t2?: number; t3?: number; t4?: number; t5?: number;
  t6?: number; t7?: number; t8?: number; t9?: number; t10?: number;
  module_a?: string; module_b?: string; module_c?: string; module_d?: string;
  poi_vectors?: { t1?: number; t2?: number; t3?: number; t4?: number; t5?: number; t6?: number; t7?: number; t8?: number; t9?: number; t10?: number } | { t1?: number; t2?: number; t3?: number; t4?: number; t5?: number; t6?: number; t7?: number; t8?: number; t9?: number; t10?: number }[];
  narrative_scripts?: { lang?: string; module_a?: string; module_b?: string; module_c?: string; module_d?: string } | { lang?: string; module_a?: string; module_b?: string; module_c?: string; module_d?: string }[];
};

function asKind(value?: string): StopKind {
  if (value === 'anchor' || value === 'pocket' || value === 'micro') return value;
  return 'micro';
}

function asMediaLevel(value?: number): MediaLevel {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value;
  return 1;
}

function asImageKey(value?: string, fallback: LocalImageKey = 'plaza'): LocalImageKey {
  if (value && value in LocalImages) return value as LocalImageKey;
  return fallback;
}

function first<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

function mapSpatialRow(row: SpatialRow): POIStop {
  const local = row.id ? getPoiById(row.id) : undefined;
  const vectors = first(row.poi_vectors);
  const script = first(row.narrative_scripts);
  const T = [
    row.t1 ?? vectors?.t1 ?? local?.thematicVector[0] ?? 0.1,
    row.t2 ?? vectors?.t2 ?? local?.thematicVector[1] ?? 0.1,
    row.t3 ?? vectors?.t3 ?? local?.thematicVector[2] ?? 0.1,
    row.t4 ?? vectors?.t4 ?? local?.thematicVector[3] ?? 0.1,
    row.t5 ?? vectors?.t5 ?? local?.thematicVector[4] ?? 0.1,
    row.t6 ?? vectors?.t6 ?? local?.thematicVector[5] ?? 0.1,
    row.t7 ?? vectors?.t7 ?? local?.thematicVector[6] ?? 0.1,
    row.t8 ?? vectors?.t8 ?? local?.thematicVector[7] ?? 0.1,
    row.t9 ?? vectors?.t9 ?? local?.thematicVector[8] ?? 0.1,
    row.t10 ?? vectors?.t10 ?? local?.thematicVector[9] ?? 0.1,
  ];
  const A = row.module_a || script?.module_a || local?.audio.A || '';
  const B = row.module_b || script?.module_b || local?.audio.B || '';
  const C = row.module_c || script?.module_c || local?.audio.C || '';
  const D = row.module_d || script?.module_d || local?.audio.D || '';
  return {
    id: row.id || local?.id || 'poi',
    title: row.title || local?.title || 'Parada',
    subtitle: row.subtitle || local?.subtitle || '',
    neighborhood: row.neighborhood || local?.neighborhood || 'Santiago',
    lat: Number(row.lat ?? local?.lat ?? 0),
    lng: Number(row.lng ?? local?.lng ?? 0),
    kind: asKind(row.kind) || local?.kind || 'micro',
    mediaLevel: asMediaLevel(row.media_level) || local?.mediaLevel || 1,
    thematicVector: T,
    vectors: T,
    dwellMinutes: Number(row.dwell_minutes ?? local?.dwellMinutes ?? 10),
    stairs: Boolean(row.stairs ?? local?.stairs),
    stepFree: row.step_free ?? local?.stepFree ?? !Boolean(row.stairs ?? local?.stairs),
    step_free_certified: row.step_free ?? local?.step_free_certified ?? local?.stepFree ?? !Boolean(row.stairs ?? local?.stairs),
    daylightLock: Boolean(row.daylight_lock ?? local?.daylightLock),
    daylight_only: Boolean(row.daylight_lock ?? local?.daylight_only ?? local?.daylightLock),
    sensitiveMemory: Boolean(row.sensitive_memory ?? local?.sensitiveMemory),
    is_sensitive_memory_site: Boolean(row.sensitive_memory ?? local?.is_sensitive_memory_site ?? local?.sensitiveMemory),
    canonical_anchor: (asKind(row.kind) || local?.kind) === 'anchor' || Boolean(local?.canonical_anchor),
    islandHubId: row.hub_slug || local?.islandHubId,
    imageKey: asImageKey(row.image_key, local?.imageKey ?? 'plaza'),
    thenImageKey: row.then_image_key ? asImageKey(row.then_image_key) : local?.thenImageKey,
    img_before: row.img_before || local?.img_before,
    img_after: row.img_after || local?.img_after,
    directionHint: row.direction_hint || local?.directionHint || 'Sigue hacia la próxima historia',
    quote:
      row.quote_persona && row.quote_text
        ? { persona: row.quote_persona, text: row.quote_text }
        : local?.quote,
    soundscapeLabel: row.soundscape_label || local?.soundscapeLabel,
    archiveTranscript: row.archive_transcript || local?.archiveTranscript,
    forensicHotspots: row.forensic_hotspots?.length ? row.forensic_hotspots : local?.forensicHotspots,
    interactive_layer:
      parseInteractiveLayer(row.interactive_layer) ?? local?.interactive_layer,
    radius_meters: Number(row.radius_meters ?? local?.radius_meters ?? 25),
    audio: { A, B, C, D },
    modules: { module_a: A, module_b: B, module_c: C, module_d: D },
  };
}

export async function fetchSpatialCatalog(lang: string = 'es'): Promise<POIStop[]> {
  if (!isSupabaseConfigured) return SANTIAGO_POIS;

  const rpc = await supabase.rpc('get_spatial_catalog', { p_lang: lang });
  if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length) {
    return (rpc.data as SpatialRow[]).map(mapSpatialRow);
  }

  const nested = await supabase.from('pois').select(`
    id, title, subtitle, neighborhood, lat, lng, radius_meters, kind, media_level,
    dwell_minutes, stairs, step_free, daylight_lock, sensitive_memory,
    img_before, img_after, direction_hint, image_key, then_image_key,
    quote_persona, quote_text, soundscape_label, archive_transcript, forensic_hotspots, interactive_layer,
    poi_vectors ( t1, t2, t3, t4, t5, t6, t7, t8, t9, t10 ),
    narrative_scripts ( lang, module_a, module_b, module_c, module_d )
  `);

  if (!nested.error && Array.isArray(nested.data) && nested.data.length) {
    return (nested.data as SpatialRow[]).map(mapSpatialRow);
  }

  console.warn('Spatial catalog unavailable, using local Santiago POIs.', rpc.error?.message || nested.error?.message);
  return SANTIAGO_POIS;
}
