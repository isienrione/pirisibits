/**
 * Gate 2E.2E — arbitration types.
 */

import type { ComposerLane, LaneCandidateV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import type { ArcQualityResultV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import type { LegacyBlendWinner } from '@/src/engine/routes/v0.2/arc-quality/blend-diagnostics.v0.2'
import type { LegacyBlendId } from '@/src/engine/routes/v0.2/arc-quality/arc-quality-config.v0.2'

export type ChoiceConfidence =
  | 'CLEAR'
  | 'MODERATE'
  | 'CLOSE_CALL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONSTRAINT_DOMINATED'

export type UserFacingLabel =
  | 'RECOMMENDED_FOR_YOU'
  | 'MORE_DISCOVERIES'
  | 'SMOOTHER_WALK'
  | 'MORE_ESSENTIALS'
  | 'NO_MEANINGFUL_ALTERNATIVE'

export type FeatureScore = {
  value: number | null
  coverage: number
  unknown: boolean
  breakdown: Record<string, number | null>
}

export type CommonRouteFeatures = {
  travelerMatchRoute: FeatureScore
  intrinsicWorthRoute: FeatureScore
  routeMarginalValue: FeatureScore
  arcQuality: FeatureScore
  physicalEfficiency: FeatureScore
  timeFit: FeatureScore
  structuralFit: FeatureScore
  discoveryFit: FeatureScore
  narrativeCoherence: FeatureScore
  routeCoverageConfidence: number
  lanePrior: FeatureScore
}

export type RouteCharacter = {
  essentiality: number | null
  discovery: number | null
  physicalEase: number | null
  narrativeDepth: number | null
  travelerMatch: number | null
}

export type ArbitratedCandidate = {
  originatingLane: ComposerLane | 'H1'
  routeId: string
  candidate: LaneCandidateV02
  arcQuality: ArcQualityResultV02 | null
  features: CommonRouteFeatures
  character: RouteCharacter
  routeChoiceScore: number | null
  routeChoiceCoverage: number
  unknownKeys: string[]
  userFacingLabel: UserFacingLabel | null
  presentedAsAlternative: boolean
}

export type ArbitrationResultV02 = {
  schemaVersion: 'santiago-route-arbitration-result.v0.2'
  arbitrationVersion: string
  routeChoiceScoreVersion: string
  arcQualityVersion: string
  parallelOnly: true
  productionEnabled: false
  recommendedRouteId: string | null
  recommendedLane: ComposerLane | 'H1' | null
  recommended: ArbitratedCandidate | null
  alternatives: ArbitratedCandidate[]
  allCandidates: ArbitratedCandidate[]
  choiceConfidence: ChoiceConfidence
  choiceMargin: number | null
  constraintDominated: boolean
  noMeaningfulAlternative: boolean
  whyWon: string
  whyOthersLost: string[]
  legacyBlends: Record<LegacyBlendId, LegacyBlendWinner>
  notes: string[]
}
