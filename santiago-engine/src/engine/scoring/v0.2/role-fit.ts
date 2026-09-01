/**
 * Gate 2E.2A — continuous RoleFit V0.2.
 */

import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import type { EditorialDimensionsRecord } from '@/src/engine/scoring/v0.2/scoring-types'
import type { RoleFitResult } from '@/src/engine/scoring/v0.2/scoring-types'
import { ROLE_AMBIGUITY_DELTA } from '@/src/engine/scoring/v0.2/scoring-config'
import { dimensionValue } from '@/src/engine/scoring/v0.2/editorial-dimensions'
import { structuralInputs } from '@/src/engine/scoring/v0.2/intrinsic-worth'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import { clamp01, coverageFromKnown, isKnown, round2, weightedMean } from '@/src/engine/scoring/v0.2/utils'

function tierSignal(tier: string | null | undefined, role: string | null | undefined): {
  anchor: number | null
  pocket: number | null
  micro: number | null
} {
  const t = `${tier ?? ''} ${role ?? ''}`.toLowerCase()
  if (t.includes('micro')) return { anchor: 0.15, pocket: 0.35, micro: 0.85 }
  if (t.includes('pocket') || t.includes('thematic')) return { anchor: 0.25, pocket: 0.8, micro: 0.35 }
  if (t.includes('anchor') || t.includes('canonical')) return { anchor: 0.85, pocket: 0.35, micro: 0.15 }
  return { anchor: null, pocket: null, micro: null }
}

export function computeRoleFit(
  semantic: SemanticCalibrationRecord,
  editorial?: EditorialDimensionsRecord,
): RoleFitResult {
  const s = structuralInputs(semantic)
  const ess = dimensionValue(editorial, 'essentiality')
  const disc = dimensionValue(editorial, 'discoveryDensity')
  const orient = dimensionValue(editorial, 'orientationValue')
  const surprise = dimensionValue(editorial, 'surprise')
  const linger = dimensionValue(editorial, 'lingerValue')
  const story = dimensionValue(editorial, 'storyDepth')
  const visual = dimensionValue(editorial, 'visualPayoff')
  const tierFb = tierSignal(semantic.tier, semantic.editorialRole)

  const anchorParts = [
    { v: s.anchorDensity, w: 0.35 },
    { v: s.heritageDepth, w: 0.25 },
    { v: ess, w: 0.25 },
    { v: orient, w: 0.15 },
    { v: tierFb.anchor, w: 0.1 },
  ]
  const pocketParts = [
    { v: disc, w: 0.3 },
    { v: story, w: 0.2 },
    { v: linger, w: 0.2 },
    { v: ess != null ? clamp01(1 - ess * 0.5) : null, w: 0.15 },
    { v: tierFb.pocket, w: 0.15 },
  ]
  const microParts = [
    { v: s.microReveal, w: 0.35 },
    { v: surprise, w: 0.25 },
    { v: visual, w: 0.2 },
    { v: disc, w: 0.1 },
    { v: tierFb.micro, w: 0.1 },
  ]

  function blend(parts: Array<{ v: number | null; w: number }>): { value: number | null; coverage: number } {
    let num = 0
    let den = 0
    let known = 0
    for (const p of parts) {
      if (!isKnown(p.v)) continue
      known += 1
      num += clamp01(p.v!) * p.w
      den += p.w
    }
    if (den <= 0) return { value: null, coverage: 0 }
    return { value: round2(num / den), coverage: coverageFromKnown(known, parts.length) }
  }

  const anchor = blend(anchorParts)
  const pocket = blend(pocketParts)
  const micro = blend(microParts)

  const onlyTier =
    !isKnown(anchor.value) &&
    !isKnown(pocket.value) &&
    !isKnown(micro.value) &&
    (isKnown(tierFb.anchor) || isKnown(tierFb.pocket) || isKnown(tierFb.micro))

  const anchorFit = anchor.value ?? tierFb.anchor
  const pocketFit = pocket.value ?? tierFb.pocket
  const microRevealFit = micro.value ?? tierFb.micro

  const fits = [
    { role: 'anchor' as const, v: anchorFit },
    { role: 'pocket' as const, v: pocketFit },
    { role: 'micro' as const, v: microRevealFit },
  ].filter((x) => isKnown(x.v))
  fits.sort((a, b) => b.v! - a.v!)
  const top = fits[0]
  const second = fits[1]
  const primaryStructuralRole = top?.role ?? 'unknown'
  const roleAmbiguity =
    Boolean(top && second && Math.abs(top.v! - second.v!) <= ROLE_AMBIGUITY_DELTA)

  const coverage = round2((anchor.coverage + pocket.coverage + micro.coverage) / 3)

  const explanation = buildExplanation({
    scoreName: 'RoleFit',
    score: top?.v != null ? round2(top.v * 100) : null,
    coverage,
    provenance: [
      onlyTier ? 'TIER/ROLE_FALLBACK' : 'DERIVED_FROM_SOURCE',
      String(semantic.structuralMetricsProvenance ?? 'UNKNOWN'),
    ],
    plain:
      fits.length === 0
        ? 'RoleFit UNAVAILABLE — insufficient structural/editorial evidence.'
        : `Primary role ${primaryStructuralRole} (anchor=${anchorFit ?? '—'}, pocket=${pocketFit ?? '—'}, micro=${microRevealFit ?? '—'})${roleAmbiguity ? '; roleAmbiguity=true' : ''}.`,
  })

  return {
    anchorFit,
    pocketFit,
    microRevealFit,
    primaryStructuralRole,
    roleAmbiguity,
    coverage,
    confidence: explanation.confidence,
    explanation,
    factors: [
      { key: 'anchorFit', label: 'Anchor fit', value: anchorFit, contribution: anchorFit, available: isKnown(anchorFit) },
      { key: 'pocketFit', label: 'Pocket fit', value: pocketFit, contribution: pocketFit, available: isKnown(pocketFit) },
      {
        key: 'microRevealFit',
        label: 'Micro reveal fit',
        value: microRevealFit,
        contribution: microRevealFit,
        available: isKnown(microRevealFit),
      },
    ],
  }
}

export function computeRolePreferenceFit(
  roleFit: RoleFitResult,
  routeIntent: 'BALANCED' | 'ESSENTIALS' | 'DISCOVERY' | 'THEMATIC' = 'BALANCED',
): number | null {
  const weights =
    routeIntent === 'ESSENTIALS'
      ? { anchor: 0.55, pocket: 0.25, micro: 0.2 }
      : routeIntent === 'DISCOVERY'
        ? { anchor: 0.2, pocket: 0.4, micro: 0.4 }
        : routeIntent === 'THEMATIC'
          ? { anchor: 0.35, pocket: 0.35, micro: 0.3 }
          : { anchor: 0.34, pocket: 0.33, micro: 0.33 }

  const entries = [
    { value: roleFit.anchorFit != null ? roleFit.anchorFit * 100 : null, weight: weights.anchor },
    { value: roleFit.pocketFit != null ? roleFit.pocketFit * 100 : null, weight: weights.pocket },
    { value: roleFit.microRevealFit != null ? roleFit.microRevealFit * 100 : null, weight: weights.micro },
  ]
  return weightedMean(entries.map((e) => ({ value: e.value, weight: e.weight }))).score
}
