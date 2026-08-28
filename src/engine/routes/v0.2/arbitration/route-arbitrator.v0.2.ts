/**
 * Lane-neutral route arbitrator.
 *
 * ComposerScore is within-lane search quality and is excluded from RouteChoiceScore.
 */

import { blendKnown } from '@/src/engine/routes/v0.2/coverage-blend'
import { round1 } from '@/src/engine/scoring/v0.2/utils'
import type { LaneCandidateV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { ArcQualityResultV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import { tryComputeArcQualityV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import { ARC_QUALITY_VERSION_V02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality-config.v0.2'
import { runLegacyBlendExperiment } from '@/src/engine/routes/v0.2/arc-quality/blend-diagnostics.v0.2'
import {
  ARBITRATION_CONFIG_STATUS,
  ARBITRATION_VERSION,
  ROUTE_CHOICE_SCORE_VERSION,
  ROUTE_CHOICE_WEIGHTS,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type {
  ArbitratedCandidate,
  ArbitrationResultV02,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import {
  characterFromFeatures,
  computeCommonRouteFeatures,
} from '@/src/engine/routes/v0.2/arbitration/route-common-features.v0.2'
import { classifyChoiceConfidence } from '@/src/engine/routes/v0.2/arbitration/choice-confidence.v0.2'
import { assignUserFacingLabels } from '@/src/engine/routes/v0.2/arbitration/route-character-labels.v0.2'
import { deduplicateCandidates } from '@/src/engine/routes/v0.2/arbitration/route-dedup.v0.2'
import { explainWhyLost, explainWhyWon } from '@/src/engine/routes/v0.2/arbitration/route-choice-explanation.v0.2'

export function computeRouteChoiceScore(features: ReturnType<typeof computeCommonRouteFeatures>): {
  score: number | null
  coverage: number
  unknownKeys: string[]
  usedComposerScore: false
} {
  const blended = blendKnown([
    { key: 'travelerMatchRoute', value: features.travelerMatchRoute.value, weight: ROUTE_CHOICE_WEIGHTS.travelerMatchRoute },
    { key: 'arcQuality', value: features.arcQuality.value, weight: ROUTE_CHOICE_WEIGHTS.arcQuality },
    { key: 'routeMarginalValue', value: features.routeMarginalValue.value, weight: ROUTE_CHOICE_WEIGHTS.routeMarginalValue },
    { key: 'physicalEfficiency', value: features.physicalEfficiency.value, weight: ROUTE_CHOICE_WEIGHTS.physicalEfficiency },
    { key: 'structuralFit', value: features.structuralFit.value, weight: ROUTE_CHOICE_WEIGHTS.structuralFit },
    { key: 'timeFit', value: features.timeFit.value, weight: ROUTE_CHOICE_WEIGHTS.timeFit },
    { key: 'lanePrior', value: features.lanePrior.value, weight: ROUTE_CHOICE_WEIGHTS.lanePrior },
  ])
  return {
    score: blended.score,
    coverage: blended.coverage,
    unknownKeys: blended.unknownKeys,
    usedComposerScore: false,
  }
}

function decorate(candidate: LaneCandidateV02, request: RouteRequestV01): ArbitratedCandidate {
  const tried = tryComputeArcQualityV02(candidate.candidate)
  const arc: ArcQualityResultV02 | null = tried.ok ? tried.result : null
  const features = computeCommonRouteFeatures({ candidate, request, arc })
  const choice = computeRouteChoiceScore(features)
  return {
    originatingLane: candidate.originatingLane,
    routeId: candidate.candidate.routeId,
    candidate,
    arcQuality: arc,
    features,
    character: characterFromFeatures(features),
    routeChoiceScore: choice.score,
    routeChoiceCoverage: choice.coverage,
    unknownKeys: choice.unknownKeys,
    userFacingLabel: null,
    presentedAsAlternative: false,
  }
}

export function arbitrateLaneCandidates(
  request: RouteRequestV01,
  candidates: LaneCandidateV02[],
): ArbitrationResultV02 {
  const decorated = candidates.map((c) => decorate(c, request))
  const ranked = [...decorated].sort(
    (a, b) =>
      (b.routeChoiceScore ?? -1) - (a.routeChoiceScore ?? -1) ||
      a.routeId.localeCompare(b.routeId),
  )

  const tightBudget = request.timeBudgetMin <= 45
  const { unique: uniqueRaw, dropped } = deduplicateCandidates(ranked)
  const unique = tightBudget ? uniqueRaw.slice(0, 1) : uniqueRaw
  const recommended = unique[0] ?? null
  const alternatives = unique.slice(1)
  for (const a of alternatives) a.presentedAsAlternative = true
  if (recommended) assignUserFacingLabels(recommended, alternatives)

  const constraintDominated = unique.length <= 1 && (candidates.length >= 2 || tightBudget)
  const margin =
    recommended && unique.length >= 2 && recommended.routeChoiceScore != null && unique[1]!.routeChoiceScore != null
      ? round1(recommended.routeChoiceScore - unique[1]!.routeChoiceScore)
      : unique.length <= 1
        ? null
        : 0
  const coverage = recommended?.routeChoiceCoverage ?? 0
  const choiceConfidence = classifyChoiceConfidence({
    margin,
    coverage,
    uniquePresented: unique.length,
    constraintDominated,
  })

  if (constraintDominated && recommended) {
    recommended.userFacingLabel = 'RECOMMENDED_FOR_YOU'
    for (const a of alternatives) {
      a.userFacingLabel = 'NO_MEANINGFUL_ALTERNATIVE'
      a.presentedAsAlternative = false
    }
  }

  const arcById = new Map(
    decorated.filter((d) => d.arcQuality).map((d) => [d.routeId, d.arcQuality!]),
  )
  const h2Only = candidates.filter((c) => c.originatingLane !== 'H1')
  const legacyBlends = runLegacyBlendExperiment(h2Only, arcById)

  const whyWon = recommended
    ? explainWhyWon({ request, recommended, others: alternatives })
    : 'No feasible lane candidate.'
  const whyOthersLost = unique.slice(1).map((o) => explainWhyLost({ recommended: recommended!, other: o }))
  if (dropped.length) {
    whyOthersLost.push(
      `${dropped.length} near-duplicate candidate(s) were not presented as alternatives.`,
    )
  }

  return {
    schemaVersion: 'santiago-route-arbitration-result.v0.2',
    arbitrationVersion: ARBITRATION_VERSION,
    routeChoiceScoreVersion: ROUTE_CHOICE_SCORE_VERSION,
    arcQualityVersion: ARC_QUALITY_VERSION_V02,
    parallelOnly: true,
    productionEnabled: false,
    recommendedRouteId: recommended?.routeId ?? null,
    recommendedLane: recommended?.originatingLane ?? null,
    recommended,
    alternatives: constraintDominated ? [] : alternatives,
    allCandidates: decorated,
    choiceConfidence,
    choiceMargin: margin,
    constraintDominated,
    noMeaningfulAlternative: constraintDominated || alternatives.length === 0,
    whyWon,
    whyOthersLost,
    legacyBlends,
    notes: [
      ARBITRATION_CONFIG_STATUS,
      'Lane ComposerScore is excluded from RouteChoiceScore.',
      'UNKNOWN features are renormalized, not scored as 0.',
      'B0–B4 blends are LEGACY CROSS-LANE BLEND EXPERIMENT, not canonical selection.',
      constraintDominated ? 'CONSTRAINT_DOMINATED / NO_MEANINGFUL_ALTERNATIVE' : 'Alternatives are character-distinct.',
    ],
  }
}
