/**
 * Gate 2E.3.2-R — route-time & marginal-insertion diagnostics (reconstructed equivalent of d8f7d6c2).
 * Observability only. Does not implement Experience-Time or R1–R8.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { getRouteLabFixture, ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'
import { buildFounderInspection } from '@/src/dev/route-lab/founderInspection'
import { IDENTITY_DIAGNOSTIC_FINDINGS } from '@/src/dev/route-lab/identityDiagnosticFindings'
import { MODELING_DEFICIENCY_FINDING } from '@/src/dev/route-lab/modelingDeficiencyFinding'
import { LOST_HISTORICAL_SCENARIOS } from '@/src/dev/route-lab/lostHistoricalScenarios'
import {
  buildRouteTimeLedger,
  buildTimeInsertionDiagnostics,
  diagnoseMarginalInsertion,
  missingTimeConceptDiagnostics,
} from '@/src/dev/route-lab/routeTimeDiagnostics'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
  runRouteLabFixture,
} from '@/src/dev/route-lab/runRouteLab'
import { runChoicePolicyV02 } from '@/src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { loadScenarioQaOracle } from '@/src/dev/route-lab/scenarioIdentity'
import { ROUTE_SCORE_WEIGHTS } from '@/src/engine/routes/route-config'
import { ARC_QUALITY_POSITIVE_WEIGHTS, RERANK_BLEND_WEIGHTS } from '@/src/engine/routes/arc-quality-config'
import { ROUTE_CHOICE_WEIGHTS, TRAVELER_MATCH_ROUTE_WEIGHTS } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { LANE_OBJECTIVE_WEIGHTS } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import { COMPONENT_CAPS } from '@/src/engine/scoring/constants'
import { NARRATIVE_EDGE_SCORE_WEIGHTS } from '@/src/engine/narrative/narrative-constants'

const ROOT = resolve(__dirname, '../../..')
const ENGINE_NODE_PATH = resolve(ROOT, 'src/data/santiago/santiago_engine_nodes.v0.1.json')

function inspect(id: string) {
  const fx = getRouteLabFixture(id)!
  const lab = runRouteLabFixture(id, ROOT)
  const { arbitration } = runChoicePolicyV02(fx.input, { root: ROOT })
  const view = buildFounderInspection({ lab, arbitration, root: ROOT })
  return { lab, arbitration, view }
}

describe('Gate 2E.3.2-R route model diagnostics', () => {
  it('A/B. time ledger reconciles exactly to existing engine modeled time', () => {
    const { lab } = inspect('F2')
    const winner = lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!
    const ledger = buildRouteTimeLedger(winner.candidate)
    expect(ledger.reconcilesExactly).toBe(true)
    expect(ledger.TOTAL_TRANSITION_MIN + ledger.TOTAL_DWELL_MIN).toBeCloseTo(ledger.TOTAL_MODELED_MIN, 10)
    expect(ledger.TOTAL_MODELED_MIN).toBe(winner.candidate.totalEstimatedMin)
    expect(ledger.TOTAL_TRANSITION_MIN).toBe(winner.candidate.movementMin)
    expect(ledger.TOTAL_DWELL_MIN).toBe(winner.candidate.dwellMin)
  })

  it('C. NOT_MODELED fields are not numerically coerced to zero', () => {
    for (const row of missingTimeConceptDiagnostics()) {
      expect(row.availability).toBe('NOT_MODELED')
      expect(row.value).toBeNull()
      expect(row.value).not.toBe(0)
    }
    const { view } = inspect('F2')
    for (const row of view.timeInsertionDiagnostics!.missingConcepts) {
      expect(row.value).toBeNull()
      expect(row.availability).toBe('NOT_MODELED')
    }
  })

  it('D. marginal insertion diagnostic does not alter route output', () => {
    const before = runRouteLabFixture('F2', ROOT)
    const beforeId = before.reranked.topRerankedRouteId
    const winner = before.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!
    const stops = winner.candidate.orderedStops
    diagnoseMarginalInsertion({
      A: stops[0]!.stgoId,
      X: 'STGO_92',
      B: stops[1]!.stgoId,
      transportPolicy: winner.candidate.requestSnapshot.transportPolicy,
      dwellX: 12,
      root: ROOT,
    })
    buildTimeInsertionDiagnostics({ candidate: winner.candidate, lab: before, root: ROOT })
    const after = runRouteLabFixture('F2', ROOT)
    expect(after.reranked.topRerankedRouteId).toBe(beforeId)
    expect(after.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!.rerankedScore).toBe(
      before.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!.rerankedScore,
    )
  })

  it('E. identity findings do not alter node data', () => {
    const raw = JSON.parse(readFileSync(ENGINE_NODE_PATH, 'utf8'))
    const n18 = raw.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_18')
    const n59 = raw.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_59')
    const n29 = raw.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_29')
    expect(n18.displayName).toBe('Edificio Palacio Ariztía (Flat-Iron)')
    expect(n59.displayName).toBe('Club de la Unión')
    expect(n29.displayName).toBe('La Chascona (Neruda House)')
    expect(n29.legacySlug).toBe('teatro-municipal')
    expect(IDENTITY_DIAGNOSTIC_FINDINGS.STGO_18.resolutionApplied).toBe(false)
    expect(IDENTITY_DIAGNOSTIC_FINDINGS.TEATRO_MUNICIPAL.stgo105InventedHere).toBe(false)
    expect(raw.nodes.some((n: { stgoId: string }) => n.stgoId === 'STGO_105')).toBe(false)
    const hash = createHash('sha256').update(readFileSync(ENGINE_NODE_PATH)).digest('hex')
    expect(hash.length).toBe(64)
  })

  it('G. no scoring-weight changes', () => {
    expect(ROUTE_SCORE_WEIGHTS.nodeUtility).toBe(0.34)
    expect(ROUTE_SCORE_WEIGHTS.detourPenalty).toBe(0.06)
    expect(ARC_QUALITY_POSITIVE_WEIGHTS.openingStrength).toBe(0.08)
    expect(RERANK_BLEND_WEIGHTS.composerProvisionalScore).toBe(0.6)
    expect(ROUTE_CHOICE_WEIGHTS.travelerMatchRoute).toBe(0.3)
    expect(TRAVELER_MATCH_ROUTE_WEIGHTS.dwellWeightedMean).toBe(0.5)
    expect(LANE_OBJECTIVE_WEIGHTS.SIGNATURE.intrinsicWorth).toBe(0.25)
    expect(LANE_OBJECTIVE_WEIGHTS.DISCOVERY.marginalRouteValue).toBe(0.35)
    expect(COMPONENT_CAPS.editorial).toBe(30)
    expect(NARRATIVE_EDGE_SCORE_WEIGHTS.semanticContinuity).toBe(0.22)
  })

  it('H. Founder Inspection diagnostic rendering is deterministic', () => {
    const a = inspect('F2').view.timeInsertionDiagnostics
    const b = inspect('F2').view.timeInsertionDiagnostics
    expect(a).toEqual(b)
    expect(a?.ledger.reconcilesExactly).toBe(true)
  })

  it('I. unavailable A-X / X-B / A-B evidence returns UNKNOWN', () => {
    const d = diagnoseMarginalInsertion({
      A: 'STGO_01',
      X: 'STGO_DOES_NOT_EXIST',
      B: 'STGO_02',
      transportPolicy: 'WALK_ONLY',
      dwellX: 12,
      root: ROOT,
    })
    expect(d.movementAX.availability).toBe('UNKNOWN')
    expect(d.movementXB.availability).toBe('UNKNOWN')
    expect(d.movementDelta.availability).toBe('UNKNOWN')
    expect(d.movementDelta.minutes).toBeNull()
    expect(d.diagnosticKnownInsertionBurden.availability).toBe('UNKNOWN')
    expect(d.onPathClassification).toBe('UNKNOWN')
    expect(d.runtimeUsedBySearch).toBe(false)
    expect(d.label).toBe('PRE_2E4_DIAGNOSTIC_INSERTION_ESTIMATE')
  })

  it('J. 116.1 is not an executable oracle', () => {
    expect(LOST_HISTORICAL_SCENARIOS.r1ModeledMinutes.status).toBe('UNVERIFIED_HISTORICAL_NOTE')
    expect(LOST_HISTORICAL_SCENARIOS.r1ModeledMinutes.executableOracle).toBe(false)
    const oracle = loadScenarioQaOracle(ROOT)
    expect(JSON.stringify(oracle.records)).not.toMatch(/116\.1/)
    const { view } = inspect('F15')
    expect(view.r1HistoricalNote.executableOracle).toBe(false)
    expect(view.r1HistoricalNote.status).toBe('UNVERIFIED_HISTORICAL_NOTE')
    expect(view.result.totalModeledMinutes.value).not.toBe(116.1)
  })

  it('Bandera / La Moneda reconstruction does not invent a historical R-scenario', () => {
    const { view } = inspect('F1')
    expect(view.banderaMoneda?.moneda.reconstructable).toBe(true)
    expect(view.banderaMoneda?.moneda.omission?.reasonCode).toBe('NOT_EXPANDED_IN_BEAM')
    expect(view.banderaMoneda?.bandera.selected).toBe(true)
    const f2 = inspect('F2')
    expect(f2.view.banderaMoneda?.bandera.selected).toBe(false)
    expect(f2.view.banderaMoneda?.bandera.omission).toBeNull()
    expect(f2.view.banderaMoneda?.bandera.reconstructable).toBe(false)
  })

  it('later-gate runtime modules are not imported', () => {
    const files = [
      'src/dev/route-lab/routeTimeDiagnostics.ts',
      'src/dev/route-lab/identityDiagnosticFindings.ts',
      'src/dev/route-lab/modelingDeficiencyFinding.ts',
      'src/dev/route-lab/founderInspection.ts',
    ]
    for (const rel of files) {
      const src = readFileSync(resolve(ROOT, rel), 'utf8')
      expect(src).not.toMatch(/src\/engine\/routes\/experience-time/)
      expect(src).not.toMatch(/src\/engine\/vnext/)
      expect(src).not.toMatch(/ExperienceTimeProfile/)
      expect(src).not.toMatch(/FEATURE_COMPLETE_ALPHA/)
      expect(src).not.toMatch(/ArcStateVNext/)
    }
  })
})

describe('Gate 2E.3.2-R F1–F18 freeze', () => {
  it('F. F1–F18 outputs unchanged vs 2E.3.1-R parent freeze', () => {
    const d2 = gate2dRegressionFingerprint(ROOT)
    expect(d2).toEqual(loadGate2dFingerprintArtifact(ROOT))
    const full = gate2e1EngineOutputFingerprint(ROOT)
    expect(full).toEqual(loadGate2e1FingerprintBaseline(ROOT))
    const oracle = loadScenarioQaOracle(ROOT)
    for (const fx of ROUTE_LAB_FIXTURES) {
      const { lab, arbitration, view } = inspect(fx.id)
      const winner = lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1)!
      const frozen = oracle.records[fx.id]!
      expect(winner.candidate.orderedStops.map((s) => s.stgoId)).toEqual(frozen.orderedStopIds)
      expect(winner.candidate.totalEstimatedMin).toBe(frozen.totalModeledMinutes)
      expect(winner.candidate.provisionalRouteScore).toBe(frozen.composerScore)
      expect(String(arbitration.recommendedLane)).toBe(frozen.winningLane)
      expect(view.timeInsertionDiagnostics?.ledger.reconcilesExactly).toBe(true)
    }
  }, 120000)

  it('UI surfaces time / insertion diagnostics', () => {
    const ui = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js'), 'utf8')
    expect(ui).toContain('Time / insertion diagnostics')
    expect(ui).toContain('PRE_2E4_DIAGNOSTIC_INSERTION_ESTIMATE')
    expect(ui).toContain('NOT_MODELED ≠ 0')
    expect(MODELING_DEFICIENCY_FINDING.scoringWeightTuningInsufficient).toBe(true)
    expect(MODELING_DEFICIENCY_FINDING.implementedHere).toBe(false)
  })
})
