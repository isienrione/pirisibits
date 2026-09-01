import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  EDITORIAL_CALIBRATION_CURATOR_APPROVED,
} from '@/src/lib/city-graph/flags'
import {
  gate2dRegressionFingerprint,
  gate2e1EngineOutputFingerprint,
  loadGate2dFingerprintArtifact,
  loadGate2e1FingerprintBaseline,
} from '@/src/dev/route-lab/runRouteLab'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2E.1M scoring & composition V0.2 contract (docs only)', () => {
  const contract = resolve(ROOT, 'docs/engine/ENGINE_SCORING_AND_COMPOSITION_V0_2.md')
  const index = resolve(ROOT, 'docs/engine/README.md')
  const adr = resolve(
    ROOT,
    'docs/engine/decisions/ADR-001-separate-static-traveler-and-marginal-route-value.md',
  )

  it('canonical V0.2 contract document exists with required sections', () => {
    expect(existsSync(contract)).toBe(true)
    const text = readFileSync(contract, 'utf8')
    expect(text).toContain('NOT YET IMPLEMENTED')
    expect(text).toContain('IntrinsicWorthRaw')
    expect(text).toContain('0.35 × heritageDepth')
    expect(text).toContain('TravelerMatch')
    expect(text).toContain('MarginalRouteValue')
    expect(text).toContain('TransitionValue')
    expect(text).toContain('NextStopValue')
    expect(text).toContain('SIGNATURE')
    expect(text).toContain('DISCOVERY')
    expect(text).toContain('FLOW')
    expect(text).toContain('INITIAL V0.2 HYPOTHESIS')
    expect(text).toContain('PROVISIONAL V0.1 VALUE — NOT FROZEN FOR V0.2')
    expect(text).toContain('UNKNOWN ≠ 0')
    expect(text).toContain('scoringModelVersion')
  })

  it('docs index links V0.2 contract as forward-looking canonical design', () => {
    expect(existsSync(index)).toBe(true)
    const text = readFileSync(index, 'utf8')
    expect(text).toContain('ENGINE_SCORING_AND_COMPOSITION_V0_2.md')
    expect(text).toContain('NOT IMPLEMENTED')
    expect(text).toContain('ENGINE_V0_1_IMPLEMENTATION_CONTRACT')
  })

  it('ADR-001 records separate static, traveler, and marginal value decision', () => {
    expect(existsSync(adr)).toBe(true)
    const text = readFileSync(adr, 'utf8')
    expect(text).toContain('ACCEPTED FOR V0.2 DESIGN')
    expect(text).toContain('NOT YET IMPLEMENTED')
    expect(text).toContain('MarginalRouteValue')
  })

  it('no V0.2 runtime scoring config files were created', () => {
    expect(existsSync(resolve(ROOT, 'src/engine/scoring/scoring-config.v0.2.ts'))).toBe(false)
    expect(existsSync(resolve(ROOT, 'src/engine/routes/lane-config.v0.2.ts'))).toBe(false)
  })

  it('production routing remains disabled', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(EDITORIAL_CALIBRATION_CURATOR_APPROVED).toBe(false)
  })

  it('F1–F18 engine outputs unchanged (Gate 2D + full fingerprint)', () => {
    const d2 = gate2dRegressionFingerprint(ROOT)
    const d2base = loadGate2dFingerprintArtifact(ROOT)
    expect(d2).toEqual(d2base)

    const full = gate2e1EngineOutputFingerprint(ROOT)
    const fullBase = loadGate2e1FingerprintBaseline(ROOT)
    expect(full).toEqual(fullBase)
  })
})
