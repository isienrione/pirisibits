import {
  INTEREST_VECTORS,
  MICRO_INTERESTS,
  RHYTHM_POSTURE,
  weightsFromInterests,
  type ExplorerRhythm,
  type InterestId,
  type MobilityArchetypeId,
} from '@/src/data/algorithm';
import { haversineMeters, walkingMinutesBetween, type LatLng } from '@/src/data/geo';
import { SANTIAGO_ORIGIN, SANTIAGO_POIS, type POIStop, type StopKind } from '@/src/data/pois';
import type { TourStop } from '@/src/services/tourService';

export type DiscoveryPosture = (typeof RHYTHM_POSTURE)[ExplorerRhythm];

export type HarmonicTargets = {
  n: number;
  anchors: number;
  pockets: number;
  micros: number;
};

export type UserProfile5D = {
  thematicWeights: number[];
  discoveryPosture: DiscoveryPosture;
  timeBudgetMinutes: number;
  stepFree: boolean;
  /** M2 gate: discard POIs that are not step-free certified. */
  stepFreeRequired: boolean;
  highComfort: boolean;
  memorySitesOptIn: boolean;
  interests: InterestId[];
  rhythm: ExplorerRhythm;
  walkChunkMinutes: number;
  useMetro: boolean;
  stayDays: number;
  locationEnabled: boolean;
};

export type GeneratedTour = {
  tourId: string;
  title: string;
  currentStopIndex: number;
  stops: POIStop[];
  completedStops: string[];
  isPaused: boolean;
  startTime: number;
  distanceKm: number;
  totalMinutes: number;
  harmonic: { anchors: number; pockets: number; micros: number };
  resonance?: number;
};

export interface UserProfile {
  timeBudgetMinutes: number;
  selectedInterests: string[];
  stepFree?: boolean;
  stepFreeRequired?: boolean;
  memorySitesOptIn?: boolean;
}

const FALLBACK_STOP_COST = 20;
const INTEREST_IDS = new Set<string>([
  ...Object.keys(INTEREST_VECTORS),
  ...Object.keys(MICRO_INTERESTS),
]);

/** T1A, T1B, T3…T9 — nine thematic axes. */
export const THEMATIC_DIMS = 9;
export const CANONICAL_ANCHOR_FLOOR = 0.7;

const HARMONIC_60: HarmonicTargets = { anchors: 1, pockets: 1, micros: 2, n: 4 };
const HARMONIC_120: HarmonicTargets = { anchors: 2, pockets: 1, micros: 3, n: 6 };

/** ≥180 min: posture D_z shifts the mix (Flâneur / Detective / Coleccionista). */
const HARMONIC_180: Record<DiscoveryPosture, HarmonicTargets> = {
  D1: { anchors: 2, pockets: 2, micros: 4, n: 8 },
  D2: { anchors: 2, pockets: 2, micros: 5, n: 9 },
  D3: { anchors: 3, pockets: 2, micros: 3, n: 8 },
};

export function poiVectors(poi: POIStop): number[] {
  return poi.vectors ?? poi.thematicVector ?? [];
}

export function isCanonicalAnchor(poi: POIStop): boolean {
  if (poi.canonical_anchor === true) return true;
  if (poi.canonical_anchor === false) return false;
  return poi.kind === 'anchor';
}

export function isStepFreeCertified(poi: POIStop): boolean {
  if (poi.step_free_certified === false || poi.stepFree === false) return false;
  if (poi.stairs) return false;
  return true;
}

export function isSensitiveMemorySite(poi: POIStop): boolean {
  return Boolean(poi.is_sensitive_memory_site ?? poi.sensitiveMemory);
}

export function isDaylightOnly(poi: POIStop): boolean {
  return Boolean(poi.daylight_only ?? poi.daylightLock);
}

export function stopKind(poi: POIStop): StopKind {
  if (isCanonicalAnchor(poi)) return 'anchor';
  return poi.kind;
}

/**
 * Tensor resonance: ⟨T_u, T_p⟩ over T1A…T9.
 * Canonical anchors receive an anchor bias: score is at least 0.70.
 */
export function tensorResonance(
  T_u: number[],
  T_p: number[],
  canonicalAnchor = false,
): number {
  const n = Math.min(THEMATIC_DIMS, T_u.length, T_p.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += (T_u[i] ?? 0) * (T_p[i] ?? 0);
  if (canonicalAnchor) return Math.max(sum, CANONICAL_ANCHOR_FLOOR);
  return sum;
}

export function scorePoiResonance(profile: Pick<UserProfile5D, 'thematicWeights'>, poi: POIStop): {
  raw: number;
  score: number;
} {
  const raw = tensorResonance(profile.thematicWeights, poiVectors(poi), false);
  const score = isCanonicalAnchor(poi) ? Math.max(raw, CANONICAL_ANCHOR_FLOOR) : raw;
  return { raw, score };
}

export function rankPoisForProfile(
  catalog: POIStop[],
  profile: UserProfile5D,
  excludeIds: Iterable<string> = [],
  opts?: { hardFilters?: boolean },
): { poi: POIStop; raw: number; score: number; matchPct: number; chronoWorth: number }[] {
  const skip = new Set(excludeIds);
  const source = catalog.length ? catalog : SANTIAGO_POIS;
  const pool = (opts?.hardFilters === false ? source : applyHardFilters(source, profile)).filter(
    (poi) => !skip.has(poi.id),
  );
  const scored = pool.map((poi) => {
    const { raw, score } = scorePoiResonance(profile, poi);
    const chronoWorth = Math.round(
      Math.min(99, Math.max(14, score * 16 + poi.mediaLevel * 7 + (poi.kind === 'anchor' ? 8 : poi.kind === 'pocket' ? 4 : 0))),
    );
    return { poi, raw, score, matchPct: 0, chronoWorth };
  });
  const maxRaw = Math.max(...scored.map((s) => s.raw), 0.35);
  return scored
    .map((s) => ({
      ...s,
      matchPct: Math.round(Math.min(99, Math.max(8, (s.raw / maxRaw) * 100))),
    }))
    .sort((a, b) => b.score - a.score || b.chronoWorth - a.chronoWorth);
}

export function harmonicTargets(
  budgetMinutes: number,
  posture: DiscoveryPosture = 'D1',
): HarmonicTargets {
  const budget = budgetMinutes || 105;
  if (budget <= 45) return { ...HARMONIC_60 };
  if (budget >= 180) return { ...HARMONIC_180[posture] };
  return { ...HARMONIC_120 };
}

export function isDaylightSantiago(now = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'America/Santiago',
    }).format(now),
  );
  return hour >= 7 && hour < 19;
}

/**
 * Hard filters / operational gates. Fail-closed.
 * 1. M2 stepFreeRequired → drop uncertified (cerros con escaleras).
 * 2. No memory opt-in → drop is_sensitive_memory_site (Morandé 80, Londres 38).
 * 3. Night + daylight_only → drop.
 */
export function applyHardFilters(pois: POIStop[], profile: UserProfile5D, now = new Date()): POIStop[] {
  const daylight = isDaylightSantiago(now);
  const stepFreeRequired = profile.stepFreeRequired || profile.stepFree;
  return pois.filter((poi) => {
    if (stepFreeRequired && !isStepFreeCertified(poi)) return false;
    if (!profile.memorySitesOptIn && isSensitiveMemorySite(poi)) return false;
    if (!daylight && isDaylightOnly(poi)) return false;
    return true;
  });
}

function pickTop(
  scored: { poi: POIStop; score: number; raw: number }[],
  kind: StopKind,
  count: number,
  used: Set<string>,
  minScore?: number,
): POIStop[] {
  return scored
    .filter((s) => stopKind(s.poi) === kind && !used.has(s.poi.id) && (minScore == null || s.score >= minScore))
    .sort((a, b) => b.raw - a.raw || b.score - a.score)
    .slice(0, count)
    .map((s) => s.poi);
}

function nearestNeighbor(pois: POIStop[], origin: LatLng): POIStop[] {
  const remaining = [...pois];
  const ordered: POIStop[] = [];
  let cursor = origin;
  while (remaining.length) {
    let best = 0;
    let bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineMeters(cursor, { lat: p.lat, lng: p.lng });
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    const next = remaining.splice(best, 1)[0];
    ordered.push(next);
    cursor = { lat: next.lat, lng: next.lng };
  }
  return ordered;
}

function tourTitle(profile: UserProfile5D): string {
  const hay = profile.interests.join(' ');
  const hasHist = /historia|memoria/.test(hay);
  const hasArq = /arq|arquitectura/.test(hay);
  const hasArte = /arte/.test(hay);
  const hasBarrios = /barrios/.test(hay);
  const hasNat = /naturaleza/.test(hay);
  if (hasHist && hasArq) return 'Santiago: Poder, Memoria y Arte';
  if (hasArte && hasBarrios) return 'Santiago: Barrios y Cultura Viva';
  if (hasNat) return 'Santiago: Cerros y Centro';
  return 'Santiago a tu ritmo';
}

export function profileFromInputs(input: {
  interests: InterestId[];
  rhythm: ExplorerRhythm;
  timeBudgetMinutes: number;
  walkChunkMinutes: number;
  useMetro: boolean;
  avoidStairs: boolean;
  stayDays: number;
  locationEnabled: boolean;
  memorySitesOptIn?: boolean;
  mobilityArchetype?: MobilityArchetypeId;
}): UserProfile5D {
  const stepFreeRequired = input.mobilityArchetype === 'M2' || input.avoidStairs;
  return {
    thematicWeights: weightsFromInterests(input.interests),
    discoveryPosture: RHYTHM_POSTURE[input.rhythm],
    timeBudgetMinutes: input.timeBudgetMinutes,
    stepFree: stepFreeRequired,
    stepFreeRequired,
    highComfort: input.mobilityArchetype === 'M5' || input.walkChunkMinutes <= 15,
    memorySitesOptIn: Boolean(input.memorySitesOptIn),
    interests: input.interests,
    rhythm: input.rhythm,
    walkChunkMinutes: input.walkChunkMinutes,
    useMetro: input.useMetro,
    stayDays: input.stayDays,
    locationEnabled: input.locationEnabled,
  };
}

export function optimizeItinerary(
  catalog: POIStop[],
  profile: UserProfile5D,
  origin: LatLng = SANTIAGO_ORIGIN,
): GeneratedTour {
  const counts = harmonicTargets(profile.timeBudgetMinutes, profile.discoveryPosture);
  const T_u = profile.thematicWeights;
  const candidates = applyHardFilters(catalog.length ? catalog : SANTIAGO_POIS, profile);

  const scored = candidates
    .map((poi) => {
      const { raw, score } = scorePoiResonance(profile, poi);
      return { poi, raw, score };
    })
    .sort((a, b) => b.score - a.score || b.raw - a.raw);

  const used = new Set<string>();
  const selected: POIStop[] = [];

  pickTop(scored, 'anchor', counts.anchors, used, CANONICAL_ANCHOR_FLOOR).forEach((poi) => {
    used.add(poi.id);
    selected.push(poi);
  });
  pickTop(scored, 'pocket', counts.pockets, used).forEach((poi) => {
    used.add(poi.id);
    selected.push(poi);
  });
  pickTop(scored, 'micro', counts.micros, used).forEach((poi) => {
    used.add(poi.id);
    selected.push(poi);
  });

  if (selected.length < counts.n) {
    scored.forEach(({ poi, score }) => {
      if (selected.length >= counts.n || used.has(poi.id)) return;
      if (isCanonicalAnchor(poi) && score < CANONICAL_ANCHOR_FLOOR) return;
      used.add(poi.id);
      selected.push(poi);
    });
  }

  const ordered = nearestNeighbor(selected, origin);
  let remaining = profile.timeBudgetMinutes;
  let cursor = origin;
  let distanceM = 0;
  const withCost = ordered.map((poi) => {
    const walkMin = walkingMinutesBetween(cursor, { lat: poi.lat, lng: poi.lng });
    const cost = walkMin + poi.dwellMinutes;
    const meters = haversineMeters(cursor, { lat: poi.lat, lng: poi.lng });
    cursor = { lat: poi.lat, lng: poi.lng };
    remaining -= cost;
    distanceM += meters;
    return poi;
  });

  const stops = withCost.length ? withCost : ordered.slice(0, Math.max(3, counts.n));
  const harmonic = {
    anchors: stops.filter((s) => stopKind(s) === 'anchor').length,
    pockets: stops.filter((s) => stopKind(s) === 'pocket').length,
    micros: stops.filter((s) => stopKind(s) === 'micro').length,
  };
  const resonance =
    stops.reduce((sum, poi) => sum + tensorResonance(T_u, poiVectors(poi), isCanonicalAnchor(poi)), 0) /
    Math.max(1, stops.length);

  return {
    tourId: `tour-${profile.discoveryPosture}-${profile.timeBudgetMinutes}-${stops.map((s) => s.id).join('_')}`.slice(0, 72),
    title: tourTitle(profile),
    currentStopIndex: 0,
    stops,
    completedStops: [],
    isPaused: false,
    startTime: 0,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10 || 2.8,
    totalMinutes: profile.timeBudgetMinutes - Math.max(0, remaining),
    harmonic,
    resonance: Math.round(resonance * 100) / 100,
  };
}

export function generateItinerary(
  profile: UserProfile5D,
  origin: LatLng = SANTIAGO_ORIGIN,
  catalog: POIStop[] = SANTIAGO_POIS,
): GeneratedTour {
  return optimizeItinerary(catalog, profile, origin);
}

export function remainingMinutesForTour(tour: GeneratedTour): number {
  const rest = tour.stops.slice(tour.currentStopIndex);
  return rest.reduce((sum, s, i) => {
    const prev = i === 0 ? null : rest[i - 1];
    const walk = prev ? walkingMinutesBetween({ lat: prev.lat, lng: prev.lng }, { lat: s.lat, lng: s.lng }) : 6;
    return sum + walk + s.dwellMinutes;
  }, 0);
}

export const BIFURCATION_PAIR = {
  left: 'santa-lucia',
  right: 'lastarria',
} as const;

function matchLocal(stop: TourStop) {
  return SANTIAGO_POIS.find((poi) => poi.id === stop.stop_id) ?? SANTIAGO_POIS.find((poi) => {
    const haystack = `${stop.stop_id} ${stop.title}`.toLowerCase();
    return haystack.includes(poi.id) || haystack.includes(poi.title.toLowerCase());
  });
}

function estimatedStopCost(stop: TourStop, previous: TourStop | null): number {
  const poi = matchLocal(stop);
  const dwell = poi?.dwellMinutes ?? FALLBACK_STOP_COST;
  if (!previous) return dwell;
  return (
    dwell +
    walkingMinutesBetween(
      { lat: previous.latitude, lng: previous.longitude },
      { lat: stop.latitude, lng: stop.longitude },
    )
  );
}

export function routeLengthMeters(stops: { latitude: number; longitude: number }[]): number {
  let meters = 0;
  for (let i = 1; i < stops.length; i += 1) {
    meters += haversineMeters(
      { lat: stops[i - 1].latitude, lng: stops[i - 1].longitude },
      { lat: stops[i].latitude, lng: stops[i].longitude },
    );
  }
  return Math.round(meters);
}

export function optimizeRouteKnapsack(allStops: TourStop[], profile: UserProfile): TourStop[] {
  const ids = profile.selectedInterests.filter((id): id is InterestId => INTEREST_IDS.has(id));
  const solverProfile = profileFromInputs({
    interests: ids.length ? ids : (['historia'] as InterestId[]),
    rhythm: 'equilibrado',
    timeBudgetMinutes: profile.timeBudgetMinutes || 105,
    walkChunkMinutes: 30,
    useMetro: true,
    avoidStairs: Boolean(profile.stepFreeRequired ?? profile.stepFree),
    stayDays: 3,
    locationEnabled: true,
    memorySitesOptIn: profile.memorySitesOptIn,
    mobilityArchetype: profile.stepFreeRequired || profile.stepFree ? 'M2' : 'M3',
  });

  const catalog = allStops
    .map((row) => matchLocal(row))
    .filter((poi): poi is POIStop => Boolean(poi));

  const tour = optimizeItinerary(catalog.length ? catalog : SANTIAGO_POIS, solverProfile);
  const byId = new Map(allStops.map((s) => [s.stop_id, s]));

  const ordered: TourStop[] = [];
  tour.stops.forEach((poi, index) => {
    const row = byId.get(poi.id);
    if (row) {
      ordered.push({ ...row, order_index: index + 1 });
      return;
    }
    ordered.push({
      stop_id: poi.id,
      title: poi.title,
      order_index: index + 1,
      latitude: poi.lat,
      longitude: poi.lng,
      radius_meters: poi.radius_meters ?? 25,
      module_a: poi.audio.A,
      module_b: poi.audio.B,
      module_c: poi.audio.C,
      module_d: poi.audio.D,
    });
  });

  if (ordered.length >= 2) return ordered;

  const sorted = [...allStops].sort((a, b) => a.order_index - b.order_index);
  let accumulatedTime = 0;
  const selected: TourStop[] = [];
  for (const stop of sorted) {
    const cost = estimatedStopCost(stop, selected[selected.length - 1] ?? null);
    if (accumulatedTime + cost <= (profile.timeBudgetMinutes || 105)) {
      selected.push(stop);
      accumulatedTime += cost;
    } else break;
  }
  return selected.length >= 2 ? selected : sorted.slice(0, 2);
}
