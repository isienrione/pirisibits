/**
 * Gate 2E.2A — BaseNodeValue V0.2.
 */

import type { BaseNodeValueResult, IntrinsicWorthResult, RoleFitResult, TravelerMatchResult } from '@/src/engine/scoring/v0.2/scoring-types'
import { BASE_NODE_VALUE_WEIGHTS, SCORING_CONFIG_STATUS } from '@/src/engine/scoring/v0.2/scoring-config'
import { computeRolePreferenceFit } from '@/src/engine/scoring/v0.2/role-fit'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import { isKnown, round1, weightedMean } from '@/src/engine/scoring/v0.2/utils'
import type { RouteIntent } from '@/src/engine/routes/route-types'

export function computeBaseNodeValue(args: {
  intrinsic: IntrinsicWorthResult
  travelerMatch: TravelerMatchResult
  roleFit: RoleFitResult
  routeIntent?: RouteIntent
}): BaseNodeValueResult {
  const rolePref = computeRolePreferenceFit(args.roleFit, args.routeIntent ?? 'BALANCED')
  const components = {
    intrinsicWorth: args.intrinsic.raw,
    travelerMatch: args.travelerMatch.score,
    rolePreferenceFit: rolePref,
  }

  const wm = weightedMean([
    { value: components.intrinsicWorth, weight: BASE_NODE_VALUE_WEIGHTS.intrinsicWorth },
    { value: components.travelerMatch, weight: BASE_NODE_VALUE_WEIGHTS.travelerMatch },
    { value: components.rolePreferenceFit, weight: BASE_NODE_VALUE_WEIGHTS.rolePreferenceFit },
  ])

  const weightedContributions = {
    intrinsicWorth: isKnown(components.intrinsicWorth)
      ? round1(components.intrinsicWorth! * BASE_NODE_VALUE_WEIGHTS.intrinsicWorth)
      : null,
    travelerMatch: isKnown(components.travelerMatch)
      ? round1(components.travelerMatch! * BASE_NODE_VALUE_WEIGHTS.travelerMatch)
      : null,
    rolePreferenceFit: isKnown(components.rolePreferenceFit)
      ? round1(components.rolePreferenceFit! * BASE_NODE_VALUE_WEIGHTS.rolePreferenceFit)
      : null,
  }

  const explanation = buildExplanation({
    scoreName: 'BaseNodeValue',
    score: wm.score,
    coverage: wm.coverage,
    provenance: [SCORING_CONFIG_STATUS],
    plain: `BaseNodeValue ${wm.score ?? 'UNAVAILABLE'} = ${BASE_NODE_VALUE_WEIGHTS.intrinsicWorth}·IW + ${BASE_NODE_VALUE_WEIGHTS.travelerMatch}·TM + ${BASE_NODE_VALUE_WEIGHTS.rolePreferenceFit}·RolePref (pre-sequence only).`,
  })

  return {
    score: wm.score,
    coverage: wm.coverage,
    confidence: explanation.confidence,
    components,
    weightedContributions,
    explanation,
  }
}
