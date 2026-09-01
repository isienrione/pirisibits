/**
 * Gate 2E.2A — evaluate parallel V0.2 node scoring bundle.
 */

import { resolve } from 'node:path'
import { loadSemanticByStgoId } from '@/src/engine/loadCalibration'
import { editorialDimensionsByStgoId } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { computeIntrinsicWorth } from '@/src/engine/scoring/v0.2/intrinsic-worth'
import { computeRoleFit } from '@/src/engine/scoring/v0.2/role-fit'
import { computeTravelerMatch } from '@/src/engine/scoring/v0.2/traveler-match'
import { computeBaseNodeValue } from '@/src/engine/scoring/v0.2/base-node-value'
import { computeMarginalRouteValue } from '@/src/engine/scoring/v0.2/marginal-route-value'
import { computeTransitionValue } from '@/src/engine/scoring/v0.2/transition-value'
import {
  EDITORIAL_DIMENSIONS_VERSION,
  SCORING_CONFIG_VERSION,
  SCORING_MODEL_VERSION,
  type NodeScoreBundleV02,
  type NodeScoringContext,
  type ScoringVersionMetadata,
} from '@/src/engine/scoring/v0.2/scoring-types'

const ROOT = resolve(__dirname, '../../..')

export function scoringVersionMetadata(root = ROOT): ScoringVersionMetadata {
  return {
    scoringModelVersion: SCORING_MODEL_VERSION,
    scoringConfigVersion: SCORING_CONFIG_VERSION,
    editorialDimensionsVersion: EDITORIAL_DIMENSIONS_VERSION,
    calibrationVersion: 'santiago-semantic-calibration.v0.1',
    physicalGraphVersion: '0.1',
    narrativeGraphVersion: '0.1',
  }
}

export function evaluateNodeScoreV02(ctx: NodeScoringContext, root = ROOT): NodeScoreBundleV02 | null {
  const semanticById = loadSemanticByStgoId(root)
  const editorialById = editorialDimensionsByStgoId(root)
  const semantic = semanticById.get(ctx.stgoId)
  if (!semantic) return null

  const editorial = editorialById.get(ctx.stgoId)
  const launchIds = new Set(
    [...semanticById.values()].filter((r) => r.launchCorpus).map((r) => r.stgoId),
  )

  const intrinsic = computeIntrinsicWorth(semantic, {
    allRecords: [...semanticById.values()],
    activeCorpusIds: launchIds,
  })
  const roleFit = computeRoleFit(semantic, editorial)
  const travelerMatch = computeTravelerMatch({
    semantic,
    editorial,
    traveler: ctx.traveler,
    roleFit,
    intrinsicRaw: intrinsic.raw,
    routeIntent: ctx.routeIntent,
    familiarity: ctx.familiarity ?? 'F1',
  })
  const baseNodeValue = computeBaseNodeValue({
    intrinsic,
    travelerMatch,
    roleFit,
    routeIntent: ctx.routeIntent,
  })

  const marginalRouteValue = ctx.routeState
    ? computeMarginalRouteValue({
        semantic,
        editorial,
        roleFit,
        traveler: ctx.traveler,
        routeState: ctx.routeState,
      })
    : null

  const transitionValue =
    ctx.routeState && ctx.routeState.prevStgoId
      ? computeTransitionValue(ctx.routeState)
      : null

  return {
    metadata: scoringVersionMetadata(root),
    stgoId: ctx.stgoId,
    displayName: semantic.displayName ?? ctx.displayName,
    intrinsicWorth: intrinsic,
    travelerMatch,
    roleFit,
    baseNodeValue,
    marginalRouteValue,
    transitionValue,
    editorialDimensions: editorial?.dimensions ?? {},
    parallelOnly: true,
    banner: 'V0.2 PARALLEL SCORE — NOT USED FOR ROUTE SELECTION',
  }
}
