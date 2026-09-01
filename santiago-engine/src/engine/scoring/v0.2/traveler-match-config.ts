/**
 * Gate 2E.2A — TravelerMatch V0.2 config (PROVISIONAL HYPOTHESIS).
 */

export const TRAVELER_MATCH_CONFIG_STATUS = 'PROVISIONAL_V0_2_HYPOTHESIS' as const

export const TRAVELER_MATCH_COMPONENT_WEIGHTS = {
  thematicAffinity: 0.50,
  discoveryPostureAffinity: 0.20,
  familiarityAffinity: 0.10,
  structuralPreference: 0.10,
  contextAffinity: 0.10,
} as const

/** D1 Flâneur dimension weights (coverage-aware). */
export const D1_DIMENSION_WEIGHTS = {
  discoveryDensity: 0.30,
  surprise: 0.25,
  localness: 0.20,
  microRevealFit: 0.15,
  pocketFit: 0.10,
} as const

/** D2 Detective dimension weights. */
export const D2_DIMENSION_WEIGHTS = {
  storyDepth: 0.30,
  microRevealFit: 0.25,
  surprise: 0.15,
  discoveryDensity: 0.15,
  essentiality: 0.15,
} as const

/** D3 Collector dimension weights. */
export const D3_DIMENSION_WEIGHTS = {
  essentiality: 0.35,
  anchorFit: 0.30,
  intrinsicWorthNorm: 0.20,
  orientationValue: 0.15,
} as const

export const F1_FAMILIARITY_WEIGHTS = {
  orientationValue: 0.55,
  essentiality: 0.45,
} as const

export const F3_FAMILIARITY_WEIGHTS = {
  surprise: 0.55,
  localness: 0.45,
} as const

export const STRUCTURAL_PREFERENCE_BY_INTENT = {
  ESSENTIALS: { anchor: 0.55, pocket: 0.25, micro: 0.20 },
  DISCOVERY: { anchor: 0.20, pocket: 0.40, micro: 0.40 },
  THEMATIC: { anchor: 0.35, pocket: 0.35, micro: 0.30 },
  BALANCED: { anchor: 0.34, pocket: 0.33, micro: 0.33 },
} as const

export const EXPRESS_STRUCTURAL_BOOST = { anchor: 0.15, orientation: 0.10 } as const
