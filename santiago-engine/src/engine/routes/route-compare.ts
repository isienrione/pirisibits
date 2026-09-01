/**
 * Gate 2C — deterministic route comparison utilities (Route Lab substrate).
 */

import type { RouteCandidateV01, RouteStopV01 } from '@/src/engine/routes/route-types'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type { ThemeCode } from '@/src/lib/city-graph/types'

function stopIds(route: RouteCandidateV01 | { orderedStops: RouteStopV01[] }): string[] {
  return route.orderedStops.map((s) => s.stgoId)
}

function edgeKeys(route: RouteCandidateV01 | { orderedStops: RouteStopV01[] }): string[] {
  const ids = stopIds(route)
  const edges: string[] = []
  for (let i = 1; i < ids.length; i += 1) edges.push(`${ids[i - 1]}>${ids[i]}`)
  return edges
}

export function stopOverlap(a: RouteCandidateV01, b: RouteCandidateV01): number {
  const A = new Set(stopIds(a))
  const B = new Set(stopIds(b))
  const inter = [...A].filter((x) => B.has(x)).length
  const union = new Set([...A, ...B]).size
  return union === 0 ? 0 : Math.round((inter / union) * 1000) / 1000
}

export function orderedOverlap(a: RouteCandidateV01, b: RouteCandidateV01): number {
  const A = stopIds(a)
  const B = stopIds(b)
  let prefix = 0
  const n = Math.min(A.length, B.length)
  for (let i = 0; i < n; i += 1) {
    if (A[i] !== B[i]) break
    prefix += 1
  }
  return Math.round((prefix / Math.max(A.length, B.length, 1)) * 1000) / 1000
}

export function edgeOverlap(a: RouteCandidateV01, b: RouteCandidateV01): number {
  const A = new Set(edgeKeys(a))
  const B = new Set(edgeKeys(b))
  const inter = [...A].filter((x) => B.has(x)).length
  const union = new Set([...A, ...B]).size
  return union === 0 ? 0 : Math.round((inter / union) * 1000) / 1000
}

export function routeSimilarity(a: RouteCandidateV01, b: RouteCandidateV01): number {
  // weights aligned with DIVERSITY_CONFIG
  return Math.round((0.45 * stopOverlap(a, b) + 0.35 * orderedOverlap(a, b) + 0.2 * edgeOverlap(a, b)) * 1000) / 1000
}

export function timeDifference(a: RouteCandidateV01, b: RouteCandidateV01): number {
  return Math.round((a.totalEstimatedMin - b.totalEstimatedMin) * 10) / 10
}

export function scoreDifference(a: RouteCandidateV01, b: RouteCandidateV01): number {
  return Math.round((a.provisionalRouteScore - b.provisionalRouteScore) * 10) / 10
}

export function themeCoverageDifference(a: RouteCandidateV01, b: RouteCandidateV01): {
  onlyA: ThemeCode[]
  onlyB: ThemeCode[]
  shared: ThemeCode[]
} {
  const A = new Set(a.themeCoverage)
  const B = new Set(b.themeCoverage)
  return {
    onlyA: [...A].filter((t) => !B.has(t)).sort() as ThemeCode[],
    onlyB: [...B].filter((t) => !A.has(t)).sort() as ThemeCode[],
    shared: [...A].filter((t) => B.has(t)).sort() as ThemeCode[],
  }
}

export function compositionDifference(a: RouteCandidateV01, b: RouteCandidateV01): {
  a: { anchor: number; pocket: number; micro: number }
  b: { anchor: number; pocket: number; micro: number }
} {
  const count = (r: RouteCandidateV01) => {
    const c = { anchor: 0, pocket: 0, micro: 0 }
    for (const s of r.orderedStops) {
      const k = classifyStructure(s.tier, s.editorialRole)
      if (k === 'anchor' || k === 'pocket' || k === 'micro') c[k] += 1
    }
    return c
  }
  return { a: count(a), b: count(b) }
}
