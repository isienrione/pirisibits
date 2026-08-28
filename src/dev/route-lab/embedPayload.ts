/**
 * Gate 2E — serialize Route Lab runs for embedded HTML payload.
 */

import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'
import { arcQualityDisplayRows } from '@/src/dev/route-lab/arcDisplay'
import {
  buildMapSegments,
  candidateComparisonMatrix,
  longestRelationRun,
  longestStructuralRuns,
  relationProgression,
  sharedAndUniqueStops,
  structuralRibbon,
  themeProgression,
  timeBudgetBreakdown,
} from '@/src/dev/route-lab/derivations'
import { ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'

export function serializeRouteLabRun(result: RouteLabRunResult) {
  const reranked = result.reranked.rerankedCandidates.map((r) => ({
    routeId: r.candidate.routeId,
    originalComposerRank: r.originalComposerRank,
    rerankedRank: r.rerankedRank,
    rankChange: r.rankChange,
    composerProvisionalScore: r.composerProvisionalScore,
    arcQualityScore: r.arcQualityScore,
    rerankedScore: r.rerankedScore,
    candidate: r.candidate,
    arcQuality: r.arcQuality,
    arcDisplay: arcQualityDisplayRows(r.arcQuality),
    positionRoles: r.positionRoles,
    shapeSummary: r.shapeSummary,
    diagnostics: r.diagnostics,
    rerankExplanation: r.rerankExplanation,
    ribbon: structuralRibbon(r.candidate.orderedStops),
    structuralRuns: longestStructuralRuns(r.candidate.orderedStops),
    themeProgression: themeProgression(r.candidate.orderedStops),
    relationProgression: relationProgression(r.candidate.orderedStops),
    relationRun: longestRelationRun(r.candidate.orderedStops),
    mapSegments: buildMapSegments(r.candidate.orderedStops),
    timeBreakdown: timeBudgetBreakdown(r.candidate),
  }))

  return {
    fixtureId: result.fixtureId,
    requestHash: result.composed.requestHash,
    request: result.composed.request,
    inputVersions: result.composed.inputVersions,
    diagnostics: result.composed.diagnostics,
    winnerChanged: result.reranked.winnerChanged,
    winnerChangeExplanation: result.reranked.winnerChangeExplanation,
    topComposerRouteId: result.reranked.topComposerRouteId,
    topRerankedRouteId: result.reranked.topRerankedRouteId,
    reranked,
    comparison: candidateComparisonMatrix(result.composed.candidates),
    sharedStops: sharedAndUniqueStops(result.composed.candidates),
    stgo104Diagnostic: result.stgo104Diagnostic,
    nodeContextByStgoId: result.nodeContextByStgoId,
  }
}

export function buildRouteLabEmbedPayload(results: Record<string, RouteLabRunResult>) {
  const serialized: Record<string, ReturnType<typeof serializeRouteLabRun>> = {}
  for (const [id, r] of Object.entries(results)) {
    serialized[id] = serializeRouteLabRun(r)
  }
  const coords: Record<string, { lat: number; lng: number; displayName: string | null }> = {}
  const first = Object.values(results)[0]
  if (first) {
    for (const [id, c] of Object.entries(first.coordinates)) {
      coords[id] = { lat: c.lat, lng: c.lng, displayName: c.displayName }
    }
  }
  return {
    schemaVersion: 'santiago-route-lab-embed.v0.1',
    defaultFixtureId: 'F2',
    fixtures: ROUTE_LAB_FIXTURES.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      watchCase: Boolean(f.watchCase),
      watchNote: f.watchNote ?? null,
    })),
    coordinates: coords,
    results: serialized,
  }
}
