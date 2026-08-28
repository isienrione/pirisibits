/**
 * Gate 2B — deterministic NarrativeEdgeScore.
 * No runtime LLM. UNKNOWN semantics stay unavailable (not zero).
 */

import {
  NARRATIVE_EDGE_SCORE_MAX,
  NARRATIVE_EDGE_SCORE_MIN,
  NARRATIVE_EDGE_SCORE_WEIGHTS,
  RELIEF_POLISH_DROP,
  REVEAL_MICRO_MIN,
  SPATIAL_EXCELLENT_M,
  SPATIAL_FAIR_M,
  SPATIAL_GOOD_M,
  STRUCTURAL_CONTRAST_DELTA,
} from '@/src/engine/narrative/narrative-constants'
import type {
  NarrativeEdgeScoreComponents,
  NarrativeEdgeScoreResult,
  NarrativeRelationType,
} from '@/src/engine/narrative/narrative-types'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import { THEME_CODES } from '@/src/engine/taxonomy'

export type NarrativeScoreNodeView = {
  stgoId: string
  displayName: string
  tier: string | null
  editorialRole: string | null
  thematicVector: Partial<Record<ThemeCode, number | null>> | null
  structuralMetrics: {
    heritage_depth: number | null
    anchor_density: number | null
    micro_reveal: number | null
    polish: number | null
  } | null
  thematicAvailability: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
  structuralAvailability: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
}

export type NarrativeScoreContext = {
  relationType: NarrativeRelationType
  spatialDistanceM: number | null
  prerequisites: string[]
  prerequisitesSatisfied: boolean
  unresolvedPrerequisites: string[]
  repetitionTags: string[]
  repetitionTagsSeen: string[]
  recentRelationTypes: NarrativeRelationType[]
}

function clamp(n: number, lo = NARRATIVE_EDGE_SCORE_MIN, hi = NARRATIVE_EDGE_SCORE_MAX): number {
  return Math.max(lo, Math.min(hi, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && !Number.isNaN(v)
}

/** Cosine similarity over known theme dimensions only. Returns null if either side lacks usable themes. */
export function themeSimilarity(
  a: Partial<Record<ThemeCode, number | null>> | null | undefined,
  b: Partial<Record<ThemeCode, number | null>> | null | undefined,
): number | null {
  if (!a || !b) return null
  const dims: ThemeCode[] = []
  for (const t of THEME_CODES) {
    if (isNum(a[t]) && isNum(b[t])) dims.push(t)
  }
  if (dims.length < 3) return null
  let dot = 0
  let na = 0
  let nb = 0
  for (const t of dims) {
    const av = a[t] as number
    const bv = b[t] as number
    dot += av * bv
    na += av * av
    nb += bv * bv
  }
  if (na <= 0 || nb <= 0) return null
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function topThemes(
  vector: Partial<Record<ThemeCode, number | null>> | null | undefined,
  n = 3,
): ThemeCode[] {
  if (!vector) return []
  return THEME_CODES.map((t) => [t, vector[t]] as const)
    .filter(([, v]) => isNum(v) && (v as number) > 0.05)
    .sort((a, b) => (b[1] as number) - (a[1] as number) || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([t]) => t)
}

function metric(
  m: NarrativeScoreNodeView['structuralMetrics'],
  key: keyof NonNullable<NarrativeScoreNodeView['structuralMetrics']>,
): number | null {
  if (!m) return null
  const v = m[key]
  return isNum(v) ? v : null
}

function spatialLegibility(distanceM: number | null): number | null {
  if (distanceM == null) return null
  if (distanceM <= SPATIAL_EXCELLENT_M) return 1
  if (distanceM <= SPATIAL_GOOD_M) return 0.75
  if (distanceM <= SPATIAL_FAIR_M) return 0.45
  return 0.2
}

function semanticContinuity(from: NarrativeScoreNodeView, to: NarrativeScoreNodeView): number | null {
  const sim = themeSimilarity(from.thematicVector, to.thematicVector)
  if (sim == null) return null
  return clamp(sim, 0, 1)
}

function contrastSurprise(from: NarrativeScoreNodeView, to: NarrativeScoreNodeView, relation: NarrativeRelationType): number | null {
  const fp = metric(from.structuralMetrics, 'polish')
  const tp = metric(to.structuralMetrics, 'polish')
  const fh = metric(from.structuralMetrics, 'heritage_depth')
  const th = metric(to.structuralMetrics, 'heritage_depth')
  const fa = metric(from.structuralMetrics, 'anchor_density')
  const ta = metric(to.structuralMetrics, 'anchor_density')
  const deltas: number[] = []
  if (fp != null && tp != null) deltas.push(Math.abs(fp - tp))
  if (fh != null && th != null) deltas.push(Math.abs(fh - th))
  if (fa != null && ta != null) deltas.push(Math.abs(fa - ta))
  if (!deltas.length) {
    if (relation === 'contrast') return 0.35 // weak structural-unknown contrast signal only when typed contrast
    return null
  }
  const maxDelta = Math.max(...deltas)
  const base = maxDelta >= STRUCTURAL_CONTRAST_DELTA ? Math.min(1, maxDelta / 0.7) : maxDelta / STRUCTURAL_CONTRAST_DELTA * 0.4
  return clamp(relation === 'contrast' ? Math.max(base, 0.55) : base * 0.5, 0, 1)
}

function revealValue(from: NarrativeScoreNodeView, to: NarrativeScoreNodeView, relation: NarrativeRelationType): number | null {
  const tm = metric(to.structuralMetrics, 'micro_reveal')
  const fromTier = (from.tier || from.editorialRole || '').toLowerCase()
  const toTier = (to.tier || to.editorialRole || '').toLowerCase()
  const tierReveal =
    /anchor|canonical/.test(fromTier) && /micro/.test(toTier)
      ? 0.85
      : /pocket|thematic/.test(fromTier) && /micro/.test(toTier)
        ? 0.7
        : null
  if (tm == null && tierReveal == null) {
    return relation === 'reveal' ? 0.4 : null
  }
  const metricPart = tm != null && tm >= REVEAL_MICRO_MIN ? Math.min(1, tm) : tm != null ? tm * 0.5 : 0
  const combined = Math.max(metricPart, tierReveal ?? 0)
  return clamp(relation === 'reveal' ? Math.max(combined, 0.55) : combined * 0.6, 0, 1)
}

function escalationDeepening(
  from: NarrativeScoreNodeView,
  to: NarrativeScoreNodeView,
  relation: NarrativeRelationType,
): number | null {
  const fh = metric(from.structuralMetrics, 'heritage_depth')
  const th = metric(to.structuralMetrics, 'heritage_depth')
  const fa = metric(from.structuralMetrics, 'anchor_density')
  const ta = metric(to.structuralMetrics, 'anchor_density')
  const fromTier = (from.tier || '').toLowerCase()
  const toTier = (to.tier || '').toLowerCase()
  let score: number | null = null
  if (fh != null && th != null && th > fh + 0.1) score = Math.min(1, (th - fh) / 0.5)
  if (fa != null && ta != null && ta > fa + 0.1) {
    const bump = Math.min(1, (ta - fa) / 0.5)
    score = score == null ? bump : Math.max(score, bump)
  }
  if (/micro|pocket/.test(fromTier) && /anchor|canonical/.test(toTier)) {
    score = Math.max(score ?? 0, 0.75)
  }
  if (relation === 'deepens_context' || relation === 'escalation') {
    score = Math.max(score ?? 0.35, score ?? 0.35)
  }
  return score == null ? null : clamp(score, 0, 1)
}

function reliefValue(from: NarrativeScoreNodeView, to: NarrativeScoreNodeView, relation: NarrativeRelationType): number | null {
  const fp = metric(from.structuralMetrics, 'polish')
  const tp = metric(to.structuralMetrics, 'polish')
  const fh = metric(from.structuralMetrics, 'heritage_depth')
  const toThemes = topThemes(to.thematicVector, 2)
  const greenRelief = toThemes.includes('T5') || toThemes.includes('T7')
  let score: number | null = null
  if (fp != null && tp != null && fp - tp >= RELIEF_POLISH_DROP) score = Math.min(1, (fp - tp) / 0.5)
  if (fh != null && fh >= 0.7 && greenRelief) score = Math.max(score ?? 0, 0.7)
  if (relation === 'relief') score = Math.max(score ?? 0.4, score ?? 0.4)
  return score == null ? null : clamp(score, 0, 1)
}

function causalContinuity(relation: NarrativeRelationType, hasEditorialEvidence: boolean): number | null {
  if (relation === 'causal_followup' || relation === 'resolves_question') {
    return hasEditorialEvidence ? 0.7 : null // unavailable → do not invent causality
  }
  if (relation === 'sets_up' || relation === 'deepens_context') return hasEditorialEvidence ? 0.45 : 0.2
  return 0.05
}

function repetitionPenaltyValue(ctx: NarrativeScoreContext): number {
  const tagHits = ctx.repetitionTags.filter((t) => ctx.repetitionTagsSeen.includes(t)).length
  const relHits = ctx.recentRelationTypes.filter((r) => r === ctx.relationType).length
  return clamp(tagHits * 0.25 + relHits * 0.2, 0, 1)
}

/**
 * Deterministic NarrativeEdgeScore for a directed pair + relation context.
 */
export function scoreNarrativeEdge(
  from: NarrativeScoreNodeView,
  to: NarrativeScoreNodeView,
  ctx: NarrativeScoreContext,
  opts?: { hasEditorialCausalEvidence?: boolean },
): NarrativeEdgeScoreResult {
  const hasEvidence = Boolean(opts?.hasEditorialCausalEvidence)
  const components: NarrativeEdgeScoreComponents = {
    semanticContinuity: semanticContinuity(from, to),
    causalContinuity: causalContinuity(ctx.relationType, hasEvidence),
    contrastSurprise: contrastSurprise(from, to, ctx.relationType),
    revealValue: revealValue(from, to, ctx.relationType),
    escalationDeepening: escalationDeepening(from, to, ctx.relationType),
    reliefValue: reliefValue(from, to, ctx.relationType),
    spatialLegibility: spatialLegibility(ctx.spatialDistanceM),
    prerequisiteSatisfaction: ctx.prerequisites.length
      ? ctx.prerequisitesSatisfied
        ? 1
        : 0
      : 0.7,
    repetitionPenalty: repetitionPenaltyValue(ctx),
  }

  const unavailable: Array<keyof NarrativeEdgeScoreComponents> = []
  let weighted = 0
  let weightSum = 0
  const positive: string[] = []
  const negative: string[] = []

  ;(Object.keys(NARRATIVE_EDGE_SCORE_WEIGHTS) as Array<keyof NarrativeEdgeScoreComponents>).forEach((key) => {
    const w = NARRATIVE_EDGE_SCORE_WEIGHTS[key]
    const v = components[key]
    if (v == null) {
      unavailable.push(key)
      return
    }
    if (key === 'repetitionPenalty') {
      weighted -= w * v
      weightSum += w
      if (v > 0.15) negative.push(`repetition penalty ${round1(v)}`)
      return
    }
    weighted += w * v
    weightSum += w
    if (v >= 0.55) positive.push(`${key}=${round1(v)}`)
    if (v <= 0.2 && key !== 'causalContinuity') negative.push(`low ${key}=${round1(v)}`)
  })

  if (!ctx.prerequisitesSatisfied && ctx.prerequisites.length) {
    negative.push(`unresolved prerequisites: ${ctx.unresolvedPrerequisites.join(', ')}`)
  }
  if (from.thematicAvailability === 'UNKNOWN' || to.thematicAvailability === 'UNKNOWN') {
    negative.push('UNKNOWN thematic profile — semantic continuity unavailable (not treated as zero)')
  }

  const normalized = weightSum > 0 ? weighted / weightSum : 0
  const total = round1(clamp(normalized * 100))

  const explanation = [
    `${from.stgoId}→${to.stgoId} ${ctx.relationType}: score ${total}/100`,
    positive.length ? `supports: ${positive.slice(0, 3).join('; ')}` : 'limited positive support',
    negative.length ? `limits: ${negative.slice(0, 3).join('; ')}` : 'no major penalties',
  ].join(' · ')

  return {
    total,
    components,
    weights: { ...NARRATIVE_EDGE_SCORE_WEIGHTS },
    explanation,
    positiveFactors: positive,
    negativeFactors: negative,
    unavailableComponents: unavailable,
  }
}

/** Stable tie-break: higher total, then relationType, then from, then to. */
export function compareNarrativeScores(
  a: { total: number; relationType: string; from: string; to: string },
  b: { total: number; relationType: string; from: string; to: string },
): number {
  if (a.total !== b.total) return b.total - a.total
  const r = a.relationType.localeCompare(b.relationType)
  if (r !== 0) return r
  const f = a.from.localeCompare(b.from)
  if (f !== 0) return f
  return a.to.localeCompare(b.to)
}
