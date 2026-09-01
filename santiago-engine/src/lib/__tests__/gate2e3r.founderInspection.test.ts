/**
 * Gate 2E.3-R — founder route inspection (reconstructed equivalent of d4d7f6c1).
 * Observability only. Does not assert R1–R8 or later-gate semantics.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
  runRouteLabFixture,
} from '@/src/dev/route-lab/runRouteLab'
import { runChoicePolicyV02 } from '@/src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { buildFounderInspection } from '@/src/dev/route-lab/founderInspection'
import {
  DISAGREEMENT_CLASSIFICATIONS,
  emptyFounderInspectionReview,
  exportFounderInspectionReviewJson,
  founderReviewIsEngineInput,
  importFounderInspectionReviewJson,
} from '@/src/dev/route-lab/founderInspectionReview'

const ROOT = resolve(__dirname, '../../..')

function inspectFixture(id: string) {
  const lab = runRouteLabFixture(id, ROOT)
  const { arbitration } = runChoicePolicyV02(getInput(id), { root: ROOT })
  return { lab, arbitration, view: buildFounderInspection({ lab, arbitration, root: ROOT }) }
}

function getInput(id: string) {
  const fx = ROUTE_LAB_FIXTURES.find((f) => f.id === id)
  if (!fx) throw new Error(id)
  return fx.input
}

describe('Gate 2E.3-R founder route inspection', () => {
  it('inspection representation is deterministic', () => {
    const a = inspectFixture('F2').view
    const b = inspectFixture('F2').view
    expect(a).toEqual(b)
  })

  it('inspection layer reproduces existing engine result without mutation', () => {
    const lab = runRouteLabFixture('F2', ROOT)
    const before = JSON.stringify({
      composed: lab.composed,
      reranked: lab.reranked,
    })
    const { arbitration } = runChoicePolicyV02(getInput('F2'), { root: ROOT })
    const view = buildFounderInspection({ lab, arbitration, root: ROOT })
    expect(JSON.stringify({ composed: lab.composed, reranked: lab.reranked })).toBe(before)
    expect(view.result.routeId.value).toBe(lab.reranked.topRerankedRouteId)
    expect(view.humanReviewAffectsEngine).toBe(false)
  })

  it('exact stop order is exposed', () => {
    const { lab, view } = inspectFixture('F8')
    const winner = lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!
    const expected = winner.candidate.orderedStops.map((s) => s.stgoId)
    expect(view.result.orderedStopIds.availability).toBe('AVAILABLE')
    expect(view.result.orderedStopIds.value).toEqual(expected)
    expect(view.inclusionTrace.map((s) => s.stgoId)).toEqual(expected)
  })

  it('fingerprint is exposed', () => {
    const { view } = inspectFixture('F2')
    expect(view.result.routeFingerprint.availability).toBe('AVAILABLE')
    expect(view.result.routeFingerprint.value).toMatch(/^[a-f0-9]{16}$/)
    expect(view.result.requestHash.availability).toBe('AVAILABLE')
    expect(view.result.requestHash.value).toBeTruthy()
  })

  it('available score components are exposed', () => {
    const { view } = inspectFixture('F2')
    const keys = view.scoreTrace.map((s) => s.key)
    expect(keys).toContain('provisionalRouteScore')
    expect(keys).toContain('rerankedScore')
    expect(keys).toContain('arcQualityScore')
    expect(keys).toContain('travelerMatchRoute')
    const routeScore = view.scoreTrace.find((s) => s.key === 'provisionalRouteScore')
    expect(routeScore?.availability).toBe('AVAILABLE')
    expect(typeof routeScore?.value).toBe('number')
  })

  it('unavailable fields are UNKNOWN / NOT_MODELED rather than fabricated', () => {
    const { view } = inspectFixture('F2')
    expect(view.request.familiarity.availability).toBe('NOT_MODELED')
    expect(view.request.familiarity.value).toBeNull()
    for (const stop of view.inclusionTrace) {
      if (!stop.narrativeRelation.value) {
        expect(stop.narrativeRelation.availability).toBe('UNKNOWN')
      }
    }
    for (const coord of view.geographicTrace.orderedCoordinates) {
      expect(['AVAILABLE', 'UNKNOWN']).toContain(coord.availability)
      if (coord.availability === 'UNKNOWN') {
        expect(coord.lat).toBeNull()
        expect(coord.lng).toBeNull()
      }
    }
  })

  it('founder-review fields do not affect route output', () => {
    const before = runRouteLabFixture('F2', ROOT)
    const beforeId = before.reranked.topRerankedRouteId
    const beforeStops = before.reranked.rerankedCandidates
      .find((x) => x.rerankedRank === 1)!
      .candidate.orderedStops.map((s) => s.stgoId)
    const review = emptyFounderInspectionReview('F2', beforeId ?? 'x', 'abcd')
    review.travelerFit = 1
    review.sellable = 'NO'
    review.founderNotes = 'would change scoring if wired (must not)'
    expect(founderReviewIsEngineInput(review)).toBe(false)
    const after = runRouteLabFixture('F2', ROOT)
    expect(after.reranked.topRerankedRouteId).toBe(beforeId)
    expect(
      after.reranked.rerankedCandidates
        .find((x) => x.rerankedRank === 1)!
        .candidate.orderedStops.map((s) => s.stgoId),
    ).toEqual(beforeStops)
  })

  it('disagreement classification does not affect route output', () => {
    const before = runRouteLabFixture('F15', ROOT)
    for (const c of DISAGREEMENT_CLASSIFICATIONS) {
      const review = emptyFounderInspectionReview('F15', before.reranked.topRerankedRouteId ?? 'x', '')
      review.disagreementClassification = c
      expect(founderReviewIsEngineInput(review)).toBe(false)
    }
    const json = exportFounderInspectionReviewJson({
      schemaVersion: 'cw_founder_inspection_review.v0.1',
      reviews: {
        'F15::x': emptyFounderInspectionReview('F15', 'x', ''),
      },
    })
    expect(importFounderInspectionReviewJson(json).schemaVersion).toBe('cw_founder_inspection_review.v0.1')
    const after = runRouteLabFixture('F15', ROOT)
    expect(after.reranked.topRerankedRouteId).toBe(before.reranked.topRerankedRouteId)
    expect(after.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!.rerankedScore).toBe(
      before.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!.rerankedScore,
    )
  })

  it('F1–F18 outputs remain frozen', () => {
    const d2 = gate2dRegressionFingerprint(ROOT)
    const d2base = loadGate2dFingerprintArtifact(ROOT)
    expect(d2).toEqual(d2base)
    const full = gate2e1EngineOutputFingerprint(ROOT)
    const fullBase = loadGate2e1FingerprintBaseline(ROOT)
    expect(full).toEqual(fullBase)
  })

  it('Founder Inspection mode exists on Route Lab and later-gate modules are not imported', () => {
    const shell = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-shell.html'), 'utf8')
    const ui = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js'), 'utf8')
    expect(shell).toContain('FOUNDER INSPECTION')
    expect(ui).toContain('founderInspection')
    expect(ui).toContain('humanReviewAffectsEngine')
    const adapter = readFileSync(resolve(ROOT, 'src/dev/route-lab/founderInspection.ts'), 'utf8')
    expect(adapter).not.toMatch(/experience-time/)
    expect(adapter).not.toMatch(/src\/engine\/vnext/)
    expect(adapter).not.toMatch(/ExperienceTimeProfile/)
    expect(adapter).not.toMatch(/FEATURE_COMPLETE_ALPHA/)
  })
})
