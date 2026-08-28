/**
 * Gate 2E.2E substrate — H1/H2 composer types.
 */

import type { NodeScoreBundleV02 } from '@/src/engine/scoring/v0.2/scoring-types'
import type { RouteCandidateV01, RouteDiagnostics, RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { LaneObjectiveWeights } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'

export type ComposerLane = 'SIGNATURE' | 'DISCOVERY' | 'FLOW'

export type NextStopValueBreakdown = {
  intrinsicWorth: number | null
  travelerMatch: number | null
  marginalRouteValue: number | null
  transitionValue: number | null
  physicalEfficiency: number | null
  nextStopValue: number | null
  coverage: number
  unknownKeys: string[]
}

export type LaneStopScore = {
  stgoId: string
  nextStop: NextStopValueBreakdown
  bundle: NodeScoreBundleV02
}

/**
 * ComposerScore is a WITHIN-LANE search-quality scalar.
 * Do not compare SIGNATURE vs DISCOVERY vs FLOW ComposerScore as utilities.
 */
export type LaneCandidateV02 = {
  originatingLane: ComposerLane | 'H1'
  composerModelVersion: string
  laneConfigVersion: string
  candidate: RouteCandidateV01
  /** Within-lane search quality (length-normalized mean NextStopValue + time-fit bonus). */
  composerScore: number
  composerScoreIsCrossLaneUtility: false
  stopScores: LaneStopScore[]
  objectiveWeights: LaneObjectiveWeights
  coverage: number
}

export type H2ComposerResultV02 = {
  schemaVersion: 'santiago-route-composer-result.v0.2.h2'
  composerModelVersion: string
  laneConfigVersion: string
  parallelOnly: true
  productionEnabled: false
  request: RouteRequestV01
  requestHash: string
  lanes: Record<ComposerLane, LaneCandidateV02 | null>
  candidates: LaneCandidateV02[]
  diagnostics: RouteDiagnostics & { lanesSearched: ComposerLane[] }
  notes: string[]
}

export type H1ComposerResultV02 = {
  schemaVersion: 'santiago-route-composer-result.v0.2.h1'
  composerModelVersion: string
  parallelOnly: true
  productionEnabled: false
  request: RouteRequestV01
  requestHash: string
  candidates: LaneCandidateV02[]
  diagnostics: RouteDiagnostics
  notes: string[]
}
