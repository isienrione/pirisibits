/**
 * Gate 2D — route-level quality diagnostics with severity + thresholds.
 */

import type { ArcQualityResult } from '@/src/engine/routes/arc-quality'
import type { RouteCandidateV01 } from '@/src/engine/routes/route-types'
import {
  ARC_QUALITY_THRESHOLDS,
  ARC_STRUCTURAL_BANDS,
  TIME_UTILIZATION_CONFIG,
  OVERSTUFFING_CONFIG,
} from '@/src/engine/routes/arc-quality-config'
import { classifyStructure } from '@/src/engine/routes/route-score'

export type DiagnosticSeverity = 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE'

export type RouteQualityDiagnostic = {
  code:
    | 'WEAK_OPENER'
    | 'WEAK_ENDING'
    | 'EXCESSIVE_ANCHOR_RUN'
    | 'EXCESSIVE_MICRO_RUN'
    | 'THEME_MONOTONY'
    | 'RELATION_MONOTONY'
    | 'UNRESOLVED_QUESTIONS'
    | 'WEAK_REVEAL_SPACING'
    | 'UNDERUSED_BUDGET'
    | 'OVERSTUFFED_ROUTE'
    | 'FRAGMENTED_THEMATIC_PROGRESSION'
  severity: DiagnosticSeverity
  value: number
  threshold: number
  explanation: string
}

function longestStructuralRun(stops: RouteCandidateV01['orderedStops'], kind: 'anchor' | 'micro'): number {
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

function longestRelationRun(stops: RouteCandidateV01['orderedStops']): number {
  let best = 0
  let cur = 0
  let last: string | null = null
  for (const s of stops.slice(1)) {
    const r = s.narrativeRelationFromPrevious
    if (r && r === last) {
      cur += 1
      best = Math.max(best, cur + 1)
    } else {
      cur = 0
      last = r
    }
  }
  return best
}

function severityFromRatio(value: number, mild: number, moderate: number, severe: number): DiagnosticSeverity {
  if (value <= 0) return 'NONE'
  if (value >= severe) return 'SEVERE'
  if (value >= moderate) return 'MODERATE'
  if (value >= mild) return 'MILD'
  return 'NONE'
}

export function computeRouteQualityDiagnostics(
  candidate: RouteCandidateV01,
  arc: ArcQualityResult,
): RouteQualityDiagnostic[] {
  const stops = candidate.orderedStops
  const n = stops.length
  const out: RouteQualityDiagnostic[] = []

  if (!n) return out

  const opener = stops[0]!
  const ending = stops[n - 1]!
  const avgUtility = stops.reduce((a, s) => a + s.nodeUtility, 0) / n
  const unusedMin = Math.max(0, candidate.timeBudgetMin - candidate.totalEstimatedMin)
  const unusedRatio = unusedMin / Math.max(1, candidate.timeBudgetMin)

  const weakOpenerVal =
    opener.nodeUtility <= ARC_QUALITY_THRESHOLDS.weakOpenerUtilityMax &&
    classifyStructure(opener.tier, opener.editorialRole) !== 'anchor'
      ? 1 - opener.nodeUtility / 100
      : 0
  out.push({
    code: 'WEAK_OPENER',
    severity: severityFromRatio(weakOpenerVal, 0.2, 0.35, 0.5),
    value: round2(weakOpenerVal),
    threshold: ARC_QUALITY_THRESHOLDS.weakOpenerUtilityMax,
    explanation:
      weakOpenerVal > 0
        ? `Opener ${opener.stgoId} utility ${opener.nodeUtility} is modest for route entry.`
        : 'Opening stop meets provisional strength expectations.',
  })

  const weakEndingVal =
    ending.nodeUtility < avgUtility * ARC_QUALITY_THRESHOLDS.weakEndingRelativeToRouteAvg &&
    ending.nodeUtility <= ARC_QUALITY_THRESHOLDS.weakEndingUtilityMax
      ? 1 - ending.nodeUtility / Math.max(avgUtility, 1)
      : 0
  out.push({
    code: 'WEAK_ENDING',
    severity: severityFromRatio(weakEndingVal, 0.15, 0.3, 0.45),
    value: round2(weakEndingVal),
    threshold: ARC_QUALITY_THRESHOLDS.weakEndingUtilityMax,
    explanation:
      weakEndingVal > 0
        ? `Landing ${ending.stgoId} utility ${ending.nodeUtility} trails route average ${round1(avgUtility)}.`
        : 'Ending stop provides acceptable landing relative to route.',
  })

  const anchorRun = longestStructuralRun(stops, 'anchor')
  out.push({
    code: 'EXCESSIVE_ANCHOR_RUN',
    severity: severityFromRatio(
      Math.max(0, anchorRun - ARC_STRUCTURAL_BANDS.maxConsecutiveAnchorRun),
      1,
      2,
      3,
    ),
    value: anchorRun,
    threshold: ARC_STRUCTURAL_BANDS.maxConsecutiveAnchorRun,
    explanation:
      anchorRun > ARC_STRUCTURAL_BANDS.maxConsecutiveAnchorRun
        ? `${anchorRun} consecutive anchor-scale stops may feel monotonous.`
        : 'Anchor rhythm within provisional band.',
  })

  const microRun = longestStructuralRun(stops, 'micro')
  out.push({
    code: 'EXCESSIVE_MICRO_RUN',
    severity: severityFromRatio(Math.max(0, microRun - ARC_STRUCTURAL_BANDS.maxConsecutiveMicroRun), 1, 2, 3),
    value: microRun,
    threshold: ARC_STRUCTURAL_BANDS.maxConsecutiveMicroRun,
    explanation:
      microRun > ARC_STRUCTURAL_BANDS.maxConsecutiveMicroRun
        ? `${microRun} consecutive micro beats may blur together.`
        : 'Micro-reveal spacing acceptable.',
  })

  out.push({
    code: 'THEME_MONOTONY',
    severity: severityFromRatio(arc.penalties.themeMonotonyPenalty, 0.15, 0.3, 0.5),
    value: round2(arc.penalties.themeMonotonyPenalty),
    threshold: 0.3,
    explanation:
      arc.penalties.themeMonotonyPenalty > 0.15
        ? 'Dominant theme repeats without meaningful contrast.'
        : 'Theme variety within provisional expectations.',
  })

  out.push({
    code: 'RELATION_MONOTONY',
    severity: severityFromRatio(arc.penalties.relationMonotonyPenalty, 0.1, 0.25, 0.4),
    value: round2(arc.penalties.relationMonotonyPenalty),
    threshold: 0.25,
    explanation:
      arc.penalties.relationMonotonyPenalty > 0.1
        ? 'Identical narrative relation types cluster consecutively (mild signal).'
        : 'Relation-type rhythm acceptable given graph constraints.',
  })

  const unresolved = arc.components.questionResolution < 0.45 ? arc.penalties.unresolvedSetupPenalty : 0
  out.push({
    code: 'UNRESOLVED_QUESTIONS',
    severity: severityFromRatio(unresolved, 0.15, 0.3, 0.5),
    value: round2(unresolved),
    threshold: 0.3,
    explanation:
      unresolved > 0
        ? 'Narrative metadata questions remain open at route end.'
        : 'Opened questions resolved or none authored.',
  })

  out.push({
    code: 'WEAK_REVEAL_SPACING',
    severity: severityFromRatio(1 - arc.components.revealSpacing, 0.2, 0.35, 0.5),
    value: round2(arc.components.revealSpacing),
    threshold: 0.5,
    explanation:
      arc.components.revealSpacing < 0.5
        ? 'Reveal beats clustered or absent relative to route length.'
        : 'Reveal spacing within provisional band.',
  })

  out.push({
    code: 'UNDERUSED_BUDGET',
    severity: severityFromRatio(arc.penalties.underutilizedBudgetPenalty, 0.1, 0.25, 0.45),
    value: round2(unusedRatio),
    threshold: TIME_UTILIZATION_CONFIG.unusedBudgetPenaltyThreshold,
    explanation: arc.timeUtilizationReason,
  })

  const stopsPerHour = (n / Math.max(candidate.totalEstimatedMin, 1)) * 60
  const avgDwell = candidate.dwellMin / Math.max(n, 1)
  const transitionDensity = candidate.movementMin / Math.max(candidate.totalEstimatedMin, 1)
  const overstuffVal = Math.max(
    0,
    stopsPerHour / OVERSTUFFING_CONFIG.maxStopsPerHour - 1,
    (OVERSTUFFING_CONFIG.minAvgDwellMin - avgDwell) / OVERSTUFFING_CONFIG.minAvgDwellMin,
    transitionDensity - OVERSTUFFING_CONFIG.maxTransitionDensity,
  )
  out.push({
    code: 'OVERSTUFFED_ROUTE',
    severity: severityFromRatio(overstuffVal, 0.1, 0.25, 0.4),
    value: round2(overstuffVal),
    threshold: OVERSTUFFING_CONFIG.maxStopsPerHour,
    explanation:
      overstuffVal > 0.1
        ? `High stop density (${round1(stopsPerHour)}/hr) or compressed dwell (${round1(avgDwell)} min avg).`
        : 'Pacing leaves breathing room.',
  })

  const fragmentedVal = arc.components.thematicCoherence < 0.4 ? 1 - arc.components.thematicCoherence : 0
  out.push({
    code: 'FRAGMENTED_THEMATIC_PROGRESSION',
    severity: severityFromRatio(fragmentedVal, 0.2, 0.35, 0.5),
    value: round2(fragmentedVal),
    threshold: 0.4,
    explanation:
      fragmentedVal > 0.2
        ? 'Theme jumps without pockets/contrast to bridge progression.'
        : 'Thematic progression coherent for traveler intent.',
  })

  return out
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
