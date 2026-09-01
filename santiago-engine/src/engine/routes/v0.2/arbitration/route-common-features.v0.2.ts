/**
 * Lane-neutral common route feature vector.
 * Computed identically regardless of originating lane. No lane-specific weightings.
 */

import { ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type { LaneCandidateV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import type { ArcQualityResultV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import { dimensionValue } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { THEME_CODES } from '@/src/engine/taxonomy'
import { clamp01, isKnown, round1, round2 } from '@/src/engine/scoring/v0.2/utils'
import { blendKnown, percentile } from '@/src/engine/routes/v0.2/coverage-blend'
import {
  DISCOVERY_FIT_WEIGHTS,
  PHYSICAL_EFFICIENCY_WEIGHTS,
  ROUTE_MARGINAL_VALUE_WEIGHTS,
  STRUCTURAL_FIT_ROLE_WEIGHTS,
  TRAVELER_MATCH_ROUTE_WEIGHTS,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type { CommonRouteFeatures, FeatureScore, RouteCharacter } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import { computeLanePrior } from '@/src/engine/routes/v0.2/arbitration/lane-prior.v0.2'
import type { ComposerLane } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'

function feat(
  value: number | null,
  coverage: number,
  breakdown: Record<string, number | null>,
): FeatureScore {
  return {
    value: value == null ? null : round1(value),
    coverage: round2(coverage),
    unknown: value == null,
    breakdown,
  }
}

function meanKnown(xs: Array<number | null>): { mean: number | null; coverage: number } {
  const known = xs.filter(isKnown)
  if (!known.length) return { mean: null, coverage: 0 }
  return {
    mean: known.reduce((a, b) => a + b, 0) / known.length,
    coverage: known.length / xs.length,
  }
}

export function computeTravelerMatchRoute(candidate: LaneCandidateV02): FeatureScore {
  const stops = candidate.stopScores
  const matches = stops.map((s) => s.bundle.travelerMatch.score)
  const dwells = candidate.candidate.orderedStops.map((s) => Math.max(1, s.estimatedDwellMin))
  let num = 0
  let den = 0
  const knownPairs: number[] = []
  for (let i = 0; i < stops.length; i += 1) {
    const m = matches[i]
    if (!isKnown(m)) continue
    const w = dwells[i] ?? 1
    num += m * w
    den += w
    knownPairs.push(m)
  }
  const dwellWeightedMean = den > 0 ? num / den : null
  const sorted = [...knownPairs].sort((a, b) => a - b)
  const p20 = percentile(sorted, 20)
  const traveler = candidate.candidate.requestSnapshot.traveler
  const wanted = THEME_CODES.filter((t) => (traveler.themeWeights[t] ?? 0) >= 0.3)
  const covered = candidate.candidate.themeCoverage.filter((t) => wanted.includes(t))
  const themeCoverage =
    wanted.length === 0 ? null : round1((covered.length / wanted.length) * 100)

  const consecutiveSame = consecutiveThemeRepetition(candidate)
  const repetitionBurden = round1(consecutiveSame * 100)

  const blended = blendKnown([
    { key: 'dwellWeightedMean', value: dwellWeightedMean, weight: TRAVELER_MATCH_ROUTE_WEIGHTS.dwellWeightedMean },
    { key: 'lowerTailP20', value: p20, weight: TRAVELER_MATCH_ROUTE_WEIGHTS.lowerTailP20 },
    { key: 'themeCoverage', value: themeCoverage, weight: TRAVELER_MATCH_ROUTE_WEIGHTS.themeCoverage },
    {
      key: 'repetitionBurden',
      value: isKnown(repetitionBurden) ? 100 - repetitionBurden : null,
      weight: TRAVELER_MATCH_ROUTE_WEIGHTS.repetitionBurden,
    },
  ])

  return feat(blended.score, blended.coverage, {
    dwellWeightedMean: dwellWeightedMean == null ? null : round1(dwellWeightedMean),
    lowerTailP20: p20 == null ? null : round1(p20),
    themeCoverage,
    repetitionBurden,
    nStops: stops.length,
    knownStops: knownPairs.length,
  })
}

function consecutiveThemeRepetition(candidate: LaneCandidateV02): number {
  const stops = candidate.candidate.orderedStops
  if (stops.length < 2) return 0
  let same = 0
  for (let i = 1; i < stops.length; i += 1) {
    const a = stops[i - 1]!.nodeUtilityBreakdown.interests.details
    const b = stops[i]!.nodeUtilityBreakdown.interests.details
    void a
    void b
    const sa = classifyStructure(stops[i - 1]!.tier, stops[i - 1]!.editorialRole)
    const sb = classifyStructure(stops[i]!.tier, stops[i]!.editorialRole)
    if (sa === sb && sa !== 'other') same += 1
  }
  return clamp01(same / Math.max(1, stops.length - 1))
}

export function computeIntrinsicWorthRoute(candidate: LaneCandidateV02): FeatureScore {
  const values = candidate.stopScores.map((s) => s.bundle.intrinsicWorth.raw)
  const m = meanKnown(values)
  const sorted = values.filter(isKnown).sort((a, b) => a - b)
  const p20 = percentile(sorted, 20)
  const blended = blendKnown([
    { key: 'mean', value: m.mean, weight: 0.7 },
    { key: 'lowerTailP20', value: p20, weight: 0.3 },
  ])
  return feat(blended.score, blended.coverage, {
    mean: m.mean == null ? null : round1(m.mean),
    lowerTailP20: p20 == null ? null : round1(p20),
  })
}

export function computeRouteMarginalValue(candidate: LaneCandidateV02): FeatureScore {
  const extras = candidate.stopScores.slice(1)
  if (!extras.length) {
    return feat(null, 0, { qualityWeightedMeanMrv: null, progressionBonus: null, repetitionBurden: null })
  }
  let qNum = 0
  let qDen = 0
  const mrvs: number[] = []
  const redundancies: number[] = []
  const newThemes: number[] = []
  for (const s of extras) {
    const mrv = s.bundle.marginalRouteValue?.score ?? null
    const tm = s.bundle.travelerMatch.score ?? 50
    if (isKnown(mrv)) {
      qNum += mrv * Math.max(1, tm)
      qDen += Math.max(1, tm)
      mrvs.push(mrv)
    }
    const red = s.bundle.marginalRouteValue?.components.redundancy
    if (isKnown(red)) redundancies.push(red * 100)
    const nt = s.bundle.marginalRouteValue?.components.newThemeValue
    if (isKnown(nt)) newThemes.push(nt * 100)
  }
  const qualityWeightedMeanMrv = qDen > 0 ? qNum / qDen : meanKnown(mrvs).mean
  const progressionBonus = meanKnown(newThemes).mean
  const repetitionBurden = meanKnown(redundancies).mean
  const blended = blendKnown([
    {
      key: 'qualityWeightedMeanMrv',
      value: qualityWeightedMeanMrv,
      weight: ROUTE_MARGINAL_VALUE_WEIGHTS.qualityWeightedMeanMrv,
    },
    {
      key: 'progressionBonus',
      value: progressionBonus,
      weight: ROUTE_MARGINAL_VALUE_WEIGHTS.progressionBonus,
    },
    {
      key: 'repetitionBurden',
      value: isKnown(repetitionBurden) ? 100 - repetitionBurden : null,
      weight: ROUTE_MARGINAL_VALUE_WEIGHTS.repetitionBurden,
    },
  ])
  return feat(blended.score, blended.coverage || (extras.length ? meanKnown(mrvs).coverage : 0), {
    qualityWeightedMeanMrv: qualityWeightedMeanMrv == null ? null : round1(qualityWeightedMeanMrv),
    progressionBonus: progressionBonus == null ? null : round1(progressionBonus),
    repetitionBurden: repetitionBurden == null ? null : round1(repetitionBurden),
    nAdditions: extras.length,
  })
}

export function computeStructuralFit(candidate: LaneCandidateV02, request: RouteRequestV01): FeatureScore {
  const roles = candidate.stopScores.map((s) => s.bundle.roleFit)
  const anchor = meanKnown(roles.map((r) => (r.anchorFit == null ? null : r.anchorFit * 100)))
  const pocket = meanKnown(roles.map((r) => (r.pocketFit == null ? null : r.pocketFit * 100)))
  const micro = meanKnown(roles.map((r) => (r.microRevealFit == null ? null : r.microRevealFit * 100)))

  const express = request.traveler.expressPreference || request.traveler.mobilityArchetype === 'M1'
  const key =
    request.traveler.discoveryPosture === 'D1'
      ? 'D1'
      : request.traveler.discoveryPosture === 'D2'
        ? 'D2'
        : request.traveler.discoveryPosture === 'D3'
          ? 'D3'
          : express
            ? 'M1'
            : request.routeIntent
  const w = STRUCTURAL_FIT_ROLE_WEIGHTS[key]
  const blended = blendKnown([
    { key: 'anchorFit', value: anchor.mean, weight: w.anchorFit },
    { key: 'pocketFit', value: pocket.mean, weight: w.pocketFit },
    { key: 'microRevealFit', value: micro.mean, weight: w.microRevealFit },
  ])
  return feat(blended.score, blended.coverage, {
    anchorFit: anchor.mean == null ? null : round1(anchor.mean),
    pocketFit: pocket.mean == null ? null : round1(pocket.mean),
    microRevealFit: micro.mean == null ? null : round1(micro.mean),
    profileKey: null,
  })
}

export function computeDiscoveryFit(candidate: LaneCandidateV02): FeatureScore {
  const stops = candidate.stopScores
  const discoveryDensity = meanKnown(
    stops.map((s) => {
      const v = dimensionValue(
        { stgoId: s.stgoId, displayName: s.bundle.displayName, dimensions: s.bundle.editorialDimensions },
        'discoveryDensity',
      )
      return v == null ? null : v * 100
    }),
  )
  const surprise = meanKnown(
    stops.map((s) => {
      const v = dimensionValue(
        { stgoId: s.stgoId, displayName: s.bundle.displayName, dimensions: s.bundle.editorialDimensions },
        'surprise',
      )
      return v == null ? null : v * 100
    }),
  )
  const pocket = meanKnown(stops.map((s) => (s.bundle.roleFit.pocketFit == null ? null : s.bundle.roleFit.pocketFit * 100)))
  const micro = meanKnown(
    stops.map((s) => (s.bundle.roleFit.microRevealFit == null ? null : s.bundle.roleFit.microRevealFit * 100)),
  )
  const newTheme = meanKnown(
    stops.slice(1).map((s) => {
      const v = s.bundle.marginalRouteValue?.components.newThemeValue
      return v == null ? null : v * 100
    }),
  )
  const novelty = meanKnown(
    stops.slice(1).map((s) => {
      const v = s.bundle.marginalRouteValue?.components.structuralNovelty
      return v == null ? null : v * 100
    }),
  )
  const redundancy = meanKnown(
    stops.slice(1).map((s) => {
      const v = s.bundle.marginalRouteValue?.components.redundancy
      return v == null ? null : v * 100
    }),
  )
  const blended = blendKnown([
    { key: 'discoveryDensity', value: discoveryDensity.mean, weight: DISCOVERY_FIT_WEIGHTS.discoveryDensity },
    { key: 'surprise', value: surprise.mean, weight: DISCOVERY_FIT_WEIGHTS.surprise },
    { key: 'pocketFit', value: pocket.mean, weight: DISCOVERY_FIT_WEIGHTS.pocketFit },
    { key: 'microRevealFit', value: micro.mean, weight: DISCOVERY_FIT_WEIGHTS.microRevealFit },
    { key: 'newThemeValue', value: newTheme.mean, weight: DISCOVERY_FIT_WEIGHTS.newThemeValue },
    { key: 'structuralNovelty', value: novelty.mean, weight: DISCOVERY_FIT_WEIGHTS.structuralNovelty },
    {
      key: 'redundancy',
      value: redundancy.mean == null ? null : 100 - redundancy.mean,
      weight: DISCOVERY_FIT_WEIGHTS.redundancy,
    },
  ])
  return feat(blended.score, blended.coverage, {
    discoveryDensity: discoveryDensity.mean == null ? null : round1(discoveryDensity.mean),
    surprise: surprise.mean == null ? null : round1(surprise.mean),
    pocketFit: pocket.mean == null ? null : round1(pocket.mean),
    microRevealFit: micro.mean == null ? null : round1(micro.mean),
    newThemeValue: newTheme.mean == null ? null : round1(newTheme.mean),
    structuralNovelty: novelty.mean == null ? null : round1(novelty.mean),
    redundancy: redundancy.mean == null ? null : round1(redundancy.mean),
  })
}

export function computePhysicalEfficiency(
  candidate: LaneCandidateV02,
  arc: ArcQualityResultV02 | null,
): FeatureScore {
  const r = candidate.candidate
  const dwellShare =
    r.totalEstimatedMin > 0 ? clamp01(r.dwellMin / r.totalEstimatedMin) * 100 : null
  const transitions = r.orderedStops.map((s) => s.transitionTimeMin).filter((t) => t > 0)
  const meanT = transitions.length ? transitions.reduce((a, b) => a + b, 0) / transitions.length : null
  const transitionBurden =
    meanT == null ? null : clamp01(1 - meanT / ROUTE_SEARCH_CONFIG.maxWalkChunkMin) * 100
  const longest = transitions.length ? Math.max(...transitions) : null
  const longestTransition =
    longest == null ? null : clamp01(1 - longest / ROUTE_SEARCH_CONFIG.maxWalkChunkMin) * 100
  const backtracking =
    arc == null ? null : clamp01(1 - arc.penalties.backtrackingPenalty) * 100
  const geo = meanKnown(
    candidate.stopScores.slice(1).map((s) => {
      const v = s.bundle.marginalRouteValue?.components.geographicProgression
      return v == null ? null : v * 100
    }),
  )
  const metroBurden = clamp01(1 - r.metroUse.transferCount * 0.15) * 100
  const blended = blendKnown([
    { key: 'dwellShare', value: dwellShare, weight: PHYSICAL_EFFICIENCY_WEIGHTS.dwellShare },
    { key: 'transitionBurden', value: transitionBurden, weight: PHYSICAL_EFFICIENCY_WEIGHTS.transitionBurden },
    { key: 'longestTransition', value: longestTransition, weight: PHYSICAL_EFFICIENCY_WEIGHTS.longestTransition },
    { key: 'backtracking', value: backtracking, weight: PHYSICAL_EFFICIENCY_WEIGHTS.backtracking },
    { key: 'geographicProgression', value: geo.mean, weight: PHYSICAL_EFFICIENCY_WEIGHTS.geographicProgression },
    { key: 'metroBurden', value: metroBurden, weight: PHYSICAL_EFFICIENCY_WEIGHTS.metroBurden },
  ])
  return feat(blended.score, blended.coverage, {
    dwellShare: dwellShare == null ? null : round1(dwellShare),
    transitionBurden: transitionBurden == null ? null : round1(transitionBurden),
    longestTransition: longestTransition == null ? null : round1(longestTransition),
    backtracking: backtracking == null ? null : round1(backtracking),
    geographicProgression: geo.mean == null ? null : round1(geo.mean),
    metroBurden: round1(metroBurden),
    movementMin: r.movementMin,
    longestTransitionMin: longest,
  })
}

export function computeTimeFit(candidate: LaneCandidateV02): FeatureScore {
  const r = candidate.candidate
  const utilization = r.totalEstimatedMin / Math.max(1, r.timeBudgetMin)
  const over = Math.max(0, r.totalEstimatedMin - r.timeBudgetMin - ROUTE_SEARCH_CONFIG.timeToleranceMin)
  const underFill = utilization < 0.72 ? clamp01((0.72 - utilization) / 0.72) : 0
  const overFill = over / Math.max(15, r.timeBudgetMin)
  const value = round1(clamp01(1 - overFill - underFill * 0.85) * 100)
  return feat(value, 1, {
    utilization: round1(utilization * 100),
    unusedMin: round1(Math.max(0, r.timeBudgetMin - r.totalEstimatedMin)),
    overshootMin: round1(over),
  })
}

export function computeNarrativeCoherence(
  candidate: LaneCandidateV02,
  arc: ArcQualityResultV02 | null,
): FeatureScore {
  if (arc) {
    const value = round1(
      clamp01(
        0.4 * arc.components.thematicCoherence +
          0.3 * arc.components.curiosityContinuity +
          0.3 * arc.components.questionResolution,
      ) * 100,
    )
    const narrativeKnown = candidate.candidate.orderedStops.some((s) => s.narrativeEdgeScore != null)
    return feat(value, narrativeKnown ? 1 : 0.45, {
      thematicCoherence: round1(arc.components.thematicCoherence * 100),
      curiosityContinuity: round1(arc.components.curiosityContinuity * 100),
      questionResolution: round1(arc.components.questionResolution * 100),
      narrativeEvidence: narrativeKnown ? 1 : 0,
    })
  }
  const edges = candidate.candidate.orderedStops
    .map((s) => s.narrativeEdgeScore)
    .filter((x): x is number => x != null)
  if (!edges.length) return feat(null, 0, { meanNarrativeEdge: null })
  return feat(round1(edges.reduce((a, b) => a + b, 0) / edges.length), 1, {
    meanNarrativeEdge: round1(edges.reduce((a, b) => a + b, 0) / edges.length),
  })
}

export function computeCommonRouteFeatures(args: {
  candidate: LaneCandidateV02
  request: RouteRequestV01
  arc: ArcQualityResultV02 | null
}): CommonRouteFeatures {
  const { candidate, request, arc } = args
  const travelerMatchRoute = computeTravelerMatchRoute(candidate)
  const intrinsicWorthRoute = computeIntrinsicWorthRoute(candidate)
  const routeMarginalValue = computeRouteMarginalValue(candidate)
  const structuralFit = computeStructuralFit(candidate, request)
  const discoveryFit = computeDiscoveryFit(candidate)
  const physicalEfficiency = computePhysicalEfficiency(candidate, arc)
  const timeFit = computeTimeFit(candidate)
  const narrativeCoherence = computeNarrativeCoherence(candidate, arc)
  const arcQuality = feat(
    arc?.normalizedScore ?? null,
    arc ? 1 : 0,
    { normalizedScore: arc?.normalizedScore ?? null, version: arc ? 0.2 : null },
  )
  const lane = candidate.originatingLane === 'H1' ? 'SIGNATURE' : candidate.originatingLane
  const prior = computeLanePrior(request, lane as ComposerLane)
  const lanePrior = feat(prior, 1, { prior, lane: null })

  const coverages = [
    travelerMatchRoute.coverage,
    routeMarginalValue.coverage,
    arcQuality.coverage,
    physicalEfficiency.coverage,
    structuralFit.coverage,
    timeFit.coverage,
    discoveryFit.coverage,
    narrativeCoherence.coverage,
  ]
  const routeCoverageConfidence = round2(coverages.reduce((a, b) => a + b, 0) / coverages.length)

  return {
    travelerMatchRoute,
    intrinsicWorthRoute,
    routeMarginalValue,
    arcQuality,
    physicalEfficiency,
    timeFit,
    structuralFit,
    discoveryFit,
    narrativeCoherence,
    routeCoverageConfidence,
    lanePrior,
  }
}

export function characterFromFeatures(features: CommonRouteFeatures): RouteCharacter {
  const essentialityParts = [
    features.intrinsicWorthRoute.value,
    features.structuralFit.breakdown.anchorFit ?? null,
  ]
  const ess = meanKnown(essentialityParts)
  return {
    essentiality: ess.mean == null ? null : round1(ess.mean),
    discovery: features.discoveryFit.value,
    physicalEase: features.physicalEfficiency.value,
    narrativeDepth: features.narrativeCoherence.value,
    travelerMatch: features.travelerMatchRoute.value,
  }
}
