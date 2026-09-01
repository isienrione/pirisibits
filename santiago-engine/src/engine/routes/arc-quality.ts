/**
 * Gate 2D — complete deterministic ArcQuality V0.1 (route-level, not incremental).
 */

import { computeArcSignals } from '@/src/engine/narrative/arc-signals'
import type { NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import {
  ARC_QUALITY_PENALTY_WEIGHTS,
  ARC_QUALITY_POSITIVE_WEIGHTS,
  ARC_QUALITY_THRESHOLDS,
  ARC_STRUCTURAL_BANDS,
  OVERSTUFFING_CONFIG,
  TIME_UTILIZATION_CONFIG,
  TRAVELER_ARC_MODIFIERS,
} from '@/src/engine/routes/arc-quality-config'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type { RouteCandidateV01, RouteRequestV01 } from '@/src/engine/routes/route-types'

export type ArcQualityStatus = 'PROVISIONAL_V0_1'

export type ArcQualityComponents = {
  openingStrength: number
  developmentStrength: number
  payoffStrength: number
  endingStrength: number
  rhythmBalance: number
  curiosityContinuity: number
  themeDiversity: number
  thematicCoherence: number
  contrastBalance: number
  revealSpacing: number
  anchorDistribution: number
  structuralVariety: number
  relationTypeVariety: number
  questionResolution: number
  timeUtilization: number
  routeDistinctiveness: number
}

export type ArcQualityPenalties = {
  repetitionPenalty: number
  unresolvedSetupPenalty: number
  structuralMonotonyPenalty: number
  themeMonotonyPenalty: number
  relationMonotonyPenalty: number
  weakEndingPenalty: number
  overstuffingPenalty: number
  underutilizedBudgetPenalty: number
  backtrackingPenalty: number
}

export type ArcQualityResult = {
  arcQualityStatus: ArcQualityStatus
  calibrationStatus: 'PROVISIONAL'
  calibrationApproved: false
  engineUsingProvisionalEditorialCalibration: true
  routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION'
  normalizedScore: number
  rawScore: number
  components: ArcQualityComponents
  penalties: ArcQualityPenalties
  weightedPositiveSum: number
  weightedPenaltySum: number
  unusedBudgetMin: number
  unusedBudgetRatio: number
  timeUtilizationReason: string
  feasibleWorthwhileContinuations: number
  structuralDistribution: {
    anchors: number
    pockets: number
    micros: number
    stops: number
    anchorRatio: number
    pocketRatio: number
    microRatio: number
    longestAnchorRun: number
  }
  travelerModifiersApplied: string[]
}

export type ArcQualityValidation =
  | { valid: true }
  | { valid: false; status: 'INVALID'; reasons: string[] }

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function longestRun(stops: RouteCandidateV01['orderedStops'], kind: 'anchor' | 'pocket' | 'micro' | 'other'): number {
  let best = 0
  let cur = 0
  for (const s of stops) {
    if (classifyStructure(s.tier, s.editorialRole) === kind) {
      cur += 1
      best = Math.max(best, cur)
    } else cur = 0
  }
  return best
}

function longestRelationRun(stops: RouteCandidateV01['orderedStops']): { run: number; type: NarrativeRelationType | null } {
  let best = 0
  let cur = 0
  let last: NarrativeRelationType | null = null
  let bestType: NarrativeRelationType | null = null
  for (const s of stops.slice(1)) {
    const r = s.narrativeRelationFromPrevious
    if (r && r === last) {
      cur += 1
      if (cur + 1 > best) {
        best = cur + 1
        bestType = r
      }
    } else {
      cur = 0
      last = r
    }
  }
  return { run: best, type: bestType }
}

function uniqueRelationTypes(stops: RouteCandidateV01['orderedStops']): NarrativeRelationType[] {
  const set = new Set<NarrativeRelationType>()
  for (const s of stops.slice(1)) {
    if (s.narrativeRelationFromPrevious) set.add(s.narrativeRelationFromPrevious)
  }
  return [...set]
}

function themeCoherenceScore(stops: RouteCandidateV01['orderedStops'], dominantThemes: string[]): number {
  if (stops.length <= 1) return 0.7
  let coherentSteps = 0
  for (let i = 1; i < stops.length; i += 1) {
    const prevThemes = new Set(stops[i - 1]!.arcStateAfter.themesSeen)
    const curThemes = stops[i]!.arcStateAfter.themesSeen
    const overlap = curThemes.some((t) => prevThemes.has(t) || dominantThemes.includes(t))
    if (overlap) coherentSteps += 1
  }
  return clamp01(coherentSteps / (stops.length - 1))
}

function themeMonotonyPenalty(stops: RouteCandidateV01['orderedStops'], dominantThemes: string[]): number {
  if (dominantThemes.length !== 1 || stops.length < 4) return 0
  const dominant = dominantThemes[0]!
  let streak = 0
  let maxStreak = 0
  for (const s of stops) {
    const themes = s.arcStateAfter.themesDominant.length ? s.arcStateAfter.themesDominant : s.arcStateAfter.themesSeen
    if (themes.includes(dominant as never)) {
      streak += 1
      maxStreak = Math.max(maxStreak, streak)
    } else streak = 0
  }
  return clamp01(Math.max(0, maxStreak - 3) * 0.2)
}

function developmentStrength(stops: RouteCandidateV01['orderedStops']): number {
  if (stops.length < 2) return 0.4
  let gain = 0
  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1]!
    const cur = stops[i]!
    if (cur.nodeUtility > prev.nodeUtility * 0.95) gain += 0.15
    const rel = cur.narrativeRelationFromPrevious
    if (rel === 'deepens_context' || rel === 'causal_followup' || rel === 'escalation') gain += 0.2
    if (cur.arcStateAfter.questionsOpened.length > prev.arcStateAfter.questionsOpened.length) gain += 0.1
    if (cur.arcStateAfter.themesSeen.length > prev.arcStateAfter.themesSeen.length) gain += 0.08
  }
  return clamp01(0.35 + gain / Math.max(1, stops.length - 1))
}

function openingStrength(stops: RouteCandidateV01['orderedStops'], request: RouteRequestV01): number {
  const opener = stops[0]
  if (!opener) return 0
  const struct = classifyStructure(opener.tier, opener.editorialRole)
  let score = clamp01(opener.nodeUtility / 100) * 0.45 + opener.yourMatch * 0.25
  if (struct === 'anchor') score += 0.2
  if (opener.arcStateAfter.questionsOpened.length > 0) score += 0.08
  if (request.routeIntent === 'DISCOVERY' && struct === 'micro') score += 0.05
  if (
    request.routeIntent === 'ESSENTIALS' &&
    opener.nodeUtility < ARC_QUALITY_THRESHOLDS.weakOpenerUtilityMax &&
    struct !== 'anchor'
  ) {
    score -= 0.15
  }
  return clamp01(score)
}

function endingStrength(stops: RouteCandidateV01['orderedStops'], request: RouteRequestV01): number {
  const ending = stops[stops.length - 1]
  if (!ending) return 0
  const avg = stops.reduce((a, s) => a + s.nodeUtility, 0) / stops.length
  const struct = classifyStructure(ending.tier, ending.editorialRole)
  let score = clamp01(ending.nodeUtility / Math.max(avg, 1)) * 0.4 + ending.yourMatch * 0.2
  if (struct === 'anchor' || struct === 'pocket') score += 0.15
  const finalArc = ending.arcStateAfter
  if (finalArc.questionsResolved.length > 0) score += 0.15
  if (request.routeIntent === 'ESSENTIALS' && ending.nodeUtility >= avg) score += 0.1
  return clamp01(score)
}

function structuralVarietyScore(stops: RouteCandidateV01['orderedStops']): number {
  const kinds = stops.map((s) => classifyStructure(s.tier, s.editorialRole))
  const unique = new Set(kinds)
  let alternations = 0
  for (let i = 1; i < kinds.length; i += 1) {
    if (kinds[i] !== kinds[i - 1]) alternations += 1
  }
  return clamp01(unique.size / 3 + (alternations / Math.max(1, stops.length - 1)) * 0.35)
}

function anchorDistributionScore(stops: RouteCandidateV01['orderedStops']): number {
  const n = stops.length
  const anchorRatio = stops.filter((s) => classifyStructure(s.tier, s.editorialRole) === 'anchor').length / n
  const target = (ARC_STRUCTURAL_BANDS.anchorMin + ARC_STRUCTURAL_BANDS.anchorMax) / 2
  return clamp01(1 - Math.abs(anchorRatio - target) * 2)
}

function rhythmBalanceScore(stops: RouteCandidateV01['orderedStops']): number {
  const n = stops.length
  const counts = { anchor: 0, pocket: 0, micro: 0, other: 0 }
  for (const s of stops) counts[classifyStructure(s.tier, s.editorialRole)] += 1
  const ratios = [counts.anchor / n, counts.pocket / n, counts.micro / n]
  const bandMid = [
    (ARC_STRUCTURAL_BANDS.anchorMin + ARC_STRUCTURAL_BANDS.anchorMax) / 2,
    (ARC_STRUCTURAL_BANDS.pocketMin + ARC_STRUCTURAL_BANDS.pocketMax) / 2,
    (ARC_STRUCTURAL_BANDS.microMin + ARC_STRUCTURAL_BANDS.microMax) / 2,
  ]
  const deviation = ratios.reduce((s, r, i) => s + Math.abs(r - bandMid[i]!), 0) / 3
  const anchorRun = longestRun(stops, 'anchor')
  const runPenalty = anchorRun > ARC_STRUCTURAL_BANDS.maxConsecutiveAnchorRun ? (anchorRun - 3) * 0.12 : 0
  return clamp01(1 - deviation * 1.2 - runPenalty)
}

function revealSpacingScore(stops: RouteCandidateV01['orderedStops']): number {
  const revealIdx: number[] = []
  stops.forEach((s, i) => {
    if (
      s.narrativeRelationFromPrevious === 'reveal' ||
      s.narrativeRelationFromPrevious === 'resolves_question' ||
      classifyStructure(s.tier, s.editorialRole) === 'micro'
    ) {
      revealIdx.push(i)
    }
  })
  if (revealIdx.length <= 1) return 0.55
  const gaps = revealIdx.slice(1).map((v, i) => v - revealIdx[i]!)
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  return clamp01(1 - Math.abs(avgGap - 2) * 0.2)
}

function questionResolutionScore(finalArc: RouteCandidateV01['orderedStops'][0]['arcStateAfter']): number {
  const opened = finalArc.questionsOpened.length
  if (opened === 0) return 0.65
  const resolved = finalArc.questionsResolved.filter((q) => finalArc.questionsOpened.includes(q)).length
  return clamp01(resolved / opened)
}

function routeDistinctivenessScore(stops: RouteCandidateV01['orderedStops']): number {
  const uniqueIds = new Set(stops.map((s) => s.stgoId))
  const uniqueThemes = new Set(stops.flatMap((s) => s.arcStateAfter.themesSeen))
  return clamp01((uniqueIds.size / Math.max(stops.length, 1)) * 0.5 + uniqueThemes.size / 8)
}

function detectBacktracking(stops: RouteCandidateV01['orderedStops']): number {
  let penalty = 0
  for (let i = 2; i < stops.length; i += 1) {
    const a = stops[i - 2]!
    const c = stops[i]!
    if (a.stgoId === c.stgoId) penalty += 0.5
    const tA = a.arcStateAfter.themesDominant.join(',')
    const tC = c.arcStateAfter.themesDominant.join(',')
    if (tA && tA === tC && classifyStructure(c.tier, c.editorialRole) === classifyStructure(a.tier, a.editorialRole)) {
      penalty += 0.15
    }
  }
  return clamp01(penalty)
}

function computeTimeUtilization(candidate: RouteCandidateV01): {
  score: number
  penalty: number
  reason: string
  feasibleCount: number
  unusedMin: number
  unusedRatio: number
} {
  const unusedMin = Math.max(0, candidate.timeBudgetMin - candidate.totalEstimatedMin)
  const unusedRatio = unusedMin / Math.max(1, candidate.timeBudgetMin)

  const worthwhile = candidate.omittedHighUtilityNodes.filter(
    (o) =>
      o.nodeUtility != null &&
      o.nodeUtility >= TIME_UTILIZATION_CONFIG.worthwhileContinuationUtilityMin &&
      (o.reasonCode === 'EXCEEDS_REMAINING_BUDGET' ||
        o.reasonCode === 'NOT_EXPANDED_IN_BEAM' ||
        o.reasonCode === 'POOR_SEQUENCE_FIT'),
  )
  const feasibleCount = worthwhile.length

  if (
    unusedRatio <= TIME_UTILIZATION_CONFIG.unusedBudgetPenaltyThreshold ||
    unusedMin < TIME_UTILIZATION_CONFIG.minUnusedMinutesForPenalty
  ) {
    return {
      score: clamp01(1 - unusedRatio * 0.5),
      penalty: 0,
      reason: `Unused ${round2(unusedMin)} min (${round2(unusedRatio * 100)}%) within acceptable slack.`,
      feasibleCount,
      unusedMin,
      unusedRatio,
    }
  }

  if (feasibleCount === 0) {
    return {
      score: clamp01(0.75 - unusedRatio * 0.2),
      penalty: clamp01(unusedRatio * 0.15),
      reason: `Unused ${round2(unusedMin)} min but no omitted high-utility continuations suggest worthwhile feasible adds.`,
      feasibleCount: 0,
      unusedMin,
      unusedRatio,
    }
  }

  const penalty = clamp01((unusedRatio - TIME_UTILIZATION_CONFIG.unusedBudgetPenaltyThreshold) * 1.8)
  return {
    score: clamp01(1 - penalty),
    penalty,
    reason: `Unused ${round2(unusedMin)} min (${round2(unusedRatio * 100)}%) while ${feasibleCount} worthwhile continuation(s) were omitted.`,
    feasibleCount,
    unusedMin,
    unusedRatio,
  }
}

function overstuffingPenalty(candidate: RouteCandidateV01): number {
  const n = candidate.stopCount
  const stopsPerHour = (n / Math.max(candidate.totalEstimatedMin, 1)) * 60
  const avgDwell = candidate.dwellMin / Math.max(n, 1)
  const transitionDensity = candidate.movementMin / Math.max(candidate.totalEstimatedMin, 1)
  let p = 0
  if (stopsPerHour > OVERSTUFFING_CONFIG.maxStopsPerHour) {
    p += clamp01((stopsPerHour - OVERSTUFFING_CONFIG.maxStopsPerHour) / 2)
  }
  if (avgDwell < OVERSTUFFING_CONFIG.minAvgDwellMin) {
    p += clamp01((OVERSTUFFING_CONFIG.minAvgDwellMin - avgDwell) / OVERSTUFFING_CONFIG.minAvgDwellMin)
  }
  if (transitionDensity > OVERSTUFFING_CONFIG.maxTransitionDensity) {
    p += clamp01((transitionDensity - OVERSTUFFING_CONFIG.maxTransitionDensity) * 2)
  }
  return clamp01(p)
}

function applyTravelerModifiers(
  components: ArcQualityComponents,
  request: RouteRequestV01,
): { adjusted: ArcQualityComponents; applied: string[] } {
  const applied: string[] = []
  const adjusted = { ...components }
  const posture = request.traveler.discoveryPosture
  const intent = request.routeIntent

  const bump = (key: keyof ArcQualityComponents, factor: number, label: string) => {
    adjusted[key] = clamp01(adjusted[key] * factor)
    applied.push(label)
  }

  if (intent === 'THEMATIC' || (request.preferredThemes?.length ?? 0) >= 1) {
    bump('thematicCoherence', TRAVELER_ARC_MODIFIERS.thematicIntent.coherence, 'thematicIntent:coherence')
    bump('themeDiversity', TRAVELER_ARC_MODIFIERS.thematicIntent.diversity, 'thematicIntent:diversity')
  }
  if (posture === 'D1') {
    bump('themeDiversity', TRAVELER_ARC_MODIFIERS.discoveryD1.diversity, 'D1:diversity')
    bump('thematicCoherence', TRAVELER_ARC_MODIFIERS.discoveryD1.coherence, 'D1:coherence')
    bump('structuralVariety', TRAVELER_ARC_MODIFIERS.discoveryD1.structuralVariety, 'D1:structuralVariety')
  }
  if (posture === 'D2') {
    bump('curiosityContinuity', TRAVELER_ARC_MODIFIERS.discoveryD2.curiosityContinuity, 'D2:curiosity')
    bump('questionResolution', TRAVELER_ARC_MODIFIERS.discoveryD2.questionResolution, 'D2:questionResolution')
  }
  if (request.traveler.expressPreference || request.traveler.mobilityArchetype === 'M1') {
    bump('payoffStrength', TRAVELER_ARC_MODIFIERS.expressM1.payoffStrength, 'M1:payoff')
    bump('endingStrength', TRAVELER_ARC_MODIFIERS.expressM1.endingStrength, 'M1:ending')
    bump('structuralVariety', TRAVELER_ARC_MODIFIERS.expressM1.structuralVariety, 'M1:structuralVariety')
  }
  if (intent === 'ESSENTIALS') {
    bump('openingStrength', TRAVELER_ARC_MODIFIERS.essentialsIntent.openingStrength, 'ESSENTIALS:opening')
    bump('anchorDistribution', TRAVELER_ARC_MODIFIERS.essentialsIntent.anchorDistribution, 'ESSENTIALS:anchors')
  }
  if (intent === 'DISCOVERY') {
    bump('structuralVariety', TRAVELER_ARC_MODIFIERS.discoveryIntent.structuralVariety, 'DISCOVERY:variety')
    bump('themeDiversity', TRAVELER_ARC_MODIFIERS.discoveryIntent.themeDiversity, 'DISCOVERY:diversity')
  }

  return { adjusted, applied: [...new Set(applied)] }
}

/** Validate candidate is physically/hard-constraint feasible before ArcQuality. */
export function validateRouteCandidateForArcQuality(candidate: RouteCandidateV01): ArcQualityValidation {
  const reasons: string[] = []
  if (candidate.status === 'INFEASIBLE') reasons.push('INFEASIBLE status')
  if (candidate.stopCount < ARC_QUALITY_THRESHOLDS.minRouteStops) reasons.push('Too few stops')
  if (candidate.orderedStops.some((s) => s.stgoId === 'STGO_104')) reasons.push('STGO_104 must not appear while physical pending')
  if (candidate.totalEstimatedMin > candidate.timeBudgetMin + ARC_QUALITY_THRESHOLDS.maxBudgetOvershootMin) {
    reasons.push('Exceeds time budget beyond tolerance')
  }
  if (candidate.physicalRouteGenerationEnabled) reasons.push('Production routing flag must remain false')
  return reasons.length ? { valid: false, status: 'INVALID', reasons } : { valid: true }
}

/** Compute full route-level ArcQuality for a feasible Gate 2C candidate. */
export function computeArcQuality(candidate: RouteCandidateV01): ArcQualityResult {
  const validation = validateRouteCandidateForArcQuality(candidate)
  if (!validation.valid) {
    throw new Error(`ArcQuality rejected invalid candidate: ${validation.reasons.join('; ')}`)
  }

  const stops = candidate.orderedStops
  const request = candidate.requestSnapshot
  const finalArc = stops[stops.length - 1]!.arcStateAfter
  const arcSignals = computeArcSignals(finalArc)
  const relRun = longestRelationRun(stops)
  const relTypes = uniqueRelationTypes(stops)

  const timeUtil = computeTimeUtilization(candidate)
  const ending = endingStrength(stops, request)
  const opening = openingStrength(stops, request)

  const componentsBase: ArcQualityComponents = {
    openingStrength: round2(opening),
    developmentStrength: round2(developmentStrength(stops)),
    payoffStrength: round2(arcSignals.payoffStrength),
    endingStrength: round2(ending),
    rhythmBalance: round2(rhythmBalanceScore(stops)),
    curiosityContinuity: round2(arcSignals.curiosityContinuity),
    themeDiversity: round2(arcSignals.themeDiversity),
    thematicCoherence: round2(themeCoherenceScore(stops, candidate.dominantThemes)),
    contrastBalance: round2(arcSignals.contrastBalance),
    revealSpacing: round2(revealSpacingScore(stops)),
    anchorDistribution: round2(anchorDistributionScore(stops)),
    structuralVariety: round2(structuralVarietyScore(stops)),
    relationTypeVariety: round2(clamp01(relTypes.length / 5)),
    questionResolution: round2(questionResolutionScore(finalArc)),
    timeUtilization: round2(timeUtil.score),
    routeDistinctiveness: round2(routeDistinctivenessScore(stops)),
  }

  const { adjusted: components, applied: travelerModifiersApplied } = applyTravelerModifiers(componentsBase, request)

  const structuralMonotony = clamp01(
    Math.max(0, longestRun(stops, 'anchor') - ARC_STRUCTURAL_BANDS.maxConsecutiveAnchorRun) * 0.22 +
      Math.max(0, longestRun(stops, 'micro') - ARC_STRUCTURAL_BANDS.maxConsecutiveMicroRun) * 0.12,
  )

  const penalties: ArcQualityPenalties = {
    repetitionPenalty: round2(arcSignals.repetitionPenalty),
    unresolvedSetupPenalty: round2(arcSignals.unresolvedSetupPenalty),
    structuralMonotonyPenalty: round2(structuralMonotony),
    themeMonotonyPenalty: round2(themeMonotonyPenalty(stops, candidate.dominantThemes)),
    relationMonotonyPenalty: round2(
      relRun.run > ARC_STRUCTURAL_BANDS.maxConsecutiveSameRelation ? clamp01((relRun.run - 2) * 0.18) : 0,
    ),
    weakEndingPenalty: round2(ending < 0.45 && request.routeIntent !== 'DISCOVERY' ? clamp01(0.5 - ending) : 0),
    overstuffingPenalty: round2(overstuffingPenalty(candidate)),
    underutilizedBudgetPenalty: round2(timeUtil.penalty),
    backtrackingPenalty: round2(detectBacktracking(stops)),
  }

  const posW = ARC_QUALITY_POSITIVE_WEIGHTS
  const weightedPositiveSum = round2(
    Object.entries(posW).reduce((s, [k, w]) => s + w * components[k as keyof ArcQualityComponents], 0),
  )

  const penW = ARC_QUALITY_PENALTY_WEIGHTS
  const weightedPenaltySum = round2(
    Object.entries(penW).reduce((s, [k, w]) => s + w * penalties[k as keyof ArcQualityPenalties], 0),
  )

  const rawScore = weightedPositiveSum - weightedPenaltySum
  const normalizedScore = round2(clamp01(rawScore) * 100)

  const anchorRun = longestRun(stops, 'anchor')
  return {
    arcQualityStatus: 'PROVISIONAL_V0_1',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
    normalizedScore,
    rawScore: round2(rawScore),
    components,
    penalties,
    weightedPositiveSum,
    weightedPenaltySum,
    unusedBudgetMin: round2(timeUtil.unusedMin),
    unusedBudgetRatio: round2(timeUtil.unusedRatio),
    timeUtilizationReason: timeUtil.reason,
    feasibleWorthwhileContinuations: timeUtil.feasibleCount,
    structuralDistribution: {
      anchors: candidate.anchorCount,
      pockets: candidate.thematicPocketCount,
      micros: candidate.microRevealCount,
      stops: candidate.stopCount,
      anchorRatio: round2(candidate.anchorCount / Math.max(candidate.stopCount, 1)),
      pocketRatio: round2(candidate.thematicPocketCount / Math.max(candidate.stopCount, 1)),
      microRatio: round2(candidate.microRevealCount / Math.max(candidate.stopCount, 1)),
      longestAnchorRun: anchorRun,
    },
    travelerModifiersApplied,
  }
}

/** Safe wrapper returning rejection instead of throw when invalid. */
export function tryComputeArcQuality(
  candidate: RouteCandidateV01,
): { ok: true; arc: ArcQualityResult } | { ok: false; validation: Extract<ArcQualityValidation, { valid: false }> } {
  const validation = validateRouteCandidateForArcQuality(candidate)
  if (!validation.valid) return { ok: false, validation }
  return { ok: true, arc: computeArcQuality(candidate) }
}
