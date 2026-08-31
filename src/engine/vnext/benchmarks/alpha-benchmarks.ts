/**
 * Gate 2E.6 — Benchmark TravelerRequests (NOT gold routes).
 * Where evidence cannot support a request → DATA_COVERAGE_LIMITED.
 */

import type { TravelerRequestVNext } from '@/src/engine/vnext/scoring/traveler-facets'

export type BenchmarkCoverage = 'SUPPORTED' | 'DATA_COVERAGE_LIMITED'

export type AlphaBenchmark = {
  id: string
  label: string
  coverage: BenchmarkCoverage
  coverageNote: string
  request: TravelerRequestVNext
}

export const ALPHA_BENCHMARKS: AlphaBenchmark[] = [
  {
    id: 'B01_FIRST_TIMER_BALANCED',
    label: 'First-timer · balanced · 120 min walk',
    coverage: 'SUPPORTED',
    coverageNote: 'Launch30 + legacy dwell sufficient for LEGACY_COMPATIBILITY demo',
    request: {
      interests: ['historia', 'arquitectura'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D2',
      timeBudgetMinutes: 120,
      useMetro: false,
      startingStgoId: 'STGO_01',
      activityMode: 'URBAN_WALK',
      semanticFacets: { COLONIAL: null, ARCHITECTURE: null },
    },
  },
  {
    id: 'B02_ORIGINS_COLONIAL',
    label: 'Origins / colonial interest · 120 min',
    coverage: 'SUPPORTED',
    coverageNote: 'Facet values not assigned — themes via historia; facets UNKNOWN evidence',
    request: {
      interests: ['historia'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D2',
      timeBudgetMinutes: 120,
      useMetro: false,
      startingStgoId: 'STGO_01',
      activityMode: 'URBAN_WALK',
      semanticFacets: { ORIGINS_INDIGENOUS: null, COLONIAL: 1, REPUBLIC_NATION_FORMATION: null },
    },
  },
  {
    id: 'B03_REPEAT_VISITOR_FLANEUR',
    label: 'Repeat visitor flâneur · D3 · 150 min',
    coverage: 'SUPPORTED',
    coverageNote: 'Discovery posture D3 supported; familiarity facets UNKNOWN',
    request: {
      interests: ['arquitectura', 'arte'],
      rhythm: 'estructurado',
      discoveryPosture: 'D3',
      timeBudgetMinutes: 150,
      useMetro: true,
      startingStgoId: 'STGO_01',
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B04_FOOD_MARKETS',
    label: 'Food markets interest',
    coverage: 'DATA_COVERAGE_LIMITED',
    coverageNote: 'FOOD_MARKETS facet not calibrated on Launch30 Experiences',
    request: {
      interests: ['vida_local'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D2',
      timeBudgetMinutes: 120,
      startingStgoId: 'STGO_01',
      semanticFacets: { FOOD_MARKETS: 1 },
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B05_ARCHITECTURE_VISUAL',
    label: 'Architecture / visual',
    coverage: 'SUPPORTED',
    coverageNote: 'Architecture theme present; facet evidence still UNKNOWN',
    request: {
      interests: ['arquitectura'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D2',
      timeBudgetMinutes: 120,
      startingStgoId: 'STGO_01',
      semanticFacets: { ARCHITECTURE: 1 },
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B06_MEMORY_DETECTIVE',
    label: 'Memory / dictatorship interest',
    coverage: 'DATA_COVERAGE_LIMITED',
    coverageNote: 'MEMORY_DICTATORSHIP requires opt-in + sparse Launch30 evidence',
    request: {
      interests: ['historia'],
      rhythm: 'espontaneo',
      discoveryPosture: 'D3',
      timeBudgetMinutes: 150,
      startingStgoId: 'STGO_01',
      memorySitesOptIn: true,
      semanticFacets: { MEMORY_DICTATORSHIP: 1 },
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B07_FAMILY_YOUNG_KIDS',
    label: 'Family with young kids',
    coverage: 'SUPPORTED',
    coverageNote: 'Party context carried; accessibility/hiking suitability not fabricated',
    request: {
      interests: ['historia'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D1',
      timeBudgetMinutes: 90,
      startingStgoId: 'STGO_01',
      familyContext: true,
      party: { adultCount: 2, childCount: 2, youngChildren: true, familyMode: true },
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B08_OUTDOOR_HIKING',
    label: 'Outdoor hiking',
    coverage: 'DATA_COVERAGE_LIMITED',
    coverageNote: 'OUTDOOR_HIKE activityMode not calibrated on current Launch30 graph',
    request: {
      interests: ['naturaleza'],
      rhythm: 'espontaneo',
      discoveryPosture: 'D3',
      timeBudgetMinutes: 180,
      startingStgoId: 'STGO_01',
      activityMode: 'OUTDOOR_HIKE',
      semanticFacets: { OUTDOOR_HIKING: 1, NATURE_SCENERY: 1 },
    },
  },
  {
    id: 'B09_FIRST_TIMER_NATURE',
    label: 'First-timer nature interest',
    coverage: 'DATA_COVERAGE_LIMITED',
    coverageNote: 'Nature/scenery Experiences sparse in Launch30 core walk graph',
    request: {
      interests: ['naturaleza'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D2',
      timeBudgetMinutes: 120,
      startingStgoId: 'STGO_01',
      semanticFacets: { NATURE_SCENERY: 1 },
      activityMode: 'MIXED',
    },
  },
  {
    id: 'B10_LOCAL_FLANEUR',
    label: 'Local flâneur',
    coverage: 'SUPPORTED',
    coverageNote: 'D3 urban walk supported via legacy adapter',
    request: {
      interests: ['arquitectura', 'vida_local'],
      rhythm: 'estructurado',
      discoveryPosture: 'D3',
      timeBudgetMinutes: 120,
      startingStgoId: 'STGO_01',
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B11_STEP_FREE_HISTORY',
    label: 'Step-free history',
    coverage: 'SUPPORTED',
    coverageNote: 'M2 fail-closed when accessibility evidence insufficient',
    request: {
      interests: ['historia'],
      rhythm: 'equilibrado',
      discoveryPosture: 'D1',
      timeBudgetMinutes: 105,
      startingStgoId: 'STGO_01',
      stepFreeRequired: true,
      activityMode: 'URBAN_WALK',
    },
  },
  {
    id: 'B12_EXPRESS_45',
    label: 'Express 45 min',
    coverage: 'SUPPORTED',
    coverageNote: 'Express preference + short budget',
    request: {
      interests: ['historia'],
      rhythm: 'estructurado',
      discoveryPosture: 'D1',
      timeBudgetMinutes: 45,
      startingStgoId: 'STGO_01',
      expressPreference: true,
      activityMode: 'URBAN_WALK',
    },
  },
]

export function getBenchmark(id: string): AlphaBenchmark | undefined {
  return ALPHA_BENCHMARKS.find((b) => b.id === id)
}
