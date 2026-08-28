/**
 * Gate 2C — provisional Route Composer V0.1 public entry.
 * Production traveler routing remains disabled via flags.
 */

import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { ROUTE_SEARCH_CONFIG } from '@/src/engine/routes/route-config'
import { pairwiseSimilarityMatrix, selectDiverseRoutes } from '@/src/engine/routes/route-diversity'
import { hashRouteRequest, normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import { runRouteBeamSearch } from '@/src/engine/routes/route-search'
import type { RouteComposerResultV01, RouteRequestV01 } from '@/src/engine/routes/route-types'
import type { EngineNodeRecord } from '@/src/engine/types'

export function composeProvisionalRoutes(
  input: RouteRequestInput | RouteRequestV01,
  opts?: {
    nodes?: EngineNodeRecord[]
    candidateCount?: number
    root?: string
  },
): RouteComposerResultV01 {
  const request =
    (input as RouteRequestV01).schemaVersion === 'santiago-route-request.v0.1'
      ? (input as RouteRequestV01)
      : normalizeRouteRequest(input as RouteRequestInput)

  const nodes = opts?.nodes ?? loadLaunchNodes(opts?.root)
  const k = opts?.candidateCount ?? ROUTE_SEARCH_CONFIG.defaultCandidateCount

  if (request.start.kind !== 'STGO_ID') {
    return {
      schemaVersion: 'santiago-route-composer-result.v0.1',
      gate: '2C',
      calibrationStatus: 'PROVISIONAL',
      calibrationApproved: false,
      engineUsingProvisionalEditorialCalibration: true,
      routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
      physicalRouteGenerationEnabled: false,
      request,
      requestHash: hashRouteRequest(request),
      inputVersions: {
        gate: '2C',
        sourceCheckpointSha: 'b99ca18f74a9b3aa1e2d000d510f7b3f46e52fe4',
        launchCorpusArtifact: 'src/data/santiago/santiago_launch_corpus.v0.1.json',
        editorialCalibrationArtifact:
          'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json',
        narrativeGraphArtifact:
          'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json',
        pedestrianAdjacencyArtifact: 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json',
        multimodalGraphArtifact: 'src/data/santiago/santiago_multimodal_graph.v0.3.json',
        engineNodesArtifact: 'src/data/santiago/santiago_engine_nodes.v0.1.json',
        narrativeGraphCalibrationStatus: 'PROVISIONAL',
        curatorApproved: false,
      },
      candidates: [],
      pairwiseSimilarity: [],
      diagnostics: {
        eligibleCandidateCount: 0,
        physicallyUsableCandidateCount: 0,
        editorialButPhysicalPending: [],
        beamStatesExpanded: 0,
        beamStatesPruned: 0,
      },
      notes: [
        request.start.kind === 'UNSUPPORTED'
          ? request.start.reason
          : 'Coordinate starts are not resolved in Gate 2C V0.1',
      ],
    }
  }

  const { pool, diagnostics } = runRouteBeamSearch(request, nodes, opts?.root)
  const candidates = selectDiverseRoutes(pool, k).map((c, i) => ({
    ...c,
    rank: i + 1,
    tradeoffExplanation:
      i === 0
        ? c.tradeoffExplanation
        : i === 1
          ? `Credible alternative emphasizing discovery/theme diversity while remaining within budget (score ${c.provisionalRouteScore}).`
          : `Credible alternative emphasizing physical efficiency / essentials packing (score ${c.provisionalRouteScore}).`,
    diagnostics,
  }))

  return {
    schemaVersion: 'santiago-route-composer-result.v0.1',
    gate: '2C',
    calibrationStatus: 'PROVISIONAL',
    calibrationApproved: false,
    engineUsingProvisionalEditorialCalibration: true,
    routeQualityStatus: 'PROVISIONAL_PRE_FOUNDER_CALIBRATION',
    physicalRouteGenerationEnabled: false,
    request,
    requestHash: hashRouteRequest(request),
    inputVersions: candidates[0]?.inputVersions || {
      gate: '2C',
      sourceCheckpointSha: 'b99ca18f74a9b3aa1e2d000d510f7b3f46e52fe4',
      launchCorpusArtifact: 'src/data/santiago/santiago_launch_corpus.v0.1.json',
      editorialCalibrationArtifact:
        'src/data/santiago/curation/launch30_editorial_calibration.proposed.v0.1.json',
      narrativeGraphArtifact:
        'src/data/santiago/narrative/santiago_launch30_narrative_graph.proposed.v0.1.json',
      pedestrianAdjacencyArtifact: 'src/data/santiago/santiago_pedestrian_adjacency.v0.2.json',
      multimodalGraphArtifact: 'src/data/santiago/santiago_multimodal_graph.v0.3.json',
      engineNodesArtifact: 'src/data/santiago/santiago_engine_nodes.v0.1.json',
      narrativeGraphCalibrationStatus: 'PROVISIONAL',
      curatorApproved: false,
    },
    candidates,
    pairwiseSimilarity: pairwiseSimilarityMatrix(candidates),
    diagnostics,
    notes: [
      'PROVISIONAL_PRE_FOUNDER_CALIBRATION — not editorially frozen.',
      'PHYSICAL_ROUTE_GENERATION_ENABLED remains false (composer is Lab/dev only).',
      'STGO_104 excluded from physical routes while PHYSICAL_PENDING_EDGE_ENRICHMENT.',
      'Dwell times may be AI_PROPOSED_UNVERIFIED assumptions.',
      'Gate 2D ArcQuality reranker not started.',
    ],
  }
}
