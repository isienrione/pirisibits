/**
 * Gate 2E — serialize Route Lab runs for embedded HTML payload.
 */

import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'
import { arcQualityDisplayRows } from '@/src/dev/route-lab/arcDisplay'
import { buildGeoSegmentsForRoute } from '@/src/dev/route-lab/geoSegments'
import {
  computeGeographicQaIndicators,
  shapeAmbiguityTags,
  stopSequenceLabel,
} from '@/src/dev/route-lab/geoDiagnostics'
import { loadPoiCoordinates } from '@/src/dev/route-lab/coordinates'
import {
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
import { WATCH_GEO_FIXTURES } from '@/src/dev/route-lab/humanReview'
import { resolve } from 'node:path'

function serializeOne(result: RouteLabRunResult, coordMap: ReturnType<typeof loadPoiCoordinates>) {
  const reranked = result.reranked.rerankedCandidates.map((r) => {
    const geoSegments = buildGeoSegmentsForRoute(r.candidate.orderedStops)
    const geoDiagnostics = computeGeographicQaIndicators({
      stops: r.candidate.orderedStops,
      segments: geoSegments,
      coordinates: coordMap,
      arcQuality: r.arcQuality,
    })
    const shapeAmb = shapeAmbiguityTags(r.shapeSummary.tags)
    return {
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
      mapSegments: geoSegments,
      geoSegments,
      geoDiagnostics,
      stopSequence: stopSequenceLabel(r.candidate.orderedStops),
      shapeAmbiguity: shapeAmb,
      timeBreakdown: timeBudgetBreakdown(r.candidate),
    }
  })

  const composerWinner = reranked.find((x) => x.originalComposerRank === 1)
  const rerankWinner = reranked.find((x) => x.rerankedRank === 1)

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
    composerWinnerSequence: composerWinner?.stopSequence ?? null,
    rerankWinnerSequence: rerankWinner?.stopSequence ?? null,
    reranked,
    comparison: candidateComparisonMatrix(result.composed.candidates),
    sharedStops: sharedAndUniqueStops(result.composed.candidates),
    stgo104Diagnostic: result.stgo104Diagnostic,
    nodeContextByStgoId: result.nodeContextByStgoId,
  }
}

export function serializeRouteLabRun(result: RouteLabRunResult, root?: string) {
  const coordMap = loadPoiCoordinates(root ?? resolve(__dirname, '../../..'))
  return serializeOne(result, coordMap)
}

export function buildRouteLabEmbedPayload(results: Record<string, RouteLabRunResult>, root?: string) {
  const r = root ?? resolve(__dirname, '../../..')
  const coordMap = loadPoiCoordinates(r)
  const serialized: Record<string, ReturnType<typeof serializeOne>> = {}
  for (const [id, res] of Object.entries(results)) {
    serialized[id] = serializeOne(res, coordMap)
  }
  const coords: Record<string, { lat: number; lng: number; displayName: string | null }> = {}
  const first = Object.values(results)[0]
  if (first) {
    for (const [id, c] of Object.entries(first.coordinates)) {
      coords[id] = { lat: c.lat, lng: c.lng, displayName: c.displayName }
    }
  }
  return {
    schemaVersion: 'santiago-route-lab-embed.v0.2',
    defaultFixtureId: 'F2',
    fixtures: ROUTE_LAB_FIXTURES.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      watchCase: Boolean(f.watchCase),
      watchNote: f.watchNote ?? null,
      geoWatch: WATCH_GEO_FIXTURES[f.id as keyof typeof WATCH_GEO_FIXTURES] ?? null,
    })),
    coordinates: coords,
    results: serialized,
  }
}
