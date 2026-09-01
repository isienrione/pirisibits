/**
 * Gate 2E.3.1-R — scenario identity + reproducibility QA (reconstructed equivalent of 3da1d8bd).
 * Executable oracle: F1–F18. Historical R1–R8 are LOST_HISTORICAL_ORACLES, not asserted here.
 */

import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getRouteLabFixture, ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'
import { buildFounderInspection } from '@/src/dev/route-lab/founderInspection'
import { LOST_HISTORICAL_SCENARIOS } from '@/src/dev/route-lab/lostHistoricalScenarios'
import {
  buildScenarioIdentity,
  buildScenarioQaRecord,
  compareToFrozenOracle,
  loadScenarioQaOracle,
  scenarioFingerprintForInput,
  type ScenarioQaRecord,
} from '@/src/dev/route-lab/scenarioIdentity'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
  runRouteLabFixture,
} from '@/src/dev/route-lab/runRouteLab'
import { runChoicePolicyV02 } from '@/src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'

const ROOT = resolve(__dirname, '../../..')
const CONTAMINATED = [
  'ExperienceTimeProfile',
  'FEATURE_COMPLETE_ALPHA',
  'ArcStateVNext',
  'IncrementalArcValue',
  'ArcQualityVNext',
  'PASS_THROUGH',
  'EXTERIOR_CORE',
  'INTERIOR_CORE',
  'OPTIONAL_INTERIOR',
  'EXTENDED_VISIT',
]

function liveRecord(id: string): { qa: ScenarioQaRecord; lab: ReturnType<typeof runRouteLabFixture> } {
  const fx = getRouteLabFixture(id)
  if (!fx) throw new Error(id)
  const lab = runRouteLabFixture(id, ROOT)
  const { arbitration } = runChoicePolicyV02(fx.input, { root: ROOT })
  return { qa: buildScenarioQaRecord({ fixture: fx, lab, arbitration }), lab }
}

describe('Gate 2E.3.1-R scenario identity QA', () => {
  it('A. identical scenario → identical scenarioFingerprint', () => {
    const a = buildScenarioIdentity(getRouteLabFixture('F2')!)
    const b = buildScenarioIdentity(getRouteLabFixture('F2')!)
    expect(a.scenarioFingerprint).toBe(b.scenarioFingerprint)
    expect(a.scenarioFingerprint).toMatch(/^[a-f0-9]{24}$/)
  })

  it('B. route-affecting request change → different scenarioFingerprint', () => {
    const fx = getRouteLabFixture('F2')!
    const base = buildScenarioIdentity(fx).scenarioFingerprint
    const changed = scenarioFingerprintForInput('F2', { ...fx.input, timeBudgetMin: 90 })
    expect(changed).not.toBe(base)
    const theme = scenarioFingerprintForInput('F5', {
      ...getRouteLabFixture('F5')!.input,
      preferredThemes: ['T2'],
    })
    expect(theme).not.toBe(buildScenarioIdentity(getRouteLabFixture('F5')!).scenarioFingerprint)
  })

  it('C. presentation-only metadata does not change scenarioFingerprint', () => {
    const fx = getRouteLabFixture('F2')!
    const a = buildScenarioIdentity(fx)
    const b = buildScenarioIdentity({
      ...fx,
      label: 'CHANGED LABEL',
      description: 'CHANGED DESCRIPTION',
      watchNote: 'CHANGED NOTE',
      watchCase: false,
    })
    expect(b.scenarioFingerprint).toBe(a.scenarioFingerprint)
  })

  it('D. scenario identity is deterministic across repeated runs', () => {
    const fingerprints = Array.from({ length: 5 }, () => buildScenarioIdentity(getRouteLabFixture('F8')!).scenarioFingerprint)
    expect(new Set(fingerprints).size).toBe(1)
  })

  it('E. route fingerprint remains distinct from scenario fingerprint', () => {
    const { qa } = liveRecord('F2')
    expect(qa.routeFingerprintV01).toMatch(/^[a-f0-9]{16}$/)
    expect(qa.scenarioFingerprint).not.toBe(qa.routeFingerprintV01)
    expect(qa.scenarioFingerprint).not.toBe(qa.requestHash)
    expect(qa.routeFingerprintV02).toBeTruthy()
    expect(qa.routeFingerprintV02).not.toBe(qa.scenarioFingerprint)
    expect(qa.routeFingerprintV02).not.toBe(qa.routeFingerprintV01)
  })

  it('G. accidental fixture drift is detectable', () => {
    const oracle = loadScenarioQaOracle(ROOT)
    const frozen = oracle.records.F2
    expect(frozen).toBeTruthy()
    const fx = getRouteLabFixture('F2')!
    const drifted = scenarioFingerprintForInput('F2', {
      ...fx.input,
      timeBudgetMin: (fx.input.timeBudgetMin ?? 120) + 15,
    })
    expect(drifted).not.toBe(frozen.scenarioFingerprint)
    const live = buildScenarioIdentity(fx)
    expect(compareToFrozenOracle({ ...frozen, scenarioFingerprint: drifted }, frozen).scenarioDrift).toBe('YES')
    expect(compareToFrozenOracle({ ...frozen, scenarioFingerprint: live.scenarioFingerprint }, frozen).scenarioDrift).toBe(
      'NO',
    )
  })

  it('lost R1–R8 tombstone is not an executable oracle', () => {
    expect(LOST_HISTORICAL_SCENARIOS.status).toBe('LOST_HISTORICAL_ORACLES')
    expect(LOST_HISTORICAL_SCENARIOS.originalSha).toBe('3da1d8bd')
    expect(LOST_HISTORICAL_SCENARIOS.originalShaStatus).toBe('UNRECOVERABLE')
    expect(LOST_HISTORICAL_SCENARIOS.r1ModeledMinutes.status).toBe('UNVERIFIED_HISTORICAL_NOTE')
    expect(LOST_HISTORICAL_SCENARIOS.r1ModeledMinutes.executableOracle).toBe(false)
    const oracle = loadScenarioQaOracle(ROOT)
    expect(oracle.executableOracle).toBe('F1-F18')
    expect(oracle.lostHistoricalOracle).toBe('R1-R8')
    expect(oracle.records).not.toHaveProperty('R1')
    expect(JSON.stringify(oracle.records)).not.toMatch(/116\.1/)
    expect(Object.keys(oracle.records)).toEqual(ROUTE_LAB_FIXTURES.map((f) => f.id))
  })

  it('later-gate modules are not imported by identity / inspection adapters', () => {
    const files = [
      'src/dev/route-lab/scenarioIdentity.ts',
      'src/dev/route-lab/lostHistoricalScenarios.ts',
      'src/dev/route-lab/founderInspection.ts',
    ]
    for (const rel of files) {
      const src = readFileSync(resolve(ROOT, rel), 'utf8')
      for (const token of CONTAMINATED) {
        expect(src).not.toMatch(new RegExp(token))
      }
      expect(src).not.toMatch(/src\/engine\/vnext/)
    }
  })
})

describe('Gate 2E.3.1-R F1–F18 frozen oracle + Founder Inspection', () => {
  const live: Record<string, { qa: ScenarioQaRecord; viewFingerprint: string }> = {}

  beforeAll(() => {
    for (const fx of ROUTE_LAB_FIXTURES) {
      const lab = runRouteLabFixture(fx.id, ROOT)
      const { arbitration } = runChoicePolicyV02(fx.input, { root: ROOT })
      const qa = buildScenarioQaRecord({ fixture: fx, lab, arbitration })
      const view = buildFounderInspection({ lab, arbitration, root: ROOT })
      live[fx.id] = { qa, viewFingerprint: view.scenarioIdentity.scenarioFingerprint.value ?? '' }
    }
  }, 120000)

  it('F. F1–F18 current outputs reproduce their frozen oracle', () => {
    const oracle = loadScenarioQaOracle(ROOT)
    const mismatches: string[] = []
    for (const fx of ROUTE_LAB_FIXTURES) {
      const cmp = compareToFrozenOracle(live[fx.id]!.qa, oracle.records[fx.id]!)
      if (cmp.frozenOracleMatch !== 'PASS') mismatches.push(`${fx.id}:${cmp.scenarioDrift}/${cmp.routeDrift}`)
    }
    expect(mismatches).toEqual([])
  })

  it('H. Founder Inspection displays the same scenarioFingerprint used by QA', () => {
    for (const fx of ROUTE_LAB_FIXTURES) {
      expect(live[fx.id]!.viewFingerprint).toBe(live[fx.id]!.qa.scenarioFingerprint)
      expect(live[fx.id]!.viewFingerprint).toBe(loadScenarioQaOracle(ROOT).records[fx.id]!.scenarioFingerprint)
    }
  })

  it('F2 vs F18: distinct scenario identity, same engine requestHash', () => {
    expect(live.F2!.qa.requestHash).toBe(live.F18!.qa.requestHash)
    expect(live.F2!.qa.scenarioFingerprint).not.toBe(live.F18!.qa.scenarioFingerprint)
    expect(live.F2!.qa.routeFingerprintV01).toBe(live.F18!.qa.routeFingerprintV01)
  })

  it('existing engine fingerprints are unchanged vs 2E.3-R parent freeze', () => {
    const d2 = gate2dRegressionFingerprint(ROOT)
    const d2base = loadGate2dFingerprintArtifact(ROOT)
    expect(d2).toEqual(d2base)
    const full = gate2e1EngineOutputFingerprint(ROOT)
    const fullBase = loadGate2e1FingerprintBaseline(ROOT)
    expect(full).toEqual(fullBase)
  })

  it('Founder Inspection UI surfaces scenario identity + reproducibility', () => {
    const ui = readFileSync(resolve(ROOT, 'src/dev/route-lab/static/route-lab-ui.js'), 'utf8')
    expect(ui).toContain('Scenario identity')
    expect(ui).toContain('scenarioFingerprint')
    expect(ui).toContain('Frozen oracle match')
    expect(ui).toContain('Scenario drift')
    const f2 = buildFounderInspection({
      lab: runRouteLabFixture('F2', ROOT),
      arbitration: runChoicePolicyV02(getRouteLabFixture('F2')!.input, { root: ROOT }).arbitration,
      root: ROOT,
    })
    expect(f2.reproducibility.frozenOracleMatch.value).toBe('PASS')
    expect(f2.reproducibility.scenarioDrift.value).toBe('NO')
    expect(f2.request.familiarity.availability).toBe('NOT_MODELED')
  })
})
