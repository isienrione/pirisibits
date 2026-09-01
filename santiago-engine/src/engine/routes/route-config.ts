/**
 * Gate 2C — centralized provisional route composer configuration.
 * No unexplained magic numbers in search/scoring code.
 */

export const ROUTE_COMPOSER_GATE = '2C' as const
export const ROUTE_COMPOSER_SOURCE_CHECKPOINT = 'b99ca18f74a9b3aa1e2d000d510f7b3f46e52fe4'

/** Beam / expansion */
export const ROUTE_SEARCH_CONFIG = {
  beamWidth: 24,
  maxStops: 10,
  minStops: 2,
  candidateExpansionLimit: 12,
  maxWalkChunkMin: 35,
  timeToleranceMin: 8,
  defaultCandidateCount: 3,
  maxMetroRideLegs: 8,
  maxMetroAssistedMin: 45,
} as const

/** Incremental provisional route score weights (sum ≈ 1.0 for positive terms). */
export const ROUTE_SCORE_WEIGHTS = {
  nodeUtility: 0.34,
  narrative: 0.22,
  composition: 0.12,
  arcSignal: 0.08,
  timeFit: 0.12,
  physicalEfficiency: 0.12,
  repetitionPenalty: 0.08,
  detourPenalty: 0.06,
  constraintRiskPenalty: 0.05,
} as const

/** Soft composition target bands (not hard quotas). */
export const COMPOSITION_BANDS = {
  anchorMin: 0.2,
  anchorMax: 0.4,
  pocketMin: 0.2,
  pocketMax: 0.4,
  microMin: 0.25,
  microMax: 0.55,
  consecutiveAnchorPenalty: 0.35,
  consecutiveMicroPenalty: 0.25,
  identicalThemePenalty: 0.2,
  repeatedRelationPenalty: 0.18,
} as const

/** Diversity selection */
export const DIVERSITY_CONFIG = {
  jaccardWeight: 0.45,
  prefixWeight: 0.35,
  edgeWeight: 0.2,
  maxPairwiseSimilarity: 0.72,
  diversityPenaltyScale: 0.35,
} as const

export const OPERATIONAL_METRO_LINES = ['L1', 'L2', 'L3', 'L4', 'L4A', 'L5', 'L6'] as const
export const FORBIDDEN_METRO_LINES = ['L7'] as const

export const DEFAULT_DWELL_FALLBACK_MIN = 12
export const ASSUMPTION_VISIT_TIME_PROVENANCE = 'AI_PROPOSED_UNVERIFIED'
