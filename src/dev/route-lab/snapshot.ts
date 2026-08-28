/**
 * Gate 2E — route snapshot export builder.
 * Gate 2E.1 — optional human review export (does not affect engine).
 */

import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'
import type { HumanRouteReview } from '@/src/dev/route-lab/humanReview'

export function buildRouteSnapshotExport(
  result: RouteLabRunResult,
  selectedRouteId: string | null,
  humanReview?: Partial<HumanRouteReview> | null,
): object {
  const selected = result.reranked.rerankedCandidates.find((r) => r.candidate.routeId === selectedRouteId) ??
    result.reranked.rerankedCandidates[0]

  return {
    schemaVersion: 'santiago-route-lab-snapshot.v0.1',
    exportedAt: new Date().toISOString(),
    fixtureId: result.fixtureId,
    request: result.composed.request,
    requestHash: result.composed.requestHash,
    inputVersions: result.composed.inputVersions,
    calibrationStatus: result.composed.calibrationStatus,
    calibrationApproved: result.composed.calibrationApproved,
    engineUsingProvisionalEditorialCalibration: result.composed.engineUsingProvisionalEditorialCalibration,
    routeQualityStatus: result.composed.routeQualityStatus,
    arcQualityStatus: result.reranked.arcQualityStatus,
    physicalRouteGenerationEnabled: false,
    candidates: result.composed.candidates,
    reranked: result.reranked.rerankedCandidates.map((r) => ({
      originalComposerRank: r.originalComposerRank,
      rerankedRank: r.rerankedRank,
      rankChange: r.rankChange,
      composerProvisionalScore: r.composerProvisionalScore,
      arcQualityScore: r.arcQualityScore,
      rerankedScore: r.rerankedScore,
      arcQuality: r.arcQuality,
      shapeSummary: r.shapeSummary,
      diagnostics: r.diagnostics,
      rerankExplanation: r.rerankExplanation,
      routeId: r.candidate.routeId,
    })),
    selectedCandidate: selected
      ? {
          routeId: selected.candidate.routeId,
          rerankedRank: selected.rerankedRank,
          composerRank: selected.originalComposerRank,
        }
      : null,
    omissions: selected?.candidate.omittedHighUtilityNodes ?? [],
    winnerChanged: result.reranked.winnerChanged,
    winnerChangeExplanation: result.reranked.winnerChangeExplanation,
    ...(humanReview
      ? {
          humanReview: {
            geography: humanReview.geography ?? '',
            sequence: humanReview.sequence ?? '',
            travelerFit: humanReview.travelerFit ?? '',
            narrativeShape: humanReview.narrativeShape ?? '',
            timeUse: humanReview.timeUse ?? '',
            founderNote: humanReview.founderNote ?? '',
          },
          humanReviewAffectsEngine: false,
        }
      : {}),
  }
}

export function routeSnapshotFilename(result: RouteLabRunResult): string {
  const id = result.fixtureId ?? result.composed.requestHash.slice(0, 8)
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `route-lab-${id}-${ts}.json`
}
