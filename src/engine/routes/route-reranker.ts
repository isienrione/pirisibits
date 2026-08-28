/**
 * Gate 2D — deterministic route-level reranker over Gate 2C candidates.
 */

import {
  computeArcQuality,
  tryComputeArcQuality,
  type ArcQualityResult,
} from '@/src/engine/routes/arc-quality'
import { RERANK_BLEND_WEIGHTS } from '@/src/engine/routes/arc-quality-config'
import { inferRoutePositionRoles } from '@/src/engine/routes/route-position-role'
import { summarizeRouteShape } from '@/src/engine/routes/route-shape'
import { computeRouteQualityDiagnostics, type RouteQualityDiagnostic } from '@/src/engine/routes/route-quality-diagnostics'
import { composeProvisionalRoutes } from '@/src/engine/routes/route-composer'
import type { RouteCandidateV01, RouteComposerResultV01 } from '@/src/engine/routes/route-types'
import type { RouteRequestInput } from '@/src/engine/routes/route-request'

export type RerankedRouteCandidateV01 = {
  candidate: RouteCandidateV01
  originalComposerRank: number
  rerankedRank: number
  rankChange: number
  arcQuality: ArcQualityResult
  rerankedScore: number
  composerProvisionalScore: number
  arcQualityScore: number
  positionRoles: ReturnType<typeof inferRoutePositionRoles>
  shapeSummary: ReturnType<typeof summarizeRouteShape>
  diagnostics: RouteQualityDiagnostic[]
  rerankExplanation: {
    whyThisRouteRankedHere: string
    strongestArcFactors: string[]
    weakestArcFactors: string[]
    tradeoffs: string[]
    rankChangeReason: string
  }
}

export type RouteRerankResultV01 = {
  schemaVersion: 'santiago-route-rerank-result.v0.1'
  gate: '2D'
  arcQualityStatus: 'PROVISIONAL_V0_1'
  calibrationStatus: 'PROVISIONAL'
  calibrationApproved: false
  engineUsingProvisionalEditorialCalibration: true
  routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION'
  physicalRouteGenerationEnabled: false
  rerankedCandidates: RerankedRouteCandidateV01[]
  rejectedCandidates: Array<{ routeId: string; originalComposerRank: number; reasons: string[] }>
  topComposerRouteId: string | null
  topRerankedRouteId: string | null
  winnerChanged: boolean
  winnerChangeExplanation: string | null
  blendWeights: typeof RERANK_BLEND_WEIGHTS
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function computeRerankedScore(composerScore: number, arcScore: number): number {
  const w = RERANK_BLEND_WEIGHTS
  return round1(w.composerProvisionalScore * composerScore + w.arcQuality * arcScore)
}

function topComponentKeys(arc: ArcQualityResult, n = 3): string[] {
  return Object.entries(arc.components)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k, v]) => `${k} (${v})`)
}

function topPenaltyKeys(arc: ArcQualityResult, n = 2): string[] {
  return Object.entries(arc.penalties)
    .filter(([, v]) => v > 0.05)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k, v]) => `${k} (${v})`)
}

function explainRankedRoute(
  entry: Omit<RerankedRouteCandidateV01, 'rerankExplanation'>,
  prevComposerRank: number,
): RerankedRouteCandidateV01['rerankExplanation'] {
  const { arcQuality: arc, candidate, rerankedRank, originalComposerRank } = entry
  const moved = originalComposerRank - rerankedRank
  const strongestArcFactors = topComponentKeys(arc, 4)
  const weakestArcFactors = topPenaltyKeys(arc, 3)

  let whyThisRouteRankedHere: string
  if (rerankedRank === 1) {
    whyThisRouteRankedHere = `Top reranked route combining composer score ${candidate.provisionalRouteScore} with arc quality ${arc.normalizedScore} (reranked ${entry.rerankedScore}). Strongest arc: ${strongestArcFactors[0] || 'balanced mix'}.`
  } else {
    whyThisRouteRankedHere = `Rank #${rerankedRank} — reranked score ${entry.rerankedScore} (composer ${candidate.provisionalRouteScore}, arc ${arc.normalizedScore}).`
  }

  const tradeoffs: string[] = []
  if (arc.penalties.structuralMonotonyPenalty > 0.15) {
    tradeoffs.push('Structural monotony (anchor/micro runs) limits arc rhythm.')
  }
  if (arc.penalties.underutilizedBudgetPenalty > 0.1) {
    tradeoffs.push(`Underused budget (${arc.unusedBudgetMin} min) when continuations existed.`)
  }
  if (arc.penalties.unresolvedSetupPenalty > 0.15) {
    tradeoffs.push('Unresolved narrative setups at route end.')
  }
  if (!tradeoffs.length) tradeoffs.push('No major arc tradeoffs beyond composer baseline.')

  let rankChangeReason: string
  if (moved === 0) {
    rankChangeReason = `Remained #${rerankedRank} — arc quality aligns with composer ordering.`
  } else if (moved > 0) {
    rankChangeReason = `Moved from #${originalComposerRank} to #${rerankedRank} because arc quality (${arc.normalizedScore}) and ${strongestArcFactors.slice(0, 2).join(', ')} outweigh composer-only ordering.`
  } else {
    rankChangeReason = `Dropped from #${originalComposerRank} to #${rerankedRank} due to ${weakestArcFactors.join(', ') || 'arc penalties'}.`
  }

  void prevComposerRank
  return { whyThisRouteRankedHere, strongestArcFactors, weakestArcFactors, tradeoffs, rankChangeReason }
}

/**
 * Rerank 3–5 physically feasible RouteCandidateV01 from Gate 2C.
 * Does not mutate input candidates.
 */
export function rerankRouteCandidates(candidates: RouteCandidateV01[]): RouteRerankResultV01 {
  const rejectedCandidates: RouteRerankResultV01['rejectedCandidates'] = []
  const scored: Array<{
    candidate: RouteCandidateV01
    originalComposerRank: number
    arcQuality: ArcQualityResult
    rerankedScore: number
  }> = []

  const sortedInput = [...candidates].sort((a, b) => a.rank - b.rank)

  for (const c of sortedInput) {
    const result = tryComputeArcQuality(c)
    if (!result.ok) {
      rejectedCandidates.push({
        routeId: c.routeId,
        originalComposerRank: c.rank,
        reasons: result.validation.reasons,
      })
      continue
    }
    scored.push({
      candidate: c,
      originalComposerRank: c.rank,
      arcQuality: result.arc,
      rerankedScore: computeRerankedScore(c.provisionalRouteScore, result.arc.normalizedScore),
    })
  }

  scored.sort((a, b) => b.rerankedScore - a.rerankedScore || b.arcQuality.normalizedScore - a.arcQuality.normalizedScore || a.candidate.routeId.localeCompare(b.candidate.routeId))

  const rerankedCandidates: RerankedRouteCandidateV01[] = scored.map((s, i) => {
    const roles = inferRoutePositionRoles(s.candidate.orderedStops)
    const shapeSummary = summarizeRouteShape(s.candidate.orderedStops, roles, s.candidate.dominantThemes)
    const diagnostics = computeRouteQualityDiagnostics(s.candidate, s.arcQuality)
    const base = {
      candidate: s.candidate,
      originalComposerRank: s.originalComposerRank,
      rerankedRank: i + 1,
      rankChange: s.originalComposerRank - (i + 1),
      arcQuality: s.arcQuality,
      rerankedScore: s.rerankedScore,
      composerProvisionalScore: s.candidate.provisionalRouteScore,
      arcQualityScore: s.arcQuality.normalizedScore,
      positionRoles: roles,
      shapeSummary,
      diagnostics,
    }
    return { ...base, rerankExplanation: explainRankedRoute(base, s.originalComposerRank) }
  })

  const topComposer = sortedInput.find((c) => c.rank === 1) || sortedInput[0] || null
  const topReranked = rerankedCandidates[0] || null
  const winnerChanged = Boolean(topComposer && topReranked && topComposer.routeId !== topReranked.candidate.routeId)

  let winnerChangeExplanation: string | null = null
  if (winnerChanged && topReranked) {
    winnerChangeExplanation = `Composer #1 (${topComposer!.routeId}, score ${topComposer!.provisionalRouteScore}) reranked to #${rerankedCandidates.find((r) => r.candidate.routeId === topComposer!.routeId)?.rerankedRank ?? '?'}; arc winner is ${topReranked.candidate.routeId} (reranked ${topReranked.rerankedScore}). ${topReranked.rerankExplanation.rankChangeReason}`
  }

  return {
    schemaVersion: 'santiago-route-rerank-result.v0.1',
    gate: '2D',
    arcQualityStatus: 'PROVISIONAL_V0_1',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
    physicalRouteGenerationEnabled: false,
    rerankedCandidates,
    rejectedCandidates,
    topComposerRouteId: topComposer?.routeId ?? null,
    topRerankedRouteId: topReranked?.candidate.routeId ?? null,
    winnerChanged,
    winnerChangeExplanation,
    blendWeights: RERANK_BLEND_WEIGHTS,
  }
}

/** Compose Gate 2C candidates then rerank with ArcQuality V0.1. */
export function composeAndRerankProvisionalRoutes(
  input: RouteRequestInput | import('@/src/engine/routes/route-types').RouteRequestV01,
  opts?: Parameters<typeof composeProvisionalRoutes>[1],
): { composed: RouteComposerResultV01; reranked: RouteRerankResultV01 } {
  const composed = composeProvisionalRoutes(input, opts)
  return { composed, reranked: rerankRouteCandidates(composed.candidates) }
}
