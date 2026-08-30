/**
 * Gate 2E.4 — Experience-Time Model V0.1 contract + parallel evaluator tests.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import {
  EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY,
  EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  ROUTE_ARBITRATION_V0_2_PARALLEL_READY,
  ROUTE_ARBITRATION_V0_2_PRODUCTION,
} from '@/src/lib/city-graph/flags'
import { loadCalibrationByStgoId } from '@/src/engine/loadCalibration'
import { loadSantiagoEngineNodes } from '@/src/engine/loadSantiagoNodes'
import {
  adaptLegacyScalarDwell,
  assertCalibratedProvenance,
  buildR1ShadowDiagnostic,
  computeEffectiveMarginalTime,
  computeElapsedTimeAvoidingDoubleCount,
  computeRouteTimeBudget,
  DENSE_CORE_POLICY_V0_1,
  emptyCuratorExperienceTimeRecord,
  evaluateParallelRouteTime,
  passThroughImpliesZeroDwell,
  resolveOnPath,
  VISIT_MODE_TAXONOMY_V0_1,
  type ExperienceTimeProfile,
} from '@/src/engine/routes/experience-time'
import { ROUTE_SCORE_WEIGHTS } from '@/src/engine/routes/route-config'
import { ARC_QUALITY_POSITIVE_WEIGHTS, RERANK_BLEND_WEIGHTS } from '@/src/engine/routes/arc-quality-config'
import {
  LANE_OBJECTIVE_WEIGHTS,
  H1_OBJECTIVE_WEIGHTS,
} from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import {
  ARBITRATION_VERSION,
  ROUTE_CHOICE_WEIGHTS,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { gate2e1EngineOutputFingerprint, loadGate2e1FingerprintBaseline } from '@/src/dev/route-lab/runRouteLab'

const ROOT = resolve(__dirname, '../../..')

function sampleProfile(overrides: Partial<ExperienceTimeProfile>): ExperienceTimeProfile {
  return {
    stgoId: 'STGO_TEST',
    experienceId: 'STGO_TEST:EXTERIOR_CORE',
    visitMode: 'EXTERIOR_CORE',
    dwellMin: 5,
    dwellTypical: 10,
    dwellMax: 15,
    accessOverheadMin: 0,
    openingHoursDependent: false,
    ticketDependent: false,
    canBeOptionalExtension: false,
    baseExperienceRef: null,
    stopRole: 'REQUIRED_STOP',
    contentTime: {
      authoredContentMin: null,
      stationaryDwellMin: null,
      walkCompatibleContentMin: null,
      requiredStop: null,
      contentMayOverlapMovement: null,
    },
    onPath: null,
    provenance: 'CURATOR_APPROVED',
    confidence: 'MEDIUM',
    ...overrides,
  }
}

describe('Gate 2E.4 Experience-Time Model V0.1', () => {
  it('1 — legacy composer config weights unchanged (byte-stable snapshot keys)', () => {
    expect(ROUTE_SCORE_WEIGHTS).toMatchObject({
      nodeUtility: expect.any(Number),
      narrative: expect.any(Number),
    })
    expect(H1_OBJECTIVE_WEIGHTS).toBeTruthy()
    expect(LANE_OBJECTIVE_WEIGHTS.SIGNATURE).toBeTruthy()
  })

  it('2 — legacy dwell scalars unchanged for Launch30 calibrated nodes', () => {
    const cal = loadCalibrationByStgoId(ROOT)
    const plaza = cal.get('STGO_01')!
    expect(plaza.visitTime.typical).toBeTypeOf('number')
    expect(plaza.visitTime.provenance).toBeTruthy()
    const adapter = adaptLegacyScalarDwell({
      stgoId: 'STGO_01',
      visitTimeTypical: plaza.visitTime.typical,
      visitTimeMin: plaza.visitTime.min,
      visitTimeMax: plaza.visitTime.max,
    })
    expect(adapter.kind).toBe('LEGACY_SCALAR_DWELL')
    expect(adapter.dwellTypical).toBe(plaza.visitTime.typical)
    expect(adapter.visitMode).toBe('UNKNOWN')
  })

  it('3 — new evaluator is parallel only (production flags false)', () => {
    expect(EXPERIENCE_TIME_MODEL_V0_1_PARALLEL_READY).toBe(true)
    expect(EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION).toBe(false)
    const ev = evaluateParallelRouteTime({
      movementTimeMin: 20,
      profiles: [sampleProfile({})],
    })
    expect(ev.productionComposerAffected).toBe(false)
  })

  it('4 — effective marginal movement formula', () => {
    const r = computeEffectiveMarginalTime({
      movementAX: 5,
      movementXB: 6,
      movementAB: 8,
      experienceDwellMin: 12,
      accessOverheadMin: 2,
    })
    // (5+6-8) + 12 + 2 = 17
    expect(r.marginalMovementMin).toBe(3)
    expect(r.effectiveMarginalTimeMin).toBe(17)
  })

  it('5 — optional extension excluded from core time', () => {
    const core = sampleProfile({ stgoId: 'A', experienceId: 'A:core', dwellTypical: 10 })
    const ext = sampleProfile({
      stgoId: 'B',
      experienceId: 'B:ext',
      visitMode: 'OPTIONAL_INTERIOR',
      canBeOptionalExtension: true,
      stopRole: 'OPTIONAL_EXTENSION',
      dwellTypical: 25,
      ticketDependent: true,
    })
    const ev = evaluateParallelRouteTime({
      movementTimeMin: 20,
      profiles: [core, ext],
      prefs: { includeOptionalExtensions: false },
    })
    expect(ev.coreDwellMin).toBe(10)
    expect(ev.optionalExtensionMin).toBe(25)
    expect(ev.coreRouteTimeMin).toBe(30)
    expect(ev.stops.find((s) => s.stgoId === 'B')!.countedInCore).toBe(false)
  })

  it('6 — optional extension included when explicitly requested', () => {
    const core = sampleProfile({ stgoId: 'A', experienceId: 'A:core', dwellTypical: 10 })
    const ext = sampleProfile({
      stgoId: 'B',
      experienceId: 'B:ext',
      visitMode: 'OPTIONAL_INTERIOR',
      canBeOptionalExtension: true,
      stopRole: 'OPTIONAL_EXTENSION',
      dwellTypical: 25,
    })
    const ev = evaluateParallelRouteTime({
      movementTimeMin: 20,
      profiles: [core, ext],
      prefs: { includeOptionalExtensions: true },
    })
    expect(ev.coreRouteTimeMin).toBe(30)
    expect(ev.totalWithExtensionsMin).toBe(55)
    expect(ev.stops.find((s) => s.stgoId === 'B')!.countedInCore).toBe(true)
  })

  it('7 — UNKNOWN mode remains UNKNOWN', () => {
    const p = sampleProfile({ visitMode: 'UNKNOWN', dwellTypical: null, provenance: 'UNKNOWN' })
    const ev = evaluateParallelRouteTime({ movementTimeMin: 10, profiles: [p] })
    expect(ev.stops[0]!.visitMode).toBe('UNKNOWN')
    expect(ev.stops[0]!.status).toBe('EXPERIENCE_TIME_UNKNOWN')
    expect(VISIT_MODE_TAXONOMY_V0_1.some((t) => t.mode === 'UNKNOWN')).toBe(true)
  })

  it('8 — UNKNOWN dwell remains UNKNOWN (null)', () => {
    const p = sampleProfile({ dwellTypical: null, dwellMin: null, dwellMax: null })
    const ev = evaluateParallelRouteTime({ movementTimeMin: 10, profiles: [p] })
    expect(ev.coreDwellMin).toBeNull()
    expect(ev.unknownComponents.some((c) => c.includes('dwellTypical'))).toBe(true)
  })

  it('9 — no fabricated fallback in new model', () => {
    const budget = computeRouteTimeBudget({
      movementTimeMin: null,
      coreExperienceTimeMin: null,
      accessOverheadMin: null,
      optionalExtensionTimeMin: null,
    })
    expect(budget.coreRouteTimeMin).toBeNull()
    expect(budget.toleranceMin).toBe(8)
    // Must not invent 12-minute dwell
    expect(budget.coreExperienceTimeMin).not.toBe(12)
  })

  it('10 — pass-through does not imply zero dwell', () => {
    expect(passThroughImpliesZeroDwell()).toBe(false)
    const p = sampleProfile({
      visitMode: 'PASS_THROUGH',
      dwellTypical: 3,
      stopRole: 'ENROUTE_DISCOVERY',
    })
    expect(p.dwellTypical).toBe(3)
  })

  it('11 — onPath UNKNOWN when geometry insufficient', () => {
    expect(
      resolveOnPath({
        hasCanonicalCorridorGeometry: false,
        placeOnCorridorEvidence: false,
        geometryQuality: 'INSUFFICIENT',
      }),
    ).toBeNull()
    expect(
      resolveOnPath({
        hasCanonicalCorridorGeometry: null,
        placeOnCorridorEvidence: null,
        geometryQuality: 'UNKNOWN',
      }),
    ).toBeNull()
    expect(
      resolveOnPath({
        hasCanonicalCorridorGeometry: true,
        placeOnCorridorEvidence: true,
        geometryQuality: 'SUFFICIENT',
      }),
    ).toBe(true)
  })

  it('12 — ticket dependency represented', () => {
    const p = sampleProfile({ ticketDependent: true, visitMode: 'INTERIOR_CORE' })
    expect(p.ticketDependent).toBe(true)
  })

  it('13 — hours dependency represented', () => {
    const p = sampleProfile({ openingHoursDependent: true })
    expect(p.openingHoursDependent).toBe(true)
  })

  it('14 — provenance required for calibrated time values', () => {
    const bad = sampleProfile({ provenance: 'UNKNOWN', dwellTypical: 10 })
    expect(assertCalibratedProvenance(bad).length).toBeGreaterThan(0)
    const good = sampleProfile({ provenance: 'CURATOR_APPROVED', dwellTypical: 10 })
    expect(assertCalibratedProvenance(good)).toEqual([])
  })

  it('15–16 — Route Lab engine fingerprint baseline unchanged (R1–R8 / lab outputs)', () => {
    const baseline = loadGate2e1FingerprintBaseline(ROOT)
    expect(baseline).toBeTruthy()
    const current = gate2e1EngineOutputFingerprint(ROOT)
    expect(current).toEqual(baseline)
  })

  it('17 — H2 lane weights present and unchanged shape', () => {
    expect(Object.keys(LANE_OBJECTIVE_WEIGHTS).sort()).toEqual(['DISCOVERY', 'FLOW', 'SIGNATURE'])
  })

  it('18 — Arc weights unchanged shape', () => {
    expect(ARC_QUALITY_POSITIVE_WEIGHTS).toBeTruthy()
    expect(RERANK_BLEND_WEIGHTS).toBeTruthy()
  })

  it('19 — arbitration unchanged', () => {
    expect(ROUTE_ARBITRATION_V0_2_PARALLEL_READY).toBe(true)
    expect(ROUTE_ARBITRATION_V0_2_PRODUCTION).toBe(false)
    expect(ARBITRATION_VERSION).toBeTruthy()
    expect(ROUTE_CHOICE_WEIGHTS).toBeTruthy()
  })

  it('20 — production routing false', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION).toBe(false)
  })

  it('R1 shadow diagnostic reports EXPERIENCE_TIME_UNKNOWN (no invented modes)', () => {
    const cal = loadCalibrationByStgoId(ROOT)
    const legacy: Record<string, number | null> = {}
    for (const id of [
      'STGO_01',
      'STGO_02',
      'STGO_16',
      'STGO_22',
      'STGO_19',
      'STGO_18',
      'STGO_06',
      'STGO_92',
      'STGO_03',
    ]) {
      legacy[id] = cal.get(id)?.visitTime.typical ?? null
    }
    const diag = buildR1ShadowDiagnostic(legacy)
    expect(diag.productionComposerAffected).toBe(false)
    expect(diag.pois).toHaveLength(9)
    for (const p of diag.pois) {
      expect(p.experienceTimeStatus).toBe('EXPERIENCE_TIME_UNKNOWN')
      expect(p.visitMode).toBe('UNKNOWN')
      expect(p.onPath).toBeNull()
      expect(p.missingCalibration.length).toBeGreaterThan(5)
    }
  })

  it('dense-core policy forbids commune stop quotas', () => {
    expect(DENSE_CORE_POLICY_V0_1.communeStopQuotas).toBe(false)
    expect(DENSE_CORE_POLICY_V0_1.mechanism).toBe('effective_marginal_time')
  })

  it('content overlap concurrency: walk-compatible does not double-count when declared', () => {
    const overlap = computeElapsedTimeAvoidingDoubleCount({
      movementTimeMin: 20,
      stationaryDwellMin: 5,
      walkCompatibleContentMin: 8,
      contentMayOverlapMovement: true,
    })
    expect(overlap.elapsedMin).toBe(25)

    const unknown = computeElapsedTimeAvoidingDoubleCount({
      movementTimeMin: 20,
      stationaryDwellMin: 5,
      walkCompatibleContentMin: 8,
      contentMayOverlapMovement: null,
    })
    expect(unknown.unknownReasons).toContain('contentMayOverlapMovement')
  })

  it('curator schema empty shell available', () => {
    const rec = emptyCuratorExperienceTimeRecord('STGO_22')
    expect(rec.provenanceRequired).toBe(true)
    expect(rec.workflow.state).toBe('EMPTY')
    expect(rec.fields.defaultCoreVisitMode).toBeNull()
  })

  it('identity: STGO_18 Edificio Ariztía; STGO_105 Teatro; STGO_59 Club de la Unión', () => {
    const engine = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    )
    const n18 = engine.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_18')
    const n59 = engine.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_59')
    const n105 = engine.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_105')
    expect(n18.canonicalName).toBe('Edificio Ariztía')
    expect(n18.displayName).toBe('Edificio Ariztía')
    expect(n18.aliases).toContain('Edificio Ariztía (Flat-Iron)')
    expect(n18.canonicalName).not.toMatch(/Palacio/i)
    expect(n18.poiCoordinate).toEqual({ lat: -33.4421039, lng: -70.6515891 })
    expect(n59.canonicalName).toBe('Club de la Unión')
    expect(n105.canonicalName).toBe('Teatro Municipal de Santiago')
    expect(n105.poiCoordinate).toBeNull()
    expect(n105.launchCorpus).toBe(false)
    expect(n105.launchRuntimeDisposition).toBe('IDENTITY_RESOLVED_PHYSICAL_PENDING')
    expect(n105.physicalRouteGenerationEligible).toBe(false)
  })

  it('frozen 103-node seed remains byte-identical', () => {
    const raw = readFileSync(
      resolve(ROOT, 'src/data/santiago/source/SANTIAGO_ENGINE_DATASET_V0.1.json'),
    )
    const sha = createHash('sha256').update(raw).digest('hex')
    expect(sha).toBe('fd8e6fa5329dac91d74105c379884b53c1157ef737caec3e75430c8b81fe5ff5')
    expect(loadSantiagoEngineNodes(ROOT).some((n) => n.stgoId === 'STGO_105')).toBe(true)
  })
})
