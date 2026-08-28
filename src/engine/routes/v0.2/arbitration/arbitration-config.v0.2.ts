/**
 * Gate 2E.2E — centralized lane-arbitration config (INITIAL HYPOTHESIS).
 *
 * RouteChoiceScore uses intrinsically normalized 0–100 features.
 * Fixture-local min-max is diagnostic only and is NOT used for production-style choice.
 *
 * Lane ComposerScore is excluded from cross-lane RouteChoiceScore.
 */

export const ARBITRATION_VERSION = '0.2.hypothesis.1' as const
export const ARBITRATION_CONFIG_STATUS = 'PROVISIONAL_V0_2_HYPOTHESIS' as const
export const ROUTE_CHOICE_SCORE_VERSION = '0.2.choice.hypothesis.1' as const

/**
 * Personal relevance is the largest common term.
 * ArcQuality improves sequencing but does not dominate personalization.
 * LanePrior guides, does not dictate.
 */
export const ROUTE_CHOICE_WEIGHTS = {
  travelerMatchRoute: 0.3,
  arcQuality: 0.2,
  routeMarginalValue: 0.15,
  physicalEfficiency: 0.12,
  structuralFit: 0.1,
  timeFit: 0.08,
  lanePrior: 0.05,
} as const

export const TRAVELER_MATCH_ROUTE_WEIGHTS = {
  dwellWeightedMean: 0.5,
  lowerTailP20: 0.25,
  themeCoverage: 0.15,
  repetitionBurden: 0.1,
} as const

export const ROUTE_MARGINAL_VALUE_WEIGHTS = {
  qualityWeightedMeanMrv: 0.7,
  progressionBonus: 0.2,
  repetitionBurden: 0.1,
} as const

export const STRUCTURAL_FIT_ROLE_WEIGHTS = {
  BALANCED: { anchorFit: 0.34, pocketFit: 0.33, microRevealFit: 0.33 },
  ESSENTIALS: { anchorFit: 0.55, pocketFit: 0.25, microRevealFit: 0.2 },
  DISCOVERY: { anchorFit: 0.2, pocketFit: 0.4, microRevealFit: 0.4 },
  THEMATIC: { anchorFit: 0.35, pocketFit: 0.35, microRevealFit: 0.3 },
  D1: { anchorFit: 0.18, pocketFit: 0.4, microRevealFit: 0.42 },
  D2: { anchorFit: 0.28, pocketFit: 0.32, microRevealFit: 0.4 },
  D3: { anchorFit: 0.55, pocketFit: 0.25, microRevealFit: 0.2 },
  M1: { anchorFit: 0.5, pocketFit: 0.3, microRevealFit: 0.2 },
} as const

export const DISCOVERY_FIT_WEIGHTS = {
  discoveryDensity: 0.18,
  surprise: 0.14,
  pocketFit: 0.14,
  microRevealFit: 0.14,
  newThemeValue: 0.14,
  structuralNovelty: 0.12,
  redundancy: 0.14,
} as const

export const PHYSICAL_EFFICIENCY_WEIGHTS = {
  dwellShare: 0.25,
  transitionBurden: 0.2,
  longestTransition: 0.15,
  backtracking: 0.15,
  geographicProgression: 0.15,
  metroBurden: 0.1,
} as const

/** Modest priors: a poor preferred-lane candidate can still lose. Scale 0–100. */
export const LANE_PRIOR_TABLE = {
  BALANCED: { SIGNATURE: 72, DISCOVERY: 58, FLOW: 68 },
  D1: { SIGNATURE: 48, DISCOVERY: 82, FLOW: 62 },
  D2: { SIGNATURE: 60, DISCOVERY: 80, FLOW: 58 },
  D3: { SIGNATURE: 84, DISCOVERY: 45, FLOW: 58 },
  M1: { SIGNATURE: 80, DISCOVERY: 40, FLOW: 78 },
  DISCOVERY_INTENT: { SIGNATURE: 50, DISCOVERY: 86, FLOW: 60 },
  ESSENTIALS_INTENT: { SIGNATURE: 86, DISCOVERY: 42, FLOW: 62 },
  THEMATIC_INTENT: { SIGNATURE: 58, DISCOVERY: 58, FLOW: 58 },
} as const

export const LANE_PRIOR_INTENT_BLEND = 0.35

export const CHOICE_CONFIDENCE_THRESHOLDS = {
  /** CLEAR: top meaningfully above next AND sufficient coverage. */
  clearMargin: 6,
  clearCoverage: 0.7,
  /** MODERATE */
  moderateMargin: 3,
  moderateCoverage: 0.55,
  /** CLOSE_CALL: scores nearly equal with enough evidence. */
  closeCallMargin: 3,
  /** INSUFFICIENT_EVIDENCE */
  insufficientCoverage: 0.55,
} as const

export const DEDUP_THRESHOLDS = {
  stopSet: 0.85,
  ordered: 0.8,
  edge: 0.75,
  character: 0.9,
  characterStopSetFloor: 0.7,
} as const

export const LABEL_DELTA = 3

export const CHARACTER_WEIGHTS = {
  essentiality: 1,
  discovery: 1,
  physicalEase: 1,
  narrativeDepth: 1,
  travelerMatch: 1,
} as const
