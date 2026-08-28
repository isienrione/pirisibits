/**
 * H2 V0.2 multi-lane composer: SIGNATURE, DISCOVERY, FLOW.
 * One strong candidate per lane. Frozen lane weights. Parallel only.
 */

import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { hashRouteRequest, normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { EngineNodeRecord } from '@/src/engine/types'
import {
  COMPOSER_CONFIG_STATUS,
  COMPOSER_MODEL_VERSION_H2,
  COMPOSER_V02_BANNER,
  LANE_CONFIG_VERSION,
  LANE_OBJECTIVE_WEIGHTS,
} from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import type {
  ComposerLane,
  H2ComposerResultV02,
  LaneCandidateV02,
} from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import { createScoringSessionV02 } from '@/src/engine/routes/v0.2/composer/scoring-session.v0.2'
import { prepareLaneSearchContext, searchLaneBestCandidate } from '@/src/engine/routes/v0.2/composer/lane-search.v0.2'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../../../..')

const LANES: ComposerLane[] = ['SIGNATURE', 'DISCOVERY', 'FLOW']

function asRequest(input: RouteRequestInput | RouteRequestV01): RouteRequestV01 {
  return (input as RouteRequestV01).schemaVersion === 'santiago-route-request.v0.1'
    ? (input as RouteRequestV01)
    : normalizeRouteRequest(input as RouteRequestInput)
}

export function composeH2RoutesV02(
  input: RouteRequestInput | RouteRequestV01,
  opts?: { nodes?: EngineNodeRecord[]; root?: string },
): H2ComposerResultV02 {
  const request = asRequest(input)
  const root = opts?.root ?? ROOT
  const nodes = opts?.nodes ?? loadLaunchNodes(root)
  const session = createScoringSessionV02(root)
  const ctx = prepareLaneSearchContext(nodes, request, root)

  const lanes: Record<ComposerLane, LaneCandidateV02 | null> = {
    SIGNATURE: null,
    DISCOVERY: null,
    FLOW: null,
  }

  for (const lane of LANES) {
    lanes[lane] = searchLaneBestCandidate({
      request,
      ctx,
      session,
      lane,
      weights: LANE_OBJECTIVE_WEIGHTS[lane],
      composerModelVersion: COMPOSER_MODEL_VERSION_H2,
    })
  }

  const candidates = LANES.map((l) => lanes[l]).filter((c): c is LaneCandidateV02 => c != null)

  return {
    schemaVersion: 'santiago-route-composer-result.v0.2.h2',
    composerModelVersion: COMPOSER_MODEL_VERSION_H2,
    laneConfigVersion: LANE_CONFIG_VERSION,
    parallelOnly: true,
    productionEnabled: false,
    request,
    requestHash: hashRouteRequest(request),
    lanes,
    candidates,
    diagnostics: {
      eligibleCandidateCount: ctx.eligibilityNotes.filter((n) => n.eligibility.eligible).length,
      physicallyUsableCandidateCount: ctx.physicallyUsableIds.size,
      editorialButPhysicalPending: ctx.editorialButPhysicalPending,
      beamStatesExpanded: 0,
      beamStatesPruned: 0,
      lanesSearched: [...LANES],
    },
    notes: [
      COMPOSER_V02_BANNER,
      COMPOSER_CONFIG_STATUS,
      'ComposerScore is within-lane search quality, not a cross-lane utility.',
      'Final recommendation is produced by lane-neutral arbitration (Gate 2E.2E).',
    ],
  }
}
