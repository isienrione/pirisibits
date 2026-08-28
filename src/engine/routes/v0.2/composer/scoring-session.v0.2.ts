/**
 * Preloaded V0.2 scoring session — same math as evaluateNodeScoreV02, no per-call disk IO.
 */

import { loadSemanticByStgoId } from '@/src/engine/loadCalibration'
import { editorialDimensionsByStgoId } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { computeIntrinsicWorth } from '@/src/engine/scoring/v0.2/intrinsic-worth'
import { computeRoleFit } from '@/src/engine/scoring/v0.2/role-fit'
import { computeTravelerMatch } from '@/src/engine/scoring/v0.2/traveler-match'
import { computeBaseNodeValue } from '@/src/engine/scoring/v0.2/base-node-value'
import { computeMarginalRouteValue } from '@/src/engine/scoring/v0.2/marginal-route-value'
import { computeTransitionValue } from '@/src/engine/scoring/v0.2/transition-value'
import {
  scoringVersionMetadata,
} from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import type {
  EditorialDimensionsRecord,
  NodeScoreBundleV02,
  NodeScoringContext,
} from '@/src/engine/scoring/v0.2/scoring-types'
import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'

export type ScoringSessionV02 = {
  root: string
  semanticById: Map<string, SemanticCalibrationRecord>
  editorialById: Map<string, EditorialDimensionsRecord>
  evaluate: (ctx: NodeScoringContext) => NodeScoreBundleV02 | null
}

export function createScoringSessionV02(root: string): ScoringSessionV02 {
  const semanticById = loadSemanticByStgoId(root)
  const editorialById = editorialDimensionsByStgoId(root)
  const allRecords = [...semanticById.values()]
  const launchIds = new Set(allRecords.filter((r) => r.launchCorpus).map((r) => r.stgoId))
  const metadata = scoringVersionMetadata(root)

  function evaluate(ctx: NodeScoringContext): NodeScoreBundleV02 | null {
    const semantic = semanticById.get(ctx.stgoId)
    if (!semantic) return null
    const editorial = editorialById.get(ctx.stgoId)
    const intrinsic = computeIntrinsicWorth(semantic, {
      allRecords,
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
      ctx.routeState && ctx.routeState.prevStgoId ? computeTransitionValue(ctx.routeState) : null

    return {
      metadata,
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

  return { root, semanticById, editorialById, evaluate }
}
