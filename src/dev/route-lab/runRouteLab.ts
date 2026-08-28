/**
 * Gate 2E — execute provisional engine pipeline for Route Lab (observability only).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { loadSemanticByStgoId } from '@/src/engine/loadCalibration'
import { hashRouteRequest, normalizeRouteRequest, type RouteRequestInput } from '@/src/engine/routes/route-request'
import { composeAndRerankProvisionalRoutes } from '@/src/engine/routes/route-reranker'
import type { RouteComposerResultV01 } from '@/src/engine/routes/route-types'
import type { RouteRerankResultV01 } from '@/src/engine/routes/route-reranker'
import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import { ROUTE_LAB_FIXTURES, getRouteLabFixture, ROUTE_LAB_DEFAULT_FIXTURE_ID } from '@/src/dev/route-lab/fixtures'
import { loadPoiCoordinates, type PoiCoordinate } from '@/src/dev/route-lab/coordinates'

export type RouteLabNodeContext = {
  semantic: SemanticCalibrationRecord | null
  coordinate: PoiCoordinate | null
}

export type RouteLabRunResult = {
  fixtureId: string | null
  input: RouteRequestInput
  composed: RouteComposerResultV01
  reranked: RouteRerankResultV01
  nodeContextByStgoId: Record<string, RouteLabNodeContext>
  coordinates: Record<string, PoiCoordinate>
  stgo104Diagnostic: { presentInRoute: boolean; omissionReason: string | null }
}

const ROOT = resolve(__dirname, '../../..')

export function runRouteLab(
  input: RouteRequestInput,
  opts?: { root?: string; fixtureId?: string | null; candidateCount?: number },
): RouteLabRunResult {
  const root = opts?.root ?? ROOT
  const nodes = loadLaunchNodes(root)
  const { composed, reranked } = composeAndRerankProvisionalRoutes(input, {
    root,
    nodes,
    candidateCount: opts?.candidateCount ?? 3,
  })

  const semanticById = loadSemanticByStgoId(root)
  const coordMap = loadPoiCoordinates(root)
  const nodeContextByStgoId: Record<string, RouteLabNodeContext> = {}

  const allStops = composed.candidates.flatMap((c) => c.orderedStops.map((s) => s.stgoId))
  const unique = [...new Set(allStops)]
  for (const id of unique) {
    nodeContextByStgoId[id] = {
      semantic: semanticById.get(id) ?? null,
      coordinate: coordMap.get(id) ?? null,
    }
  }

  const top = composed.candidates[0]
  const omit104 = top?.omittedHighUtilityNodes.find((o) => o.stgoId === 'STGO_104')

  return {
    fixtureId: opts?.fixtureId ?? null,
    input,
    composed,
    reranked,
    nodeContextByStgoId,
    coordinates: Object.fromEntries(coordMap),
    stgo104Diagnostic: {
      presentInRoute: composed.candidates.some((c) => c.orderedStops.some((s) => s.stgoId === 'STGO_104')),
      omissionReason: omit104?.reasonCode ?? null,
    },
  }
}

export function runRouteLabFixture(fixtureId: string, root = ROOT): RouteLabRunResult {
  const fx = getRouteLabFixture(fixtureId)
  if (!fx) throw new Error(`Unknown fixture ${fixtureId}`)
  return runRouteLab(fx.input, { root, fixtureId })
}

export function runDefaultRouteLab(root = ROOT): RouteLabRunResult {
  return runRouteLabFixture(ROUTE_LAB_DEFAULT_FIXTURE_ID, root)
}

export function buildAllFixtureResults(root = ROOT): Record<string, RouteLabRunResult> {
  const out: Record<string, RouteLabRunResult> = {}
  for (const f of ROUTE_LAB_FIXTURES) {
    out[f.id] = runRouteLab(f.input, { root, fixtureId: f.id })
  }
  return out
}

export function requestFromControls(body: RouteRequestInput): RouteRequestInput {
  return body
}

export function deterministicFixtureHashes(root = ROOT): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of ROUTE_LAB_FIXTURES) {
    out[f.id] = hashRouteRequest(normalizeRouteRequest(f.input))
  }
  return out
}

/** Gate 2D regression fingerprint — reranked top routeId per fixture. */
export function gate2dRegressionFingerprint(root = ROOT): Record<string, string> {
  const results = buildAllFixtureResults(root)
  const out: Record<string, string> = {}
  for (const [id, r] of Object.entries(results)) {
    out[id] = r.reranked.topRerankedRouteId ?? ''
  }
  return out
}

export function loadGate2dFingerprintArtifact(root = ROOT): Record<string, string> | null {
  try {
    const p = resolve(root, 'src/data/santiago/routes/arc-reranker-fixtures.v0.1.json')
    const raw = JSON.parse(readFileSync(p, 'utf8'))
    const out: Record<string, string> = {}
    for (const row of raw.fixtures || []) {
      out[row.id] = row.rerankedTopRouteId ?? ''
    }
    return out
  } catch {
    return null
  }
}

/** Gate 2E.1 — full engine-output fingerprint for regression (observability must not change engine). */
export function gate2e1EngineOutputFingerprint(root = ROOT): Record<string, string> {
  const results = buildAllFixtureResults(root)
  const out: Record<string, string> = {}
  for (const [id, r] of Object.entries(results)) {
    const payload = {
      requestHash: r.composed.requestHash,
      candidates: r.composed.candidates.map((c) => ({
        routeId: c.routeId,
        stops: c.orderedStops.map((s) => s.stgoId),
        composerScore: c.provisionalRouteScore,
        omissions: c.omittedHighUtilityNodes.map((o) => ({ id: o.stgoId, reason: o.reasonCode })),
      })),
      reranked: r.reranked.rerankedCandidates.map((x) => ({
        routeId: x.candidate.routeId,
        composerRank: x.originalComposerRank,
        rerankedRank: x.rerankedRank,
        composerScore: x.composerProvisionalScore,
        arcQuality: x.arcQualityScore,
        rerankedScore: x.rerankedScore,
        arcNormalized: x.arcQuality.normalizedScore,
      })),
      winnerChanged: r.reranked.winnerChanged,
      topComposer: r.reranked.topComposerRouteId,
      topReranked: r.reranked.topRerankedRouteId,
    }
    out[id] = JSON.stringify(payload)
  }
  return out
}

export function loadGate2e1FingerprintBaseline(root = ROOT): Record<string, string> | null {
  try {
    const p = resolve(root, 'src/data/santiago/routes/gate-2e1-engine-fingerprint.v0.1.json')
    const raw = JSON.parse(readFileSync(p, 'utf8'))
    return raw.fingerprints ?? null
  } catch {
    return null
  }
}
