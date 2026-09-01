/**
 * Gate 2E — pure derivations for Route Lab visualizations (no scoring changes).
 */

import { classifyStructure } from '@/src/engine/routes/route-score'
import type { RerankedRouteCandidateV01 } from '@/src/engine/routes/route-reranker'
import {
  compositionDifference,
  edgeOverlap,
  orderedOverlap,
  routeSimilarity,
  scoreDifference,
  stopOverlap,
  themeCoverageDifference,
  timeDifference,
} from '@/src/engine/routes/route-compare'
import type { RouteCandidateV01, RouteStopV01 } from '@/src/engine/routes/route-types'

export type StructuralLetter = 'A' | 'P' | 'M' | '·'

export function structuralLetter(tier: string | null, role: string | null): StructuralLetter {
  const k = classifyStructure(tier, role)
  if (k === 'anchor') return 'A'
  if (k === 'pocket') return 'P'
  if (k === 'micro') return 'M'
  return '·'
}

export function structuralRibbon(stops: RouteStopV01[]): string {
  return stops.map((s) => structuralLetter(s.tier, s.editorialRole)).join(' — ')
}

export function longestStructuralRuns(stops: RouteStopV01[]): {
  anchor: number
  pocket: number
  micro: number
} {
  const count = (kind: 'anchor' | 'pocket' | 'micro') => {
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
  return { anchor: count('anchor'), pocket: count('pocket'), micro: count('micro') }
}

export function themeProgression(stops: RouteStopV01[]): string[] {
  return stops.map((s) => {
    const dom = s.arcStateAfter.themesDominant
    if (dom.length >= 2) return dom.slice(0, 2).join('/')
    if (dom.length === 1) return dom[0]!
    const seen = s.arcStateAfter.themesSeen
    return seen.length ? seen[seen.length - 1]! : '—'
  })
}

export function relationProgression(stops: RouteStopV01[]): Array<{ index: number; relation: string | null }> {
  return stops.map((s, i) => ({
    index: i,
    relation: i === 0 ? null : s.narrativeRelationFromPrevious,
  }))
}

export function longestRelationRun(
  stops: RouteStopV01[],
): { run: number; relation: string | null } {
  let best = 0
  let cur = 0
  let last: string | null = null
  let bestRel: string | null = null
  for (const s of stops.slice(1)) {
    const r = s.narrativeRelationFromPrevious
    if (r && r === last) {
      cur += 1
      if (cur + 1 > best) {
        best = cur + 1
        bestRel = r
      }
    } else {
      cur = 0
      last = r
    }
  }
  return { run: best, relation: bestRel }
}

export type MapSegment = {
  fromStgoId: string
  toStgoId: string
  mode: 'WALK' | 'METRO' | 'START' | 'GAP'
  hasPolylineGeometry: false
  distanceM: number | null
  durationMin: number
  diagnostic: string
}

export function buildMapSegments(stops: RouteStopV01[]): MapSegment[] {
  const out: MapSegment[] = []
  for (let i = 1; i < stops.length; i += 1) {
    const prev = stops[i - 1]!
    const cur = stops[i]!
    const tr = cur.transition
    const mode = cur.arrivalMode === 'METRO' ? 'METRO' : tr?.mode === 'METRO' ? 'METRO' : 'WALK'
    out.push({
      fromStgoId: prev.stgoId,
      toStgoId: cur.stgoId,
      mode,
      hasPolylineGeometry: false,
      distanceM: tr?.distanceM ?? null,
      durationMin: tr?.durationMin ?? cur.transitionTimeMin,
      diagnostic:
        'Sparse adjacency segment — no canonical polyline geometry in frozen graph; marker link only.',
    })
  }
  return out
}

export function candidateComparisonMatrix(candidates: RouteCandidateV01[]) {
  const pairs: Array<{
    a: string
    b: string
    stopOverlap: number
    orderedOverlap: number
    edgeOverlap: number
    similarity: number
    timeDiff: number
    scoreDiff: number
    themeDiff: ReturnType<typeof themeCoverageDifference>
    compositionDiff: ReturnType<typeof compositionDifference>
  }> = []
  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const a = candidates[i]!
      const b = candidates[j]!
      pairs.push({
        a: a.routeId,
        b: b.routeId,
        stopOverlap: stopOverlap(a, b),
        orderedOverlap: orderedOverlap(a, b),
        edgeOverlap: edgeOverlap(a, b),
        similarity: routeSimilarity(a, b),
        timeDiff: timeDifference(a, b),
        scoreDiff: scoreDifference(a, b),
        themeDiff: themeCoverageDifference(a, b),
        compositionDiff: compositionDifference(a, b),
      })
    }
  }
  return pairs
}

export function sharedAndUniqueStops(candidates: RouteCandidateV01[]): {
  shared: string[]
  byRoute: Record<string, { only: string[] }>
} {
  const allIds = candidates.map((c) => c.orderedStops.map((s) => s.stgoId))
  const counts = new Map<string, number>()
  for (const ids of allIds) {
    for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1)
  }
  const shared = [...counts.entries()].filter(([, n]) => n === candidates.length).map(([id]) => id)
  const byRoute: Record<string, { only: string[] }> = {}
  candidates.forEach((c, idx) => {
    byRoute[c.routeId] = {
      only: allIds[idx]!.filter((id) => counts.get(id) === 1),
    }
  })
  return { shared, byRoute }
}

export function timeBudgetBreakdown(candidate: RouteCandidateV01) {
  const unused = Math.max(0, candidate.timeBudgetMin - candidate.totalEstimatedMin)
  const tolerance = 8
  return {
    movementMin: candidate.movementMin,
    dwellMin: candidate.dwellMin,
    totalEstimatedMin: candidate.totalEstimatedMin,
    timeBudgetMin: candidate.timeBudgetMin,
    unusedMin: unused,
    toleranceMin: tolerance,
    metroUsed: candidate.metroUse.used,
    transferCount: candidate.metroUse.transferCount,
  }
}

export function diagnosticSeverityLabel(severity: string): 'INFO' | 'WARNING' | 'STRONG WARNING' {
  if (severity === 'SEVERE' || severity === 'MODERATE') return 'STRONG WARNING'
  if (severity === 'MILD') return 'WARNING'
  return 'INFO'
}

export function pickRerankedEntry(
  reranked: RerankedRouteCandidateV01[],
  routeId: string,
): RerankedRouteCandidateV01 | undefined {
  return reranked.find((r) => r.candidate.routeId === routeId)
}
