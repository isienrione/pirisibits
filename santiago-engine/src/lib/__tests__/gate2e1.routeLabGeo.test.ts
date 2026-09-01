import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
  ROUTE_LAB_GEOGRAPHIC_QA_READY,
} from '@/src/lib/city-graph/flags'
import { loadWalkGeometryIndex, lookupWalkGeometry } from '@/src/dev/route-lab/geometryIndex'
import { buildGeoSegmentsForRoute } from '@/src/dev/route-lab/geoSegments'
import {
  computeGeographicQaIndicators,
  shapeAmbiguityTags,
  stopSequenceLabel,
} from '@/src/dev/route-lab/geoDiagnostics'
import {
  HUMAN_REVIEW_STORAGE_KEY,
  REVIEW_MATRIX_FIXTURES,
  WATCH_GEO_FIXTURES,
  emptyHumanReview,
  parseHumanReviewStore,
  reviewKey,
} from '@/src/dev/route-lab/humanReview'
import { buildRouteSnapshotExport } from '@/src/dev/route-lab/snapshot'
import {
  runRouteLabFixture,
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
} from '@/src/dev/route-lab/runRouteLab'
import { buildRouteLabEmbedPayload } from '@/src/dev/route-lab/embedPayload'
import { buildAllFixtureResults } from '@/src/dev/route-lab/runRouteLab'

const ROOT = resolve(__dirname, '../../..')

function committedSourceScan(): string {
  const dirs = ['src/dev/route-lab', 'scripts/engine', 'docs/engine']
  let raw = ''
  for (const d of dirs) {
    try {
      for (const f of readdirSync(resolve(ROOT, d), { recursive: true } as never)) {
        if (typeof f !== 'string') continue
        if (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.html')) {
          raw += readFileSync(resolve(ROOT, d, f), 'utf8')
        }
      }
    } catch {
      // skip
    }
  }
  return raw
}

describe('Gate 2E.1 Route Lab geographic QA', () => {
  it('ROUTE_LAB_GEOGRAPHIC_QA_READY flag is true', () => {
    expect(ROUTE_LAB_GEOGRAPHIC_QA_READY).toBe(true)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('no Mapbox token in committed route-lab source', () => {
    const raw = committedSourceScan()
    expect(raw).not.toMatch(/pk\.eyJ/)
    expect(raw).not.toMatch(/MAPBOX_ACCESS_TOKEN\s*=\s*['"]pk\./)
  })

  it('geometry index loads canonical edges from frozen physical graph', () => {
    const index = loadWalkGeometryIndex(ROOT)
    expect(index.size).toBeGreaterThan(100)
    const hit = lookupWalkGeometry('STGO_01', 'STGO_18', index, 'WALK')
    expect(['CANONICAL_GEOMETRY', 'GEOMETRY_NOT_STORED']).toContain(hit.geometryStatus)
  })

  it('uses canonical geometry where available and labels missing geometry', () => {
    const f2 = runRouteLabFixture('F2', ROOT)
    const winner = f2.reranked.rerankedCandidates.find((r) => r.rerankedRank === 1)!
    const segments = buildGeoSegmentsForRoute(winner.candidate.orderedStops)
    expect(segments.length).toBe(winner.candidate.orderedStops.length - 1)
    const hasCanonical = segments.some((s) => s.geometryStatus === 'CANONICAL_GEOMETRY')
    const hasMissing = segments.some(
      (s) => s.geometryStatus === 'GEOMETRY_NOT_STORED' || s.geometryStatus === 'NO_ADJACENCY',
    )
    expect(hasCanonical || hasMissing).toBe(true)
    for (const s of segments) {
      if (s.geometryStatus !== 'CANONICAL_GEOMETRY') {
        expect(s.label).toMatch(/GEOMETRY NOT STORED|Metro|adjacency/)
      }
    }
  })

  it('geo diagnostics separate engine backtracking from map QA', () => {
    const f2 = runRouteLabFixture('F2', ROOT)
    const winner = f2.reranked.rerankedCandidates.find((r) => r.rerankedRank === 1)!
    const segments = buildGeoSegmentsForRoute(winner.candidate.orderedStops)
    const index = loadWalkGeometryIndex(ROOT)
    const coords = new Map(Object.entries(f2.coordinates).map(([k, v]) => [k, v]))
    const diag = computeGeographicQaIndicators({
      stops: winner.candidate.orderedStops,
      segments,
      coordinates: coords,
      arcQuality: winner.arcQuality,
    })
    expect(typeof diag.engineBacktrackingPenalty).toBe('number')
    expect(diag.mapQaNotes).toBeDefined()
    expect(diag.geometricReversalCount).toBeGreaterThanOrEqual(0)
  })

  it('embed payload v0.2 includes geo segments and watch fixtures', () => {
    const results = buildAllFixtureResults(ROOT)
    const payload = buildRouteLabEmbedPayload(results, ROOT)
    expect(payload.schemaVersion).toBe('santiago-route-lab-embed.v0.2')
    const f2 = payload.results.F2
    expect(f2.reranked[0]?.geoSegments).toBeTruthy()
    expect(f2.composerWinnerSequence).toBeTruthy()
    expect(f2.rerankWinnerSequence).toBeTruthy()
    const fx = payload.fixtures.find((f) => f.id === 'F2')
    expect(fx?.geoWatch?.expectedReranked).toContain('STGO_01')
  })

  it('F1 F2 F8 watch sequences match expected reranked order', () => {
    for (const [fid, watch] of Object.entries(WATCH_GEO_FIXTURES)) {
      const r = runRouteLabFixture(fid, ROOT)
      const winner = r.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!
      const seq = stopSequenceLabel(winner.candidate.orderedStops)
      const expected = watch.expectedReranked.join(' → ')
      expect(seq).toBe(expected)
    }
  })

  it('F8 exposes ambiguous shape classification when >2 primary tags', () => {
    const f8 = runRouteLabFixture('F8', ROOT)
    const winner = f8.reranked.rerankedCandidates.find((r) => r.rerankedRank === 1)!
    const amb = shapeAmbiguityTags(winner.shapeSummary.tags)
    expect(winner.candidate.anchorCount).toBe(4)
    expect(winner.candidate.thematicPocketCount).toBe(0)
    expect(winner.candidate.microRevealCount).toBe(3)
    if (winner.shapeSummary.tags.length > 2) {
      expect(amb.ambiguous).toBe(true)
    }
  })

  it('human review storage key and parse round-trip', () => {
    expect(HUMAN_REVIEW_STORAGE_KEY).toBe('cw_route_lab_human_review_v0_1')
    const rev = emptyHumanReview('F2', 'route-abc')
    rev.geography = 'GOOD'
    const store = {
      schemaVersion: 'cw_route_lab_human_review.v0.1' as const,
      reviews: { [reviewKey('F2', 'route-abc')]: rev },
    }
    const parsed = parseHumanReviewStore(JSON.stringify(store))
    expect(parsed.reviews[reviewKey('F2', 'route-abc')]?.geography).toBe('GOOD')
  })

  it('snapshot export includes humanReview with humanReviewAffectsEngine false', () => {
    const f1 = runRouteLabFixture('F1', ROOT)
    const routeId = f1.reranked.rerankedCandidates[0]!.candidate.routeId
    const snap = buildRouteSnapshotExport(f1, routeId, {
      geography: 'QUESTIONABLE',
      founderNote: 'test note',
    }) as Record<string, unknown>
    expect(snap.humanReviewAffectsEngine).toBe(false)
    expect((snap.humanReview as { geography: string }).geography).toBe('QUESTIONABLE')
  })

  it('review matrix fixture list is complete', () => {
    expect(REVIEW_MATRIX_FIXTURES).toEqual(['F1', 'F2', 'F6', 'F8', 'F9', 'F15', 'F17'])
    for (const fid of REVIEW_MATRIX_FIXTURES) {
      expect(runRouteLabFixture(fid, ROOT).fixtureId).toBe(fid)
    }
  })

  it('generated HTML includes map module and geo schema', () => {
    const html = readFileSync(resolve(ROOT, 'docs/engine/gate-2e-route-lab.html'), 'utf8')
    expect(html).toContain('route-lab-map.v0.1.js')
    expect(html).toContain('FIT SELECTED ROUTE')
    expect(html).toContain('santiago-route-lab-embed.v0.2')
    expect(html).not.toMatch(/pk\.eyJ/)
    const mapJs = readFileSync(resolve(ROOT, 'docs/engine/route-lab-map.v0.1.js'), 'utf8')
    expect(mapJs).toContain('RouteLabMap')
    expect(mapJs).toContain('/api/config')
    expect(mapJs).not.toMatch(/pk\.eyJ/)
  })

  it('Gate 2D rerank winner fingerprint unchanged', () => {
    const current = gate2dRegressionFingerprint(ROOT)
    const baseline = loadGate2dFingerprintArtifact(ROOT)
    expect(baseline).toBeTruthy()
    expect(current).toEqual(baseline)
  })

  it('F1–F18 full engine output fingerprint unchanged', () => {
    const current = gate2e1EngineOutputFingerprint(ROOT)
    const baseline = loadGate2e1FingerprintBaseline(ROOT)
    expect(baseline).toBeTruthy()
    expect(current).toEqual(baseline)
  })

  it('candidate overlay derives from actual reranked candidates', () => {
    const f2 = runRouteLabFixture('F2', ROOT)
    expect(f2.reranked.rerankedCandidates.length).toBe(3)
    for (const c of f2.reranked.rerankedCandidates) {
      expect(buildGeoSegmentsForRoute(c.candidate.orderedStops).length).toBeGreaterThan(0)
    }
  })

  it('composer vs reranker winners differ for F2 watch case', () => {
    const f2 = runRouteLabFixture('F2', ROOT)
    const comp = f2.reranked.rerankedCandidates.find((r) => r.originalComposerRank === 1)!
    const rer = f2.reranked.rerankedCandidates.find((r) => r.rerankedRank === 1)!
    expect(stopSequenceLabel(comp.candidate.orderedStops)).not.toBe(
      stopSequenceLabel(rer.candidate.orderedStops),
    )
  })
})
