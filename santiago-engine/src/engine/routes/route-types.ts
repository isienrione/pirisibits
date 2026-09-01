/**
 * Gate 2C — provisional route composer contracts.
 */

import type { ThemeCode } from '@/src/lib/city-graph/types'
import type { ArcState, NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import type {
  EligibilityResult,
  NodeUtilityResult,
  ScoreComponent,
  TravelerModel,
} from '@/src/engine/types'
import type { DiscoveryPostureCode } from '@/src/engine/taxonomy'

export type TransportPolicy = 'WALK_ONLY' | 'WALK_METRO'
export type RouteIntent = 'BALANCED' | 'ESSENTIALS' | 'DISCOVERY' | 'THEMATIC'

export type RouteStart =
  | { kind: 'STGO_ID'; stgoId: string }
  | { kind: 'COORDINATE'; lat: number; lng: number; provenance?: string }
  | { kind: 'UNSUPPORTED'; reason: string }

export type RouteRequestV01 = {
  schemaVersion: 'santiago-route-request.v0.1'
  traveler: TravelerModel
  start: RouteStart
  timeBudgetMin: number
  transportPolicy: TransportPolicy
  routeIntent: RouteIntent
  preferredThemes?: ThemeCode[]
  avoidThemes?: ThemeCode[]
  desiredStopCount?: number | null
  nightContext?: boolean
  familyContext?: boolean
  stepFreeRequired?: boolean
  highComfort?: boolean
  memorySitesOptIn?: boolean
}

export type PhysicalTransitionMode = 'WALK' | 'METRO' | 'START'

export type PhysicalTransition = {
  mode: PhysicalTransitionMode
  fromStgoId: string | null
  toStgoId: string
  durationMin: number
  distanceM: number | null
  metroLineIds: string[]
  transferCount: number
  policyFrictionMin: number
  scheduledMetroMin: number
  walkAccessMin: number
  explanation: string
  edgeRefs: string[]
}

export type RouteStopV01 = {
  stgoId: string
  name: string
  sequenceIndex: number
  tier: string | null
  editorialRole: string | null
  nodeUtility: number
  nodeUtilityBreakdown: {
    editorial: ScoreComponent
    interests: ScoreComponent
    structural: ScoreComponent
    discovery: ScoreComponent
    context: ScoreComponent
  }
  yourMatch: number
  arrivalMode: PhysicalTransitionMode
  transition: PhysicalTransition | null
  transitionTimeMin: number
  estimatedDwellMin: number
  dwellProvenance: string
  cumulativeTimeMin: number
  narrativeRelationFromPrevious: NarrativeRelationType | null
  narrativeEdgeScore: number | null
  narrativeEdgeId: string | null
  arcStateAfter: ArcState
  inclusionExplanation: string
  eligibilityWarnings: string[]
}

export type OmittedNodeReason = {
  stgoId: string
  displayName: string | null
  nodeUtility: number | null
  reasonCode:
    | 'PHYSICAL_STATUS_PENDING'
    | 'PHYSICAL_INELIGIBLE'
    | 'EXCEEDS_REMAINING_BUDGET'
    | 'POOR_SEQUENCE_FIT'
    | 'REDUNDANT_WITH_SELECTED'
    | 'ACCESSIBILITY_CONSTRAINT'
    | 'SENSITIVE_MEMORY_OPT_IN_MISSING'
    | 'EXCESSIVE_DETOUR'
    | 'COMPOSITION_IMBALANCE'
    | 'RUNTIME_EXCLUDED'
    | 'HARD_ELIGIBILITY'
    | 'NO_FEASIBLE_TRANSITION'
    | 'NOT_EXPANDED_IN_BEAM'
  message: string
}

export type ProvisionalRouteScoreBreakdown = {
  nodeUtilityAvg: number
  narrativeAvg: number
  compositionFit: number
  arcSignal: number
  timeFit: number
  physicalEfficiency: number
  repetitionPenalty: number
  detourPenalty: number
  constraintRiskPenalty: number
  total: number
}

export type RouteCandidateV01 = {
  routeId: string
  rank: number
  status: 'OK' | 'PARTIAL' | 'INFEASIBLE'
  calibrationStatus: 'PROVISIONAL'
  calibrationApproved: false
  engineUsingProvisionalEditorialCalibration: true
  routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION'
  physicalRouteGenerationEnabled: false
  travelerSnapshot: TravelerModel
  requestSnapshot: RouteRequestV01
  requestHash: string
  inputVersions: RouteInputVersions
  orderedStops: RouteStopV01[]
  totalEstimatedMin: number
  dwellMin: number
  movementMin: number
  timeBudgetMin: number
  budgetDeltaMin: number
  stopCount: number
  anchorCount: number
  thematicPocketCount: number
  microRevealCount: number
  dominantThemes: ThemeCode[]
  themeCoverage: ThemeCode[]
  physicalDistanceM: number | null
  metroUse: { used: boolean; lineIds: string[]; transferCount: number }
  provisionalRouteScore: number
  scoreBreakdown: ProvisionalRouteScoreBreakdown
  warnings: string[]
  assumptions: string[]
  omittedHighUtilityNodes: OmittedNodeReason[]
  tradeoffExplanation: string
  diagnostics?: RouteDiagnostics
}

export type RouteInputVersions = {
  gate: '2C'
  sourceCheckpointSha: string
  launchCorpusArtifact: string
  editorialCalibrationArtifact: string
  narrativeGraphArtifact: string
  pedestrianAdjacencyArtifact: string
  multimodalGraphArtifact: string
  engineNodesArtifact: string
  narrativeGraphCalibrationStatus: 'PROVISIONAL'
  curatorApproved: false
}

export type RouteDiagnostics = {
  eligibleCandidateCount: number
  physicallyUsableCandidateCount: number
  editorialButPhysicalPending: string[]
  beamStatesExpanded: number
  beamStatesPruned: number
}

export type RouteComposerResultV01 = {
  schemaVersion: 'santiago-route-composer-result.v0.1'
  gate: '2C'
  calibrationStatus: 'PROVISIONAL'
  calibrationApproved: false
  engineUsingProvisionalEditorialCalibration: true
  routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION'
  physicalRouteGenerationEnabled: false
  request: RouteRequestV01
  requestHash: string
  inputVersions: RouteInputVersions
  candidates: RouteCandidateV01[]
  pairwiseSimilarity: Array<{ a: string; b: string; similarity: number }>
  diagnostics: RouteDiagnostics
  notes: string[]
}

export type RouteIntentProfile = {
  intent: RouteIntent
  discoveryPostureHint?: DiscoveryPostureCode
  preferMicro: boolean
  preferAnchors: boolean
  narrativeBoost: number
  efficiencyBoost: number
}

export type EligibilityGateNote = {
  stgoId: string
  eligibility: EligibilityResult
  utility: NodeUtilityResult | null
  physicallyUsable: boolean
  editorialButPhysicalPending: boolean
}
