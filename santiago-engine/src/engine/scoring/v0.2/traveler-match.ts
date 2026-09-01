/**
 * Gate 2E.2A — TravelerMatch V0.2.
 *
 * ThematicAffinity uses weighted dot-product normalization (not cosine-only):
 *   affinity = 100 × Σ(traveler_w[t] × poi_v[t]) / Σ(traveler_w[t])  for known poi themes t
 * Zero traveler weight sum or zero known poi overlap → UNAVAILABLE (not 0).
 */

import type { ThemeCode } from '@/src/lib/city-graph/types'
import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import type { TravelerModel } from '@/src/engine/types'
import type { RouteIntent } from '@/src/engine/routes/route-types'
import type { EditorialDimensionsRecord, RoleFitResult, TravelerMatchResult } from '@/src/engine/scoring/v0.2/scoring-types'
import { dimensionValue } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { computeIntrinsicWorth } from '@/src/engine/scoring/v0.2/intrinsic-worth'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import {
  D1_DIMENSION_WEIGHTS,
  D2_DIMENSION_WEIGHTS,
  D3_DIMENSION_WEIGHTS,
  F1_FAMILIARITY_WEIGHTS,
  F3_FAMILIARITY_WEIGHTS,
  STRUCTURAL_PREFERENCE_BY_INTENT,
  TRAVELER_MATCH_COMPONENT_WEIGHTS,
  TRAVELER_MATCH_CONFIG_STATUS,
  EXPRESS_STRUCTURAL_BOOST,
} from '@/src/engine/scoring/v0.2/traveler-match-config'
import { clamp01, coverageFromKnown, isKnown, round1, weightedMean } from '@/src/engine/scoring/v0.2/utils'
import { THEME_CODES } from '@/src/engine/taxonomy'

export function computeThematicAffinity(
  traveler: TravelerModel,
  semantic: SemanticCalibrationRecord,
): { score: number | null; coverage: number; matched: ThemeCode[] } {
  let num = 0
  let den = 0
  let knownThemes = 0
  const matched: ThemeCode[] = []
  for (const t of THEME_CODES) {
    const tw = traveler.themeWeights[t] ?? 0
    if (tw <= 0) continue
    den += tw
    const pv = semantic.thematicVector?.[t]
    if (!isKnown(pv)) continue
    knownThemes += 1
    num += tw * clamp01(pv!)
    if (clamp01(pv!) >= 0.35) matched.push(t)
  }
  if (den <= 0 || knownThemes === 0) return { score: null, coverage: 0, matched: [] }
  return {
    score: round1((num / den) * 100),
    coverage: coverageFromKnown(knownThemes, THEME_CODES.filter((t) => (traveler.themeWeights[t] ?? 0) > 0).length || 1),
    matched,
  }
}

function coverageAwareBlend(
  weights: Record<string, number>,
  values: Record<string, number | null>,
): { score: number | null; coverage: number } {
  let num = 0
  let den = 0
  let known = 0
  const total = Object.keys(weights).length
  for (const [k, w] of Object.entries(weights)) {
    const v = values[k]
    if (!isKnown(v)) continue
    known += 1
    num += clamp01(v!) * w
    den += w
  }
  if (den <= 0) return { score: null, coverage: coverageFromKnown(known, total) }
  return { score: round1(clamp01(num / den) * 100), coverage: coverageFromKnown(known, total) }
}

export function computeDiscoveryPostureAffinity(
  posture: TravelerModel['discoveryPosture'],
  editorial: EditorialDimensionsRecord | undefined,
  roleFit: RoleFitResult,
  intrinsicRaw: number | null,
): { score: number | null; coverage: number } {
  const values: Record<string, number | null> = {
    discoveryDensity: dimensionValue(editorial, 'discoveryDensity'),
    surprise: dimensionValue(editorial, 'surprise'),
    localness: dimensionValue(editorial, 'localness'),
    microRevealFit: roleFit.microRevealFit,
    pocketFit: roleFit.pocketFit,
    storyDepth: dimensionValue(editorial, 'storyDepth'),
    essentiality: dimensionValue(editorial, 'essentiality'),
    anchorFit: roleFit.anchorFit,
    intrinsicWorthNorm: isKnown(intrinsicRaw) ? clamp01(intrinsicRaw! / 100) : null,
    orientationValue: dimensionValue(editorial, 'orientationValue'),
  }

  if (posture === 'D1') return coverageAwareBlend(D1_DIMENSION_WEIGHTS as Record<string, number>, values)
  if (posture === 'D2') return coverageAwareBlend(D2_DIMENSION_WEIGHTS as Record<string, number>, values)
  return coverageAwareBlend(D3_DIMENSION_WEIGHTS as Record<string, number>, values)
}

export function computeFamiliarityAffinity(
  familiarity: 'F1' | 'F2' | 'F3',
  editorial: EditorialDimensionsRecord | undefined,
): { score: number | null; coverage: number } {
  if (familiarity === 'F2') {
    const ess = dimensionValue(editorial, 'essentiality')
    const loc = dimensionValue(editorial, 'localness')
    return coverageAwareBlend({ essentiality: 0.5, localness: 0.5 }, { essentiality: ess, localness: loc })
  }
  if (familiarity === 'F1') {
    return coverageAwareBlend(F1_FAMILIARITY_WEIGHTS as Record<string, number>, {
      orientationValue: dimensionValue(editorial, 'orientationValue'),
      essentiality: dimensionValue(editorial, 'essentiality'),
    })
  }
  return coverageAwareBlend(F3_FAMILIARITY_WEIGHTS as Record<string, number>, {
    surprise: dimensionValue(editorial, 'surprise'),
    localness: dimensionValue(editorial, 'localness'),
  })
}

export function computeStructuralPreference(
  traveler: TravelerModel,
  roleFit: RoleFitResult,
  routeIntent: RouteIntent = 'BALANCED',
): { score: number | null; coverage: number } {
  const w = STRUCTURAL_PREFERENCE_BY_INTENT[routeIntent]
  let anchorW = w.anchor
  let orientBoost = 0
  if (traveler.expressPreference) {
    anchorW += EXPRESS_STRUCTURAL_BOOST.anchor
    orientBoost = EXPRESS_STRUCTURAL_BOOST.orientation
  }
  const entries = [
    { value: roleFit.anchorFit != null ? roleFit.anchorFit * 100 : null, weight: anchorW },
    { value: roleFit.pocketFit != null ? roleFit.pocketFit * 100 : null, weight: w.pocket },
    { value: roleFit.microRevealFit != null ? roleFit.microRevealFit * 100 : null, weight: w.micro },
  ]
  const base = weightedMean(entries)
  if (!isKnown(base.score) && orientBoost > 0) return { score: null, coverage: base.coverage }
  if (orientBoost > 0 && isKnown(base.score)) {
    return { score: round1(Math.min(100, base.score! + orientBoost * 100)), coverage: base.coverage }
  }
  return base
}

export function computeContextAffinity(traveler: TravelerModel, semantic: SemanticCalibrationRecord): {
  score: number | null
  coverage: number
} {
  const parts: Array<{ value: number | null; weight: number }> = []
  if (traveler.expressPreference) parts.push({ value: 75, weight: 0.4 })
  if (traveler.familyContext) {
    const m3 = semantic.structuralSuitability?.M3?.value
    parts.push({ value: isKnown(m3) ? clamp01(m3!) * 100 : null, weight: 0.35 })
  }
  if (traveler.nightContext) {
    const daylight = semantic.flags?.daylight_only?.value
    parts.push({
      value: daylight === true ? 20 : daylight === false ? 80 : null,
      weight: 0.25,
    })
  }
  if (traveler.highComfort) {
    const m5 = semantic.structuralSuitability?.M5?.value
    parts.push({ value: isKnown(m5) ? clamp01(m5!) * 100 : null, weight: 0.3 })
  }
  if (!parts.length) return { score: 50, coverage: 0.2 }
  return weightedMean(parts)
}

export function computeTravelerMatch(args: {
  semantic: SemanticCalibrationRecord
  editorial?: EditorialDimensionsRecord
  traveler: TravelerModel
  roleFit: RoleFitResult
  intrinsicRaw: number | null
  routeIntent?: RouteIntent
  familiarity?: 'F1' | 'F2' | 'F3'
}): TravelerMatchResult {
  const thematic = computeThematicAffinity(args.traveler, args.semantic)
  const discovery = computeDiscoveryPostureAffinity(
    args.traveler.discoveryPosture,
    args.editorial,
    args.roleFit,
    args.intrinsicRaw,
  )
  const familiarity = computeFamiliarityAffinity(args.familiarity ?? 'F1', args.editorial)
  const structural = computeStructuralPreference(args.traveler, args.roleFit, args.routeIntent ?? 'BALANCED')
  const context = computeContextAffinity(args.traveler, args.semantic)

  const components = {
    thematicAffinity: thematic.score,
    discoveryPostureAffinity: discovery.score,
    familiarityAffinity: familiarity.score,
    structuralPreference: structural.score,
    contextAffinity: context.score,
  }

  const wm = weightedMean([
    { value: components.thematicAffinity, weight: TRAVELER_MATCH_COMPONENT_WEIGHTS.thematicAffinity },
    { value: components.discoveryPostureAffinity, weight: TRAVELER_MATCH_COMPONENT_WEIGHTS.discoveryPostureAffinity },
    { value: components.familiarityAffinity, weight: TRAVELER_MATCH_COMPONENT_WEIGHTS.familiarityAffinity },
    { value: components.structuralPreference, weight: TRAVELER_MATCH_COMPONENT_WEIGHTS.structuralPreference },
    { value: components.contextAffinity, weight: TRAVELER_MATCH_COMPONENT_WEIGHTS.contextAffinity },
  ])

  const weightedContributions: Record<string, number | null> = {}
  for (const [k, w] of Object.entries(TRAVELER_MATCH_COMPONENT_WEIGHTS)) {
    const compKey =
      k === 'thematicAffinity'
        ? 'thematicAffinity'
        : k === 'discoveryPostureAffinity'
          ? 'discoveryPostureAffinity'
          : k === 'familiarityAffinity'
            ? 'familiarityAffinity'
            : k === 'structuralPreference'
              ? 'structuralPreference'
              : 'contextAffinity'
    const v = components[compKey as keyof typeof components]
    weightedContributions[k] = isKnown(v) ? round1(v! * w) : null
  }

  const explanation = buildExplanation({
    scoreName: 'TravelerMatch',
    score: wm.score,
    coverage: wm.coverage,
    positive: thematic.matched.map((t) => ({
      key: t,
      label: `Theme ${t}`,
      value: args.semantic.thematicVector?.[t] ?? null,
      contribution: round1((args.semantic.thematicVector?.[t] ?? 0) * 10),
      available: isKnown(args.semantic.thematicVector?.[t] ?? null),
    })),
    unknown: Object.entries(components)
      .filter(([, v]) => !isKnown(v))
      .map(([k]) => k),
    provenance: [TRAVELER_MATCH_CONFIG_STATUS],
    plain: `TravelerMatch ${wm.score ?? 'UNAVAILABLE'} — thematic ${thematic.score ?? '—'}, discovery ${discovery.score ?? '—'}, structural ${structural.score ?? '—'}.`,
  })

  return {
    score: wm.score,
    coverage: wm.coverage,
    confidence: explanation.confidence,
    components,
    weightedContributions,
    explanation,
  }
}
