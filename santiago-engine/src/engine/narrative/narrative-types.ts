/**
 * Gate 2B — Provisional Narrative Graph V0.1 types.
 * Pair/edge value only. Does not compose traveler routes.
 */

import type { ThemeCode } from '@/src/lib/city-graph/types'

export type NarrativeRelationType =
  | 'sets_up'
  | 'deepens_context'
  | 'causal_followup'
  | 'contrast'
  | 'reveal'
  | 'escalation'
  | 'relief'
  | 'resolves_question'
  | 'thematic_echo'
  | 'material_transition'
  | 'social_transition'

export type NarrativeProvenance =
  | 'FOUNDER_PRECALIBRATED'
  | 'FOUNDER_EDITED'
  | 'AI_PROPOSED_UNVERIFIED'
  | 'CURATOR_APPROVED'
  | 'UNKNOWN'

export type NarrativeConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type NarrativeEdgeScoreComponents = {
  semanticContinuity: number | null
  causalContinuity: number | null
  contrastSurprise: number | null
  revealValue: number | null
  escalationDeepening: number | null
  reliefValue: number | null
  spatialLegibility: number | null
  prerequisiteSatisfaction: number | null
  repetitionPenalty: number | null
}

export type NarrativeEdgeScoreResult = {
  total: number
  components: NarrativeEdgeScoreComponents
  weights: Record<keyof NarrativeEdgeScoreComponents, number>
  explanation: string
  positiveFactors: string[]
  negativeFactors: string[]
  unavailableComponents: Array<keyof NarrativeEdgeScoreComponents>
}

export type NarrativeEdgeExplainability = {
  whyLinked: string
  whyThisRelationType: string
  positiveFactors: string[]
  negativeFactors: string[]
  confidence: NarrativeConfidence
  provenance: NarrativeProvenance
  scoreBreakdown: NarrativeEdgeScoreResult
}

export type NarrativeEdge = {
  edgeId: string
  from: string
  to: string
  relationType: NarrativeRelationType
  strength: number
  themesSupported: ThemeCode[]
  narrativeHooksSupported: string[]
  reason: string
  provenance: NarrativeProvenance
  confidence: NarrativeConfidence
  prerequisites: string[]
  antiRepetitionTags: string[]
  optionalQuestionOpened: string | null
  optionalQuestionResolved: string | null
  runtimeEligible: boolean
  runtimeExclusionReason: string | null
  physicalStatusFrom: string | null
  physicalStatusTo: string | null
  physicalRouteGenerationEligibleFrom: boolean | null
  physicalRouteGenerationEligibleTo: boolean | null
  /** Narrative desirability never implies physical feasibility. */
  narrativeDoesNotImplyPhysicalFeasibility: true
  spatialDistanceM: number | null
  spatialDurationMin: number | null
  score: NarrativeEdgeScoreResult
  explainability: NarrativeEdgeExplainability
  semanticLimitations?: string[]
}

export type NarrativeNodeSummary = {
  stgoId: string
  displayName: string
  canonicalName: string | null
  tier: string | null
  editorialRole: string | null
  thematicVectorProvenance: string
  structuralMetricsProvenance: string
  thematicAvailability: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
  structuralAvailability: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
  physicalStatus: string | null
  physicalRouteGenerationEligible: boolean | null
  launchCorpus: true
  inventoryProvenance: 'ORIGINAL_103_SEED' | 'FOUNDER_EXTENSION'
  legacyAliasAuditOnly: string | null
}

export type ArcState = {
  themesSeen: ThemeCode[]
  themesDominant: ThemeCode[]
  questionsOpened: string[]
  questionsResolved: string[]
  relationTypesRecentlyUsed: NarrativeRelationType[]
  emotionalIntensity: number
  revealCount: number
  anchorCount: number
  microRevealCount: number
  lastNarrativeHook: string | null
  recentPOIs: string[]
  repetitionTagsSeen: string[]
  lastRelationType: NarrativeRelationType | null
  routeStepIndex: number
}

export type ArcSignalSnapshot = {
  openingStrength: number
  developmentStrength: number
  payoffStrength: number
  rhythmBalance: number
  curiosityContinuity: number
  themeDiversity: number
  repetitionPenalty: number
  unresolvedSetupPenalty: number
  contrastBalance: number
  revealSpacing: number
  anchorDistribution: number
  /** Explicit: not a final ArcQuality score. */
  arcQualityComplete: false
}

export type NarrativeGraphArtifact = {
  schemaVersion: 'santiago-launch30-narrative-graph.proposed.v0.1'
  gate: '2B'
  status: 'PROPOSED'
  calibrationStatus: 'PROVISIONAL'
  calibrationApproved: false
  engineUsingProvisionalEditorialCalibration: true
  physicalRouteGenerationEnabled: false
  sourceCheckpointSha: string
  launchCorpusArtifact: string
  editorialCalibrationArtifact: string
  nodeCount: number
  edgeCount: number
  runtimeEligibleEdgeCount: number
  nonRuntimePendingEvidenceCount: number
  nodes: NarrativeNodeSummary[]
  edges: NarrativeEdge[]
  qa: NarrativeGraphQa
  notes: string[]
}

export type NarrativeGraphQa = {
  averageOutgoingDegree: number
  medianOutgoingDegree: number
  relationTypeDistribution: Record<string, number>
  confidenceDistribution: Record<string, number>
  provenanceDistribution: Record<string, number>
  isolatedNarrativeNodes: string[]
  withheldUnsupportedCausalEdges: number
  top10StrongestEdges: Array<{
    edgeId: string
    from: string
    to: string
    relationType: NarrativeRelationType
    total: number
    summary: string
  }>
  bottomRuntimeEligibleScore: number | null
  runtimeEligibleEdgeCount: number
  nonRuntimePendingEvidenceCount: number
}
