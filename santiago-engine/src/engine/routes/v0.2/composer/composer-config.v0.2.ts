/**
 * Gate 2E.2E substrate — H1/H2 multi-lane composer config (FROZEN HYPOTHESIS).
 *
 * Lane-specific ComposerScore is a WITHIN-LANE search objective.
 * It is NOT a cross-lane utility and MUST NOT dominate arbitration.
 *
 * These weights are the initial V0.2 contract hypothesis from
 * docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md §K.
 * This gate does not retune them.
 */

import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'

export const COMPOSER_MODEL_VERSION_H1 = '0.2.h1.hypothesis.1' as const
export const COMPOSER_MODEL_VERSION_H2 = '0.2.h2.hypothesis.1' as const
export const LANE_CONFIG_VERSION = 'v0.2.lane.hypothesis.1' as const
export const COMPOSER_CONFIG_STATUS = 'PROVISIONAL_V0_2_HYPOTHESIS_FROZEN' as const

/** Expansion-term weights. Each lane sums to 1.0. */
export type LaneObjectiveWeights = {
  intrinsicWorth: number
  travelerMatch: number
  marginalRouteValue: number
  transitionValue: number
  physicalEfficiency: number
}

export const LANE_OBJECTIVE_WEIGHTS: Record<ComposerLane, LaneObjectiveWeights> = {
  SIGNATURE: {
    intrinsicWorth: 0.25,
    travelerMatch: 0.25,
    marginalRouteValue: 0.2,
    transitionValue: 0.15,
    physicalEfficiency: 0.15,
  },
  DISCOVERY: {
    intrinsicWorth: 0.1,
    travelerMatch: 0.3,
    marginalRouteValue: 0.35,
    transitionValue: 0.15,
    physicalEfficiency: 0.1,
  },
  FLOW: {
    intrinsicWorth: 0.15,
    travelerMatch: 0.2,
    marginalRouteValue: 0.2,
    transitionValue: 0.2,
    physicalEfficiency: 0.25,
  },
}

/**
 * H1 unified single-lane objective (not an average of H2 lanes).
 * Frozen; unused by cross-lane arbitration.
 */
export const H1_OBJECTIVE_WEIGHTS: LaneObjectiveWeights = {
  intrinsicWorth: 0.2,
  travelerMatch: 0.25,
  marginalRouteValue: 0.25,
  transitionValue: 0.15,
  physicalEfficiency: 0.15,
}

export const COMPOSER_V02_BANNER =
  'V0.2 PARALLEL COMPOSER — NOT USED FOR PRODUCTION ROUTE SELECTION' as const
