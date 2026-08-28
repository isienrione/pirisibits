/**
 * Traveler/request-dependent LanePrior.
 * "Before seeing candidates, how appropriate is each route philosophy?"
 * Modest enough that a poor preferred-lane candidate can still lose.
 */

import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import { LANE_PRIOR_INTENT_BLEND, LANE_PRIOR_TABLE } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { round1 } from '@/src/engine/scoring/v0.2/utils'

export function computeLanePrior(request: RouteRequestV01, lane: ComposerLane): number {
  const posture = request.traveler.discoveryPosture
  const express = request.traveler.expressPreference || request.traveler.mobilityArchetype === 'M1'
  const postureTable =
    posture === 'D1'
      ? LANE_PRIOR_TABLE.D1
      : posture === 'D2'
        ? LANE_PRIOR_TABLE.D2
        : posture === 'D3'
          ? LANE_PRIOR_TABLE.D3
          : express
            ? LANE_PRIOR_TABLE.M1
            : LANE_PRIOR_TABLE.BALANCED

  const intentTable =
    request.routeIntent === 'DISCOVERY'
      ? LANE_PRIOR_TABLE.DISCOVERY_INTENT
      : request.routeIntent === 'ESSENTIALS'
        ? LANE_PRIOR_TABLE.ESSENTIALS_INTENT
        : request.routeIntent === 'THEMATIC'
          ? LANE_PRIOR_TABLE.THEMATIC_INTENT
          : LANE_PRIOR_TABLE.BALANCED

  const p = postureTable[lane]
  const i = intentTable[lane]
  if (express && lane !== 'DISCOVERY') {
    const m1 = LANE_PRIOR_TABLE.M1[lane]
    return round1((1 - LANE_PRIOR_INTENT_BLEND) * ((p + m1) / 2) + LANE_PRIOR_INTENT_BLEND * i)
  }
  return round1((1 - LANE_PRIOR_INTENT_BLEND) * p + LANE_PRIOR_INTENT_BLEND * i)
}

export function lanePriorsForRequest(request: RouteRequestV01): Record<ComposerLane, number> {
  return {
    SIGNATURE: computeLanePrior(request, 'SIGNATURE'),
    DISCOVERY: computeLanePrior(request, 'DISCOVERY'),
    FLOW: computeLanePrior(request, 'FLOW'),
  }
}
