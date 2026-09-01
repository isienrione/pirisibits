/**
 * H1 V0.2 single-lane composer. Frozen. Not used for cross-lane arbitration.
 */

import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { hashRouteRequest, normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { EngineNodeRecord } from '@/src/engine/types'
import {
  COMPOSER_CONFIG_STATUS,
  COMPOSER_MODEL_VERSION_H1,
  COMPOSER_V02_BANNER,
  H1_OBJECTIVE_WEIGHTS,
  LANE_CONFIG_VERSION,
} from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import type { H1ComposerResultV02, LaneCandidateV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import { createScoringSessionV02 } from '@/src/engine/routes/v0.2/composer/scoring-session.v0.2'
import { prepareLaneSearchContext, searchLaneBestCandidate } from '@/src/engine/routes/v0.2/composer/lane-search.v0.2'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../../../..')

function asRequest(input: RouteRequestInput | RouteRequestV01): RouteRequestV01 {
  return (input as RouteRequestV01).schemaVersion === 'santiago-route-request.v0.1'
    ? (input as RouteRequestV01)
    : normalizeRouteRequest(input as RouteRequestInput)
}

export function composeH1RoutesV02(
  input: RouteRequestInput | RouteRequestV01,
  opts?: { nodes?: EngineNodeRecord[]; candidateCount?: number; root?: string },
): H1ComposerResultV02 {
  const request = asRequest(input)
  const root = opts?.root ?? ROOT
  const nodes = opts?.nodes ?? loadLaunchNodes(root)
  const session = createScoringSessionV02(root)
  const ctx = prepareLaneSearchContext(nodes, request, root)
  const best = searchLaneBestCandidate({
    request,
    ctx,
    session,
    lane: 'H1',
    weights: H1_OBJECTIVE_WEIGHTS,
    composerModelVersion: COMPOSER_MODEL_VERSION_H1,
  })
  const candidates: LaneCandidateV02[] = best ? [best] : []
  return {
    schemaVersion: 'santiago-route-composer-result.v0.2.h1',
    composerModelVersion: COMPOSER_MODEL_VERSION_H1,
    parallelOnly: true,
    productionEnabled: false,
    request,
    requestHash: hashRouteRequest(request),
    candidates,
    diagnostics: {
      eligibleCandidateCount: ctx.eligibilityNotes.filter((n) => n.eligibility.eligible).length,
      physicallyUsableCandidateCount: ctx.physicallyUsableIds.size,
      editorialButPhysicalPending: ctx.editorialButPhysicalPending,
      beamStatesExpanded: 0,
      beamStatesPruned: 0,
    },
    notes: [
      COMPOSER_V02_BANNER,
      COMPOSER_CONFIG_STATUS,
      `laneConfigVersion=${LANE_CONFIG_VERSION}`,
      'H1 is a frozen single-lane V0.2 search. Arbitration uses H2, not H1.',
    ],
  }
}
