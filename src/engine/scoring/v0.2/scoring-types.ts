/**
 * Gate 2E.2A — parallel scoring model V0.2 types (non-production).
 */

import type { ThemeCode } from '@/src/lib/city-graph/types'
import type { RouteIntent } from '@/src/engine/routes/route-types'
import type { ArcState } from '@/src/engine/narrative/narrative-types'
import type { TravelerModel } from '@/src/engine/types'

export const SCORING_MODEL_VERSION = '0.2' as const
export const SCORING_CONFIG_VERSION = 'v0.2.provisional.hypothesis.1' as const
export const EDITORIAL_DIMENSIONS_VERSION = 'santiago_editorial_dimensions.proposed.v0.2' as const

export type ScoreConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type ProvenanceClass =
  | 'FOUNDER_PRECALIBRATED'
  | 'FOUNDER_EDITED'
  | 'AI_PROPOSED_UNVERIFIED'
  | 'CURATOR_APPROVED'
  | 'FIELD_VERIFIED'
  | 'PROVIDER_DERIVED'
  | 'DERIVED_FROM_SOURCE'
  | 'UNKNOWN'

export type EditorialDimensionKey =
  | 'essentiality'
  | 'discoveryDensity'
  | 'surprise'
  | 'orientationValue'
  | 'lingerValue'
  | 'visualPayoff'
  | 'storyDepth'
  | 'localness'
  | 'transitionValue'
  | 'senseOfPlace'

export type EditorialDimensionValue = {
  value: number | null
  provenance: ProvenanceClass | string
  confidence: ScoreConfidence
  rationale: string
  whyNotHigher: string
  whyNotLower: string
  evidenceLimitation: string
  evidenceInputs: string[]
  limitations: string[]
  derivationMethod: 'DETERMINISTIC' | 'AI_PROPOSED' | 'FOUNDER_OVERRIDE'
}

export type EditorialDimensionsRecord = {
  stgoId: string
  displayName: string
  dimensions: Partial<Record<EditorialDimensionKey, EditorialDimensionValue>>
}

export type ScoreFactor = {
  key: string
  label: string
  value: number | null
  weight?: number
  contribution: number | null
  provenance?: string
  available: boolean
}

export type ScoreExplanation = {
  scoreName: string
  score: number | null
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'INELIGIBLE'
  coverage: number
  confidence: ScoreConfidence
  topPositiveFactors: ScoreFactor[]
  topNegativeFactors: ScoreFactor[]
  unknownFactors: string[]
  provenanceSummary: string[]
  plainLanguageExplanation: string
  whatThisAddsNow?: string
  whatWouldBeRedundant?: string
  roleNeedBeingFilled?: string
}

export type IntrinsicWorthResult = {
  scoringModelVersion: typeof SCORING_MODEL_VERSION
  raw: number | null
  status: 'AVAILABLE' | 'UNAVAILABLE'
  contributions: {
    heritageDepth: number | null
    anchorDensity: number | null
    microReveal: number | null
    polish: number | null
  }
  inputs: {
    heritageDepth: number | null
    anchorDensity: number | null
    microReveal: number | null
    polish: number | null
  }
  percentileSantiago: number | null
  percentileActiveCorpus: number | null
  coverage: number
  confidence: ScoreConfidence
  explanation: ScoreExplanation
}

export type RoleFitResult = {
  anchorFit: number | null
  pocketFit: number | null
  microRevealFit: number | null
  primaryStructuralRole: 'anchor' | 'pocket' | 'micro' | 'unknown'
  roleAmbiguity: boolean
  coverage: number
  confidence: ScoreConfidence
  explanation: ScoreExplanation
  factors: ScoreFactor[]
}

export type TravelerMatchResult = {
  score: number | null
  coverage: number
  confidence: ScoreConfidence
  components: {
    thematicAffinity: number | null
    discoveryPostureAffinity: number | null
    familiarityAffinity: number | null
    structuralPreference: number | null
    contextAffinity: number | null
  }
  weightedContributions: Record<string, number | null>
  explanation: ScoreExplanation
}

export type BaseNodeValueResult = {
  score: number | null
  coverage: number
  confidence: ScoreConfidence
  components: {
    intrinsicWorth: number | null
    travelerMatch: number | null
    rolePreferenceFit: number | null
  }
  weightedContributions: Record<string, number | null>
  explanation: ScoreExplanation
}

export type MarginalRouteValueResult = {
  score: number | null
  coverage: number
  confidence: ScoreConfidence
  components: {
    newThemeValue: number | null
    structuralNovelty: number | null
    discoveryValue: number | null
    narrativeProgression: number | null
    questionPayoff: number | null
    roleNeedFit: number | null
    geographicProgression: number | null
    redundancy: number | null
  }
  weightedContributions: Record<string, number | null>
  explanation: ScoreExplanation
}

export type TransitionValueResult = {
  score: number | null
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'INELIGIBLE'
  coverage: number
  confidence: ScoreConfidence
  components: {
    narrativeContribution: number | null
    physicalTransitionQuality: number | null
    spatialLegibility: number | null
    prerequisiteSatisfaction: number | null
    transitionBurden: number | null
  }
  explanation: ScoreExplanation
}

export type ScoringVersionMetadata = {
  scoringModelVersion: typeof SCORING_MODEL_VERSION
  scoringConfigVersion: typeof SCORING_CONFIG_VERSION
  editorialDimensionsVersion: typeof EDITORIAL_DIMENSIONS_VERSION
  calibrationVersion: string
  physicalGraphVersion: string
  narrativeGraphVersion: string
}

export type RouteStateContext = {
  arcState: ArcState
  routeSoFarStgoIds: string[]
  routeThemes: ThemeCode[]
  anchorCount: number
  pocketCount: number
  microCount: number
  recentStgoIds: string[]
  routeIntent?: RouteIntent
  prevStgoId?: string | null
  narrativeEdgeScore?: number | null
  transitionDistanceM?: number | null
  transitionDurationMin?: number | null
  transitionFeasible?: boolean
  geographicEvidenceAvailable?: boolean
  bearingReversal?: boolean | null
}

export type NodeScoringContext = {
  stgoId: string
  displayName: string
  traveler: TravelerModel
  routeIntent?: RouteIntent
  familiarity?: 'F1' | 'F2' | 'F3'
  routeState?: RouteStateContext | null
}

export type NodeScoreBundleV02 = {
  metadata: ScoringVersionMetadata
  stgoId: string
  displayName: string
  intrinsicWorth: IntrinsicWorthResult
  travelerMatch: TravelerMatchResult
  roleFit: RoleFitResult
  baseNodeValue: BaseNodeValueResult
  marginalRouteValue: MarginalRouteValueResult | null
  transitionValue: TransitionValueResult | null
  editorialDimensions: Partial<Record<EditorialDimensionKey, EditorialDimensionValue>>
  parallelOnly: true
  banner: 'V0.2 PARALLEL SCORE — NOT USED FOR ROUTE SELECTION'
}
