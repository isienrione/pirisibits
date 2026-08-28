/**
 * Gate 2B — named NarrativeEdgeScore weights and generation thresholds.
 * No unexplained magic numbers in scorers.
 */

import type { NarrativeEdgeScoreComponents } from '@/src/engine/narrative/narrative-types'

/** Weights sum conceptually to 1.0 (penalty weight applied subtractively). */
export const NARRATIVE_EDGE_SCORE_WEIGHTS: Record<keyof NarrativeEdgeScoreComponents, number> = {
  semanticContinuity: 0.22,
  causalContinuity: 0.1,
  contrastSurprise: 0.12,
  revealValue: 0.12,
  escalationDeepening: 0.1,
  reliefValue: 0.08,
  spatialLegibility: 0.12,
  prerequisiteSatisfaction: 0.08,
  repetitionPenalty: 0.06,
}

/** Bounded score domain for NarrativeEdgeScore total. */
export const NARRATIVE_EDGE_SCORE_MIN = 0
export const NARRATIVE_EDGE_SCORE_MAX = 100

/** Keep graph sparse: max outgoing runtime-eligible proposals considered per node before ranking. */
export const MAX_OUTGOING_CANDIDATES_PER_NODE = 8

/** After ranking, keep at most this many outgoing edges per node. */
export const MAX_OUTGOING_EDGES_PER_NODE = 5

/** Minimum total score for runtime-eligible thematic/spatial edges. */
export const RUNTIME_EDGE_SCORE_FLOOR = 28

/** Spatial walk thresholds (meters) for legibility bands. */
export const SPATIAL_EXCELLENT_M = 400
export const SPATIAL_GOOD_M = 900
export const SPATIAL_FAIR_M = 1600

/** Theme similarity thresholds. */
export const THEME_SIMILARITY_ECHO = 0.55
export const THEME_SIMILARITY_SETUP = 0.4
export const THEME_CONTRAST_MAX_SIM = 0.35

/** Structural delta thresholds (0–1 metric space). */
export const STRUCTURAL_CONTRAST_DELTA = 0.35
export const REVEAL_MICRO_MIN = 0.55
export const RELIEF_POLISH_DROP = 0.3

export const RECENT_RELATION_WINDOW = 3
export const RECENT_POI_WINDOW = 5
export const ARC_EMOTIONAL_CLAMP = { min: 0, max: 1 } as const

export const GATE_2B_SOURCE_CHECKPOINT = '2aef38789f095929b5ae189075a924069cff9576'
