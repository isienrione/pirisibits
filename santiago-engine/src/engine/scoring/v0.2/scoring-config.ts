/**
 * Gate 2E.2A — centralized V0.2 scoring config (PROVISIONAL HYPOTHESIS).
 */

export const SCORING_CONFIG_STATUS = 'PROVISIONAL_V0_2_HYPOTHESIS' as const

export const INTRINSIC_WORTH_WEIGHTS = {
  heritageDepth: 0.35,
  anchorDensity: 0.30,
  microReveal: 0.20,
  polish: 0.15,
} as const

export const BASE_NODE_VALUE_WEIGHTS = {
  intrinsicWorth: 0.25,
  travelerMatch: 0.55,
  rolePreferenceFit: 0.20,
} as const

export const MARGINAL_ROUTE_VALUE_WEIGHTS = {
  newThemeValue: 0.15,
  structuralNovelty: 0.15,
  discoveryValue: 0.15,
  narrativeProgression: 0.15,
  questionPayoff: 0.10,
  roleNeedFit: 0.20,
  geographicProgression: 0.10,
  redundancyPenalty: 0.25,
} as const

export const TRANSITION_VALUE_WEIGHTS = {
  narrative: 0.35,
  physicalQuality: 0.25,
  spatialLegibility: 0.15,
  prerequisite: 0.15,
  burden: 0.10,
} as const

export const ROLE_AMBIGUITY_DELTA = 0.12

export const RECENT_ROUTE_WINDOW = 4

export const THEMATIC_DEEP_DIVE_ATTENUATION = 0.45
