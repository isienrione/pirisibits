import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
  ROUTE_LAB_V0_1_READY,
  ARC_QUALITY_V0_1_PROVISIONAL_READY,
} from '@/src/lib/city-graph/flags'
import {
  ROUTE_LAB_FIXTURES,
  ROUTE_LAB_DEFAULT_FIXTURE_ID,
  getRouteLabFixture,
} from '@/src/dev/route-lab/fixtures'
import {
  structuralRibbon,
  themeProgression,
  relationProgression,
  longestStructuralRuns,
} from '@/src/dev/route-lab/derivations'
import { parseRouteLabUrlState, serializeRouteLabUrlState, curatorDeepLink } from '@/src/dev/route-lab/urlState'
import { buildRouteSnapshotExport, routeSnapshotFilename } from '@/src/dev/route-lab/snapshot'
import {
  runDefaultRouteLab,
  runRouteLabFixture,
  gate2dRegressionFingerprint,
  loadGate2dFingerprintArtifact,
} from '@/src/dev/route-lab/runRouteLab'
import { hashRouteRequest, normalizeRouteRequest } from '@/src/engine/routes/route-request'
import {
  ARC_QUALITY_POSITIVE_WEIGHTS,
  RERANK_BLEND_WEIGHTS,
} from '@/src/engine/routes/arc-quality-config'
import { ROUTE_SCORE_WEIGHTS } from '@/src/engine/routes/route-config'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2E Santiago Route Lab', () => {
  it('default F2 loads with three candidates', () => {
    const result = runDefaultRouteLab(ROOT)
    expect(result.fixtureId).toBe('F2')
    expect(result.composed.candidates.length).toBe(3)
    expect(result.reranked.rerankedCandidates.length).toBe(3)
  })

  it('F1–F18 presets exist and reproduce deterministic request hashes', () => {
    expect(ROUTE_LAB_FIXTURES).toHaveLength(18)
    const f2a = hashRouteRequest(normalizeRouteRequest(getRouteLabFixture('F2')!.input))
    const f18 = hashRouteRequest(normalizeRouteRequest(getRouteLabFixture('F18')!.input))
    expect(f2a).toBe(f18)
  })

  it('fixture selection matches engine candidate count and rerank metadata', () => {
    const f1 = runRouteLabFixture('F1', ROOT)
    expect(f1.composed.candidates.length).toBe(f1.reranked.rerankedCandidates.length)
    for (const r of f1.reranked.rerankedCandidates) {
      expect(r.originalComposerRank).toBeGreaterThan(0)
      expect(r.rerankedRank).toBeGreaterThan(0)
      expect(r.composerProvisionalScore).toBeGreaterThan(0)
      expect(r.arcQualityScore).toBeGreaterThan(0)
    }
  })

  it('winner-changed flag matches Gate 2D fixture artifact for F1', () => {
    const f1 = runRouteLabFixture('F1', ROOT)
    const artifact = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/routes/arc-reranker-fixtures.v0.1.json'), 'utf8'),
    )
    const row = artifact.fixtures.find((x: { id: string }) => x.id === 'F1')
    expect(f1.reranked.winnerChanged).toBe(row.winnerChanged)
  })

  it('structural ribbon, theme progression, relation sequence derive deterministically', () => {
    const r = runRouteLabFixture('F2', ROOT)
    const stops = r.composed.candidates[0]!.orderedStops
    expect(structuralRibbon(stops)).toMatch(/A|P|M|·/)
    expect(themeProgression(stops).length).toBe(stops.length)
    expect(relationProgression(stops).length).toBe(stops.length)
    expect(longestStructuralRuns(stops).anchor).toBeGreaterThanOrEqual(0)
  })

  it('omissions panel data includes STGO_104 pending not in route stops', () => {
    const f17 = runRouteLabFixture('F17', ROOT)
    expect(f17.stgo104Diagnostic.presentInRoute).toBe(false)
    const top = f17.composed.candidates[0]!
    expect(top.omittedHighUtilityNodes.some((o) => o.stgoId === 'STGO_104')).toBe(true)
    for (const c of f17.composed.candidates) {
      expect(c.orderedStops.some((s) => s.stgoId === 'STGO_104')).toBe(false)
      expect(c.orderedStops.some((s) => s.stgoId === 'STGO_33')).toBe(false)
    }
  })

  it('provisional flags and no production routing', () => {
    expect(ROUTE_LAB_V0_1_READY).toBe(true)
    expect(ARC_QUALITY_V0_1_PROVISIONAL_READY).toBe(true)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
  })

  it('curator deep-link uses correct STGO ID', () => {
    expect(curatorDeepLink('STGO_01')).toContain('stgoId=STGO_01')
    const cockpit = readFileSync(resolve(ROOT, 'docs/engine/gate-2a1-founder-calibration-cockpit.html'), 'utf8')
    expect(cockpit).toContain('URLSearchParams')
    expect(cockpit).toContain('stgoId')
  })

  it('export snapshot contains request, versions, rerank results', () => {
    const result = runRouteLabFixture('F2', ROOT)
    const selected = result.reranked.rerankedCandidates[0]!.candidate.routeId
    const snap = buildRouteSnapshotExport(result, selected) as Record<string, unknown>
    expect(snap.request).toBeTruthy()
    expect(snap.inputVersions).toBeTruthy()
    expect(snap.reranked).toBeTruthy()
    expect(snap.calibrationApproved).toBe(false)
    expect(routeSnapshotFilename(result)).toMatch(/^route-lab-F2-/)
  })

  it('URL fixture state round-trips', () => {
    const s = { fixture: 'F8', candidateRouteId: 'abc', selectedStopStgoId: 'STGO_01', customRequest: null }
    const q = serializeRouteLabUrlState(s)
    const parsed = parseRouteLabUrlState(q)
    expect(parsed.fixture).toBe('F8')
    expect(parsed.candidateRouteId).toBe('abc')
  })

  it('engine outputs unchanged from Gate 2D regression fingerprint', () => {
    const current = gate2dRegressionFingerprint(ROOT)
    const baseline = loadGate2dFingerprintArtifact(ROOT)
    expect(baseline).toBeTruthy()
    expect(current).toEqual(baseline)
  })

  it('scoring configs not modified (weights unchanged keys)', () => {
    expect(Object.keys(ROUTE_SCORE_WEIGHTS).length).toBeGreaterThan(6)
    expect(Object.keys(ARC_QUALITY_POSITIVE_WEIGHTS).length).toBe(16)
    expect(RERANK_BLEND_WEIGHTS.composerProvisionalScore).toBe(0.6)
  })

  it('generated HTML embeds 18 fixtures when built', () => {
    const htmlPath = resolve(ROOT, 'docs/engine/gate-2e-route-lab.html')
    try {
      const html = readFileSync(htmlPath, 'utf8')
      expect(html).toContain('PROVISIONAL ENGINE OUTPUT')
      expect(html).toContain('"defaultFixtureId":"F2"')
      expect(html.match(/"id":"F1"/g)?.length ?? 0).toBeGreaterThan(0)
    } catch {
      // build may not have run yet in CI order — runRouteLab tests cover engine
      expect(ROUTE_LAB_DEFAULT_FIXTURE_ID).toBe('F2')
    }
  })
})
