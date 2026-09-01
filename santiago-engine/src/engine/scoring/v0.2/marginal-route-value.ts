/**
 * Gate 2E.2A — MarginalRouteValue V0.2 primitives.
 */

import type { ThemeCode } from '@/src/lib/city-graph/types'
import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import type {
  EditorialDimensionsRecord,
  MarginalRouteValueResult,
  RoleFitResult,
  RouteStateContext,
} from '@/src/engine/scoring/v0.2/scoring-types'
import type { TravelerModel } from '@/src/engine/types'
import { MARGINAL_ROUTE_VALUE_WEIGHTS, RECENT_ROUTE_WINDOW, THEMATIC_DEEP_DIVE_ATTENUATION } from '@/src/engine/scoring/v0.2/scoring-config'
import { dimensionValue } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import { clamp01, coverageFromKnown, isKnown, round1, round2, weightedMean } from '@/src/engine/scoring/v0.2/utils'
import { THEME_CODES } from '@/src/engine/taxonomy'

function dominantThemes(vec: Partial<Record<ThemeCode, number | null>> | undefined): ThemeCode[] {
  return THEME_CODES.filter((t) => isKnown(vec?.[t]) && clamp01(vec![t]!) >= 0.45)
}

export function computeNewThemeValue(
  semantic: SemanticCalibrationRecord,
  routeThemes: ThemeCode[],
): number | null {
  const nodeThemes = dominantThemes(semantic.thematicVector)
  if (!nodeThemes.length) return null
  const seen = new Set(routeThemes)
  const novel = nodeThemes.filter((t) => !seen.has(t))
  if (novel.length) return clamp01(novel.length / nodeThemes.length)
  const overlap = nodeThemes.filter((t) => seen.has(t)).length / nodeThemes.length
  return clamp01(1 - overlap * 0.7)
}

export function computeStructuralNovelty(
  roleFit: RoleFitResult,
  routeState: RouteStateContext,
): number | null {
  const recent = routeState.recentStgoIds.length
  if (recent === 0) return roleFit.anchorFit ?? roleFit.pocketFit ?? roleFit.microRevealFit
  const anchorRatio = routeState.anchorCount / Math.max(1, routeState.routeSoFarStgoIds.length)
  const microRatio = routeState.microCount / Math.max(1, routeState.routeSoFarStgoIds.length)
  if (anchorRatio >= 0.6 && isKnown(roleFit.microRevealFit)) return clamp01(roleFit.microRevealFit! + 0.15)
  if (microRatio >= 0.5 && isKnown(roleFit.anchorFit)) return clamp01(roleFit.anchorFit! + 0.1)
  if (isKnown(roleFit.pocketFit)) return roleFit.pocketFit
  return null
}

export function computeDiscoveryValue(
  editorial: EditorialDimensionsRecord | undefined,
  traveler: TravelerModel,
): number | null {
  const disc = dimensionValue(editorial, 'discoveryDensity')
  const surprise = dimensionValue(editorial, 'surprise')
  const local = dimensionValue(editorial, 'localness')
  const boost = traveler.discoveryPosture === 'D1' ? 0.1 : traveler.discoveryPosture === 'D2' ? 0.05 : 0
  const parts = [disc, surprise, local].filter(isKnown)
  if (!parts.length) return null
  return clamp01(parts.reduce((a, b) => a + b, 0) / parts.length + boost)
}

export function computeNarrativeProgression(routeState: RouteStateContext): number | null {
  const arc = routeState.arcState
  if (!arc.recentPOIs.length) return 0.55
  const intensity = arc.emotionalIntensity
  const reveal = arc.revealCount
  return clamp01(0.35 + intensity * 0.25 + Math.min(0.35, reveal * 0.08))
}

export function computeQuestionPayoff(routeState: RouteStateContext): number | null {
  const opened = routeState.arcState.questionsOpened.length
  const resolved = routeState.arcState.questionsResolved.length
  if (opened === 0) return 0.3
  const pending = opened - resolved
  return clamp01(Math.min(1, pending > 0 ? 0.75 : 0.25))
}

export function computeRoleNeedFit(
  roleFit: RoleFitResult,
  routeState: RouteStateContext,
  traveler: TravelerModel,
): { score: number | null; explanation: string } {
  const n = Math.max(1, routeState.routeSoFarStgoIds.length)
  const anchorRatio = routeState.anchorCount / n
  const microRatio = routeState.microCount / n
  const pocketRatio = routeState.pocketCount / n

  let needAnchor = clamp01(0.35 - anchorRatio + (routeState.routeIntent === 'ESSENTIALS' ? 0.2 : 0))
  let needPocket = clamp01(0.25 - pocketRatio + (traveler.discoveryPosture === 'D1' ? 0.15 : 0))
  let needMicro = clamp01(0.2 - microRatio + (traveler.discoveryPosture === 'D1' ? 0.1 : 0))

  if (anchorRatio >= 0.65) {
    needPocket = clamp01(needPocket + 0.25)
    needMicro = clamp01(needMicro + 0.2)
  }
  if (microRatio >= 0.45) {
    needAnchor = clamp01(needAnchor + 0.15)
    needPocket = clamp01(needPocket + 0.1)
  }
  if (traveler.expressPreference) {
    needPocket *= 0.6
    needMicro *= 0.6
  }

  const parts = [
    { v: roleFit.anchorFit, need: needAnchor },
    { v: roleFit.pocketFit, need: needPocket },
    { v: roleFit.microRevealFit, need: needMicro },
  ]
  let num = 0
  let den = 0
  for (const p of parts) {
    if (!isKnown(p.v)) continue
    num += p.v! * p.need
    den += p.need
  }
  if (den <= 0) return { score: null, explanation: 'RoleNeedFit unavailable — no role propensity evidence.' }
  const score = round2(num / den)
  return {
    score,
    explanation: `Role need after ${routeState.anchorCount}A/${routeState.pocketCount}P/${routeState.microCount}M — anchor need ${round2(needAnchor)}, pocket ${round2(needPocket)}, micro ${round2(needMicro)}.`,
  }
}

export function computeRedundancy(
  semantic: SemanticCalibrationRecord,
  routeState: RouteStateContext,
): number | null {
  const recentThemes = new Set(routeState.routeThemes.slice(-RECENT_ROUTE_WINDOW))
  const nodeThemes = dominantThemes(semantic.thematicVector)
  if (!nodeThemes.length) return null
  const themeOverlap = nodeThemes.filter((t) => recentThemes.has(t)).length / nodeThemes.length
  let penalty = themeOverlap
  if (routeState.routeIntent === 'THEMATIC') penalty *= THEMATIC_DEEP_DIVE_ATTENUATION
  const role = semantic.tier?.includes('anchor')
    ? 'anchor'
    : semantic.tier?.includes('micro')
      ? 'micro'
      : semantic.tier?.includes('pocket')
        ? 'pocket'
        : null
  if (role && routeState.recentStgoIds.length >= 2) {
    const recentRoles = routeState.routeSoFarStgoIds.slice(-RECENT_ROUTE_WINDOW)
    if (recentRoles.length >= 2 && role === 'anchor' && routeState.anchorCount >= 3) penalty += 0.15
  }
  return clamp01(penalty)
}

export function computeGeographicProgression(routeState: RouteStateContext): number | null {
  if (routeState.geographicEvidenceAvailable === false) return null
  if (routeState.bearingReversal === true) return 0.15
  if (routeState.bearingReversal === false) return 0.75
  if (isKnown(routeState.transitionDistanceM)) {
    const d = routeState.transitionDistanceM!
    if (d > 900) return 0.35
    if (d < 250) return 0.85
    return 0.6
  }
  return null
}

export function computeMarginalRouteValue(args: {
  semantic: SemanticCalibrationRecord
  editorial?: EditorialDimensionsRecord
  roleFit: RoleFitResult
  traveler: TravelerModel
  routeState: RouteStateContext
}): MarginalRouteValueResult {
  const rs = args.routeState
  const components = {
    newThemeValue: computeNewThemeValue(args.semantic, rs.routeThemes),
    structuralNovelty: computeStructuralNovelty(args.roleFit, rs),
    discoveryValue: computeDiscoveryValue(args.editorial, args.traveler),
    narrativeProgression: computeNarrativeProgression(rs),
    questionPayoff: computeQuestionPayoff(rs),
    roleNeedFit: computeRoleNeedFit(args.roleFit, rs, args.traveler).score,
    geographicProgression: computeGeographicProgression(rs),
    redundancy: computeRedundancy(args.semantic, rs),
  }

  const positiveEntries = [
    { value: components.newThemeValue != null ? components.newThemeValue * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.newThemeValue },
    { value: components.structuralNovelty != null ? components.structuralNovelty * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.structuralNovelty },
    { value: components.discoveryValue != null ? components.discoveryValue * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.discoveryValue },
    { value: components.narrativeProgression != null ? components.narrativeProgression * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.narrativeProgression },
    { value: components.questionPayoff != null ? components.questionPayoff * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.questionPayoff },
    { value: components.roleNeedFit != null ? components.roleNeedFit * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.roleNeedFit },
    { value: components.geographicProgression != null ? components.geographicProgression * 100 : null, weight: MARGINAL_ROUTE_VALUE_WEIGHTS.geographicProgression },
  ]
  const pos = weightedMean(positiveEntries)
  const red = isKnown(components.redundancy)
    ? components.redundancy! * 100 * MARGINAL_ROUTE_VALUE_WEIGHTS.redundancyPenalty
    : 0
  const score = pos.score != null ? round1(Math.max(0, pos.score - red)) : null

  const roleNeed = computeRoleNeedFit(args.roleFit, rs, args.traveler)
  const explanation = buildExplanation({
    scoreName: 'MarginalRouteValue',
    score,
    coverage: pos.coverage,
    plain: `MarginalRouteValue ${score ?? 'UNAVAILABLE'} for route step ${rs.routeSoFarStgoIds.length + 1}. ${roleNeed.explanation}`,
    extras: {
      whatThisAddsNow: isKnown(components.newThemeValue)
        ? `Adds theme novelty ~${round2(components.newThemeValue!)}`
        : 'Theme contribution unknown',
      whatWouldBeRedundant: isKnown(components.redundancy)
        ? `Redundancy penalty ~${round2(components.redundancy!)}`
        : undefined,
      roleNeedBeingFilled: roleNeed.explanation,
    },
  })

  const weightedContributions: Record<string, number | null> = {}
  for (const [k, w] of Object.entries(MARGINAL_ROUTE_VALUE_WEIGHTS)) {
    if (k === 'redundancyPenalty') continue
    const comp = k.replace('Value', 'Value') as keyof typeof components
    const mapKey =
      k === 'newThemeValue'
        ? 'newThemeValue'
        : k === 'structuralNovelty'
          ? 'structuralNovelty'
          : k === 'discoveryValue'
            ? 'discoveryValue'
            : k === 'narrativeProgression'
              ? 'narrativeProgression'
              : k === 'questionPayoff'
                ? 'questionPayoff'
                : k === 'roleNeedFit'
                  ? 'roleNeedFit'
                  : 'geographicProgression'
    const v = components[mapKey as keyof typeof components]
    weightedContributions[k] = isKnown(v) ? round1(v! * 100 * w) : null
  }

  return {
    score,
    coverage: pos.coverage,
    confidence: explanation.confidence,
    components,
    weightedContributions,
    explanation,
  }
}
