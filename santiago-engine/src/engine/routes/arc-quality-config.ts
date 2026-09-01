/**
 * Gate 2D — centralized ArcQuality + reranker weights (PROVISIONAL V0.1).
 * Conservative balance; no single signal dominates.
 */

export const ARC_QUALITY_GATE = '2D' as const
export const ARC_QUALITY_SOURCE_CHECKPOINT = 'aaa86de94ac5a43e204089ea65c6e77c524e8ba8'

/** Positive ArcQuality component weights (sum = 1.0). */
export const ARC_QUALITY_POSITIVE_WEIGHTS = {
  openingStrength: 0.08,
  developmentStrength: 0.1,
  payoffStrength: 0.09,
  endingStrength: 0.07,
  rhythmBalance: 0.07,
  curiosityContinuity: 0.06,
  themeDiversity: 0.06,
  thematicCoherence: 0.07,
  contrastBalance: 0.05,
  revealSpacing: 0.05,
  anchorDistribution: 0.05,
  structuralVariety: 0.07,
  relationTypeVariety: 0.04,
  questionResolution: 0.06,
  timeUtilization: 0.04,
  routeDistinctiveness: 0.04,
} as const

/** Penalty weights applied after positive blend (each penalty is 0–1). */
export const ARC_QUALITY_PENALTY_WEIGHTS = {
  repetitionPenalty: 0.12,
  unresolvedSetupPenalty: 0.1,
  structuralMonotonyPenalty: 0.1,
  themeMonotonyPenalty: 0.08,
  relationMonotonyPenalty: 0.05,
  weakEndingPenalty: 0.08,
  overstuffingPenalty: 0.07,
  underutilizedBudgetPenalty: 0.09,
  backtrackingPenalty: 0.04,
} as const

/** Final rerank blend: composer provisional score vs arc quality. */
export const RERANK_BLEND_WEIGHTS = {
  composerProvisionalScore: 0.6,
  arcQuality: 0.4,
} as const

/** Soft structural composition bands (descriptive, not hard quotas). */
export const ARC_STRUCTURAL_BANDS = {
  anchorMin: 0.25,
  anchorMax: 0.35,
  pocketMin: 0.25,
  pocketMax: 0.35,
  microMin: 0.3,
  microMax: 0.5,
  /** Consecutive run before monotony penalty ramps up. */
  maxConsecutiveAnchorRun: 3,
  maxConsecutiveMicroRun: 4,
  maxConsecutiveSameRelation: 3,
} as const

/** Time utilization thresholds. */
export const TIME_UTILIZATION_CONFIG = {
  /** Unused budget ratio above which penalty may activate. */
  unusedBudgetPenaltyThreshold: 0.15,
  /** Minimum omitted node utility to count as worthwhile continuation. */
  worthwhileContinuationUtilityMin: 42,
  /** Minimum unused minutes (absolute) before considering penalty. */
  minUnusedMinutesForPenalty: 12,
  /** Target utilization band — slight under-fill is acceptable. */
  idealUtilizationMin: 0.72,
  idealUtilizationMax: 0.98,
} as const

/** Overstuffing heuristics. */
export const OVERSTUFFING_CONFIG = {
  maxStopsPerHour: 5.5,
  minAvgDwellMin: 10,
  maxTransitionDensity: 0.45,
} as const

/** Traveler-sensitive modifiers for coherence vs diversity. */
export const TRAVELER_ARC_MODIFIERS = {
  /** Strong thematic intent — coherence up, diversity down. */
  thematicIntent: { coherence: 1.15, diversity: 0.9 },
  /** D1 Flâneur — diversity and surprise up. */
  discoveryD1: { coherence: 0.92, diversity: 1.18, structuralVariety: 1.1 },
  /** D2 Detective — curiosity continuity up. */
  discoveryD2: { curiosityContinuity: 1.12, questionResolution: 1.1 },
  /** M1 Express — clarity / payoff up, micro variety down. */
  expressM1: { payoffStrength: 1.12, endingStrength: 1.1, structuralVariety: 0.92 },
  /** ESSENTIALS intent — anchor-led preference. */
  essentialsIntent: { openingStrength: 1.08, anchorDistribution: 1.1 },
  /** DISCOVERY intent — pocket/micro rhythm. */
  discoveryIntent: { structuralVariety: 1.08, themeDiversity: 1.06 },
} as const

/** Weak opener / ending thresholds. */
export const ARC_QUALITY_THRESHOLDS = {
  weakOpenerUtilityMax: 38,
  weakEndingUtilityMax: 35,
  weakEndingRelativeToRouteAvg: 0.75,
  minRouteStops: 2,
  maxBudgetOvershootMin: 8,
} as const
