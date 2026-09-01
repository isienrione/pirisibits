/**
 * ChronoWalk master profile contract.
 * Level-1 pillars expand into Level-2 micro-vectors (T1A civic vs T1B memory).
 * Rhythm maps to discovery posture D1 / D2 / D3.
 * Mobility archetypes map to M_y (M2 step-free, M5 high comfort).
 */

export const INTEREST_VECTORS = {
  historia: ['T1', 'T2'],
  arquitectura: ['T3', 'T4'],
  arte: ['T5'],
  vida_local: ['T6'],
  naturaleza: ['T7'],
  barrios: ['T8', 'T9'],
} as const;

export type PillarId = keyof typeof INTEREST_VECTORS;

export const MICRO_INTERESTS = {
  historia_civica: {
    pillar: 'historia',
    vectors: ['T1'],
    code: 'T1A',
    title: 'Cívico-Institucional',
    subtitle: 'Palacios, plazas y el relato oficial de la ciudad.',
  },
  memoria_ddhh: {
    pillar: 'historia',
    vectors: ['T2'],
    code: 'T1B',
    title: 'Memoria / DD.HH.',
    subtitle: 'Sitios de memoria, ausencia y archivo. Requiere opt-in.',
  },
  arq_monumental: {
    pillar: 'arquitectura',
    vectors: ['T3'],
    code: 'T3',
    title: 'Arquitectura monumental',
    subtitle: 'Fachadas cívicas, naves y piedra de poder.',
  },
  arq_vernacula: {
    pillar: 'arquitectura',
    vectors: ['T4'],
    code: 'T4',
    title: 'Tejido y vivienda',
    subtitle: 'Pasajes, adobe y la escala del barrio.',
  },
  arte_visual: {
    pillar: 'arte',
    vectors: ['T5'],
    code: 'T5',
    title: 'Arte y cultura',
    subtitle: 'Museos, murales y casas de artistas.',
  },
  vida_cotidiana: {
    pillar: 'vida_local',
    vectors: ['T6'],
    code: 'T6',
    title: 'Vida cotidiana',
    subtitle: 'Mercado, pregón y el oficio de la calle.',
  },
  gastronomia: {
    pillar: 'vida_local',
    vectors: ['T2'],
    code: 'T2',
    title: 'Gastronomía',
    subtitle: 'Mesas, mercados y la cocina de la ciudad.',
  },
  naturaleza_cerros: {
    pillar: 'naturaleza',
    vectors: ['T7'],
    code: 'T7',
    title: 'Cerros y parques',
    subtitle: 'Santa Lucía, San Cristóbal y el valle.',
  },
  barrios_vivos: {
    pillar: 'barrios',
    vectors: ['T8'],
    code: 'T8',
    title: 'Barrios vivos',
    subtitle: 'Lastarria, Yungay, Bellavista.',
  },
  barrios_memoria: {
    pillar: 'barrios',
    vectors: ['T9'],
    code: 'T9',
    title: 'Memoria de barrio',
    subtitle: 'Capas vecinales, murales y casonas.',
  },
} as const;

export type MicroInterestId = keyof typeof MICRO_INTERESTS;
export type InterestId = PillarId | MicroInterestId;

export const RHYTHM_POSTURE = {
  equilibrado: 'D1',
  espontaneo: 'D2',
  estructurado: 'D3',
} as const;

export type ExplorerRhythm = keyof typeof RHYTHM_POSTURE;
export type DiscoveryPostureId = (typeof RHYTHM_POSTURE)[ExplorerRhythm];

export const DISCOVERY_POSTURES: Record<
  DiscoveryPostureId,
  { rhythm: ExplorerRhythm; title: string; kicker: string; subtitle: string }
> = {
  D1: {
    rhythm: 'equilibrado',
    title: 'Flâneur',
    kicker: 'D1',
    subtitle: 'Dejarse llevar. Un plan con aire para desviarse.',
  },
  D2: {
    rhythm: 'espontaneo',
    title: 'Detective',
    kicker: 'D2',
    subtitle: 'Seguir pistas, ramales y lo que no está en el mapa.',
  },
  D3: {
    rhythm: 'estructurado',
    title: 'Coleccionista',
    kicker: 'D3',
    subtitle: 'Un itinerario claro: anclas, piezas, cierre.',
  },
};

export type MobilityArchetypeId = 'M2' | 'M3' | 'M4' | 'M5';

export const MOBILITY_ARCHETYPES: Record<
  MobilityArchetypeId,
  {
    title: string;
    subtitle: string;
    avoidStairs: boolean;
    walkChunkMinutes: number;
    useMetro: boolean;
    highlight?: boolean;
  }
> = {
  M2: {
    title: 'Sin gradas',
    subtitle: 'Ruta step-free. Evita escaleras y desniveles.',
    avoidStairs: true,
    walkChunkMinutes: 20,
    useMetro: true,
    highlight: true,
  },
  M5: {
    title: 'Alta comodidad',
    subtitle: 'Tramos cortos, metro a mano, sin fricción.',
    avoidStairs: true,
    walkChunkMinutes: 15,
    useMetro: true,
    highlight: true,
  },
  M3: {
    title: 'Caminante equilibrado',
    subtitle: 'Calles del centro, tramos de 30 minutos.',
    avoidStairs: false,
    walkChunkMinutes: 30,
    useMetro: true,
  },
  M4: {
    title: 'Tramos largos',
    subtitle: 'Más calle, menos metro. Hasta 45 minutos seguidos.',
    avoidStairs: false,
    walkChunkMinutes: 45,
    useMetro: false,
  },
};

export const MAX_MICRO_INTERESTS = 6;

export const TIME_BUDGET_BANDS = [
  {
    id: 'capsule' as const,
    minutes: 45,
    label: 'Cápsula breve',
    range: '30–45 min',
    subtitle: 'Un eje y dos revelaciones. Sin solape.',
  },
  {
    id: 'halfday' as const,
    minutes: 105,
    label: 'Media jornada',
    range: '90–120 min',
    subtitle: 'Anclas + un bolsillo. Ritmo de tarde.',
  },
  {
    id: 'deep' as const,
    minutes: 180,
    label: 'Jornada profunda',
    range: '180+ min',
    subtitle: 'Archivo, ramales y cierre. Según tu postura.',
  },
] as const;

export const TIME_BUDGET_STOPS = [45, 105, 180] as const;

export function snapTimeBudget(minutes: number): number {
  return TIME_BUDGET_STOPS.reduce(
    (best, n) => (Math.abs(n - minutes) < Math.abs(best - minutes) ? n : best),
    TIME_BUDGET_STOPS[0],
  );
}

export function timeBandFor(minutes: number) {
  const snapped = snapTimeBudget(minutes);
  return TIME_BUDGET_BANDS.find((b) => b.minutes === snapped) ?? TIME_BUDGET_BANDS[1];
}

export type SolverPayload = {
  vectors: string[];
  posture: DiscoveryPostureId;
  T_budget: number;
  walkChunkMinutes: number;
  useMetro: boolean;
  avoidStairs: boolean;
  stayDays: number;
  locationEnabled: boolean;
  memorySitesOptIn: boolean;
  M_y: MobilityArchetypeId;
};

export function isMicroInterest(id: string): id is MicroInterestId {
  return id in MICRO_INTERESTS;
}

export function isPillarId(id: string): id is PillarId {
  return id in INTEREST_VECTORS;
}

export function normalizeInterests(raw: string[]): InterestId[] {
  const next: InterestId[] = [];
  raw.forEach((id) => {
    if (isMicroInterest(id)) {
      if (!next.includes(id)) next.push(id);
      return;
    }
    if (isPillarId(id)) {
      const micros = (Object.keys(MICRO_INTERESTS) as MicroInterestId[]).filter(
        (micro) => MICRO_INTERESTS[micro].pillar === id,
      );
      micros.forEach((micro) => {
        if (!next.includes(micro)) next.push(micro);
      });
    }
  });
  return next.slice(0, 6);
}

export function interestLabel(id: string): string {
  if (isMicroInterest(id)) return MICRO_INTERESTS[id].title;
  if (isPillarId(id)) {
    const titles: Record<PillarId, string> = {
      historia: 'Historia',
      arquitectura: 'Arquitectura',
      arte: 'Arte y Cultura',
      vida_local: 'Vida Local',
      naturaleza: 'Naturaleza',
      barrios: 'Barrios',
    };
    return titles[id];
  }
  return id;
}

export function buildSolverPayload(input: {
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
}): SolverPayload {
  const vectors = Array.from(
    new Set(
      normalizeInterests(input.interests).flatMap((id) =>
        isMicroInterest(id) ? [...MICRO_INTERESTS[id].vectors] : [...INTEREST_VECTORS[id]],
      ),
    ),
  );

  return {
    vectors,
    posture: RHYTHM_POSTURE[input.rhythm],
    T_budget: input.timeBudgetMinutes,
    walkChunkMinutes: input.walkChunkMinutes,
    useMetro: input.useMetro,
    avoidStairs: input.avoidStairs,
    stayDays: input.stayDays,
    locationEnabled: input.locationEnabled,
    memorySitesOptIn: Boolean(input.memorySitesOptIn),
    M_y: input.mobilityArchetype ?? (input.avoidStairs ? (input.walkChunkMinutes <= 15 ? 'M5' : 'M2') : 'M3'),
  };
}

export const VECTOR_INDEX = {
  T1: 0,
  T1A: 0,
  T2: 1,
  T1B: 1,
  T3: 2,
  T4: 3,
  T5: 4,
  T6: 5,
  T7: 6,
  T8: 7,
  T9: 8,
} as const;

export type VectorKey = keyof typeof VECTOR_INDEX;

export function emptyThematicVector(): number[] {
  return Array.from({ length: 10 }, () => 0);
}

export function vectorFromTopics(topics: Partial<Record<VectorKey, number>>): number[] {
  const v = emptyThematicVector();
  (Object.entries(topics) as [VectorKey, number][]).forEach(([key, value]) => {
    v[VECTOR_INDEX[key]] = value;
  });
  return v;
}

export function weightsFromInterests(interests: InterestId[]): number[] {
  const w = Array.from({ length: 10 }, () => 0.1);
  normalizeInterests(interests).forEach((id) => {
    const keys = isMicroInterest(id) ? MICRO_INTERESTS[id].vectors : INTEREST_VECTORS[id];
    keys.forEach((key) => {
      w[VECTOR_INDEX[key]] = 1;
    });
  });
  return w;
}

export const WALK_BASE_MPS = 1.1;
export const WALK_HURRY_MPS = 1.3;
export const TTS_BASE_RATE = 1;
export const TTS_HURRY_FACTOR = 1.15;
export const STATIONARY_MPS = 0.35;

export function isHurryPace(metersPerSecond: number): boolean {
  return metersPerSecond > WALK_HURRY_MPS;
}

export function isStationaryPace(metersPerSecond: number): boolean {
  return metersPerSecond < STATIONARY_MPS;
}

/** Live TTS rate: 1.0 at the 1.1 m/s base, 1.15 (+15%) when v_u > 1.3 m/s. */
export function ttsSpeedFromWalkingPace(metersPerSecond: number): number {
  return isHurryPace(metersPerSecond) ? TTS_HURRY_FACTOR : TTS_BASE_RATE;
}
