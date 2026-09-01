/**
 * Gate 2E.2E.1-R — reconstructed arbitration-correctness tests.
 * Not the original 29270b67 object. Does not assert Discovery win quotas.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getRouteLabFixture } from '@/src/dev/route-lab/fixtures'
import { TRAVELER_FIXTURES, F8_D1_FLANEUR_TRAVELER } from '@/src/engine/fixtures/travelerFixtures'
import { blendKnown } from '@/src/engine/routes/v0.2/coverage-blend'
import { ROUTE_CHOICE_WEIGHTS } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { computeRouteChoiceScore } from '@/src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2'
import { runChoicePolicyV02 } from '@/src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import type { CommonRouteFeatures } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

const ROOT = resolve(__dirname, '../../..')

function emptyFeatures(
  overrides: Partial<Record<keyof CommonRouteFeatures, number | null>> = {},
): CommonRouteFeatures {
  const pick = (key: keyof CommonRouteFeatures, fallback: number): number | null =>
    Object.prototype.hasOwnProperty.call(overrides, key) ? (overrides[key] as number | null) : fallback
  const mk = (v: number | null) => ({
    value: v,
    coverage: v == null ? 0 : 1,
    unknown: v == null,
    breakdown: {},
  })
  return {
    travelerMatchRoute: mk(pick('travelerMatchRoute', 70)),
    intrinsicWorthRoute: mk(pick('intrinsicWorthRoute', 70)),
    routeMarginalValue: mk(pick('routeMarginalValue', 70)),
    arcQuality: mk(pick('arcQuality', 70)),
    physicalEfficiency: mk(pick('physicalEfficiency', 70)),
    timeFit: mk(pick('timeFit', 70)),
    structuralFit: mk(pick('structuralFit', 70)),
    discoveryFit: mk(pick('discoveryFit', 70)),
    narrativeCoherence: mk(pick('narrativeCoherence', 70)),
    routeCoverageConfidence: 1,
    lanePrior: mk(pick('lanePrior', 70)),
  }
}

describe('Gate 2E.2E.1-R reconstructed arbitration correctness', () => {
  it('F8 executable fixture is D1; F_discovery_forward remains D2', () => {
    const f8 = getRouteLabFixture('F8')
    expect(f8).toBeTruthy()
    const traveler = f8!.input.traveler as { discoveryPosture: string }
    expect(traveler.discoveryPosture).toBe('D1')
    expect(F8_D1_FLANEUR_TRAVELER.discoveryPosture).toBe('D1')
    expect(TRAVELER_FIXTURES.F_discovery_forward.discoveryPosture).toBe('D2')
    expect(F8_D1_FLANEUR_TRAVELER.interests).toEqual(TRAVELER_FIXTURES.F_discovery_forward.interests)
    expect(F8_D1_FLANEUR_TRAVELER.rhythm).toBe(TRAVELER_FIXTURES.F_discovery_forward.rhythm)
    expect(F8_D1_FLANEUR_TRAVELER.timeBudgetMinutes).toBe(TRAVELER_FIXTURES.F_discovery_forward.timeBudgetMinutes)
    expect(F8_D1_FLANEUR_TRAVELER.mobilityArchetype).toBe(TRAVELER_FIXTURES.F_discovery_forward.mobilityArchetype)
  })

  it('ComposerScore is not used directly for cross-lane arbitration', () => {
    expect(ROUTE_CHOICE_WEIGHTS).not.toHaveProperty('composerScore')
    const scored = computeRouteChoiceScore(emptyFeatures())
    expect(scored.usedComposerScore).toBe(false)
    const arbitratorSrc = readFileSync(
      resolve(ROOT, 'src/engine/routes/v0.2/arbitration/route-arbitrator.v0.2.ts'),
      'utf8',
    )
    expect(arbitratorSrc).toMatch(/usedComposerScore:\s*false/)
    expect(arbitratorSrc).not.toMatch(/features\.composerScore/)
    expect(arbitratorSrc).toMatch(/ComposerScore is excluded/)
  })

  it('lane-neutral DiscoveryFit / PhysicalEfficiency methodology is intact', () => {
    const featuresSrc = readFileSync(
      resolve(ROOT, 'src/engine/routes/v0.2/arbitration/route-common-features.v0.2.ts'),
      'utf8',
    )
    expect(featuresSrc).not.toMatch(/originatingLane === 'DISCOVERY'/)
    expect(featuresSrc).not.toMatch(/originatingLane === 'FLOW'/)
    expect(featuresSrc).not.toMatch(/originatingLane === 'SIGNATURE'/)
    expect(ROUTE_CHOICE_WEIGHTS).not.toHaveProperty('composerScore')
  })

  it('F15 remains constraint-dominated with no fake alternatives', () => {
    const run = runChoicePolicyV02(getRouteLabFixture('F15')!.input, { root: ROOT })
    expect(run.arbitration.alternatives).toHaveLength(0)
    expect(run.arbitration.noMeaningfulAlternative).toBe(true)
    expect(run.arbitration.choiceConfidence).toBe('CONSTRAINT_DOMINATED')
  })

  it('UNKNOWN continues to renormalize rather than score as zero', () => {
    const unknown = blendKnown([
      { key: 'a', value: 80, weight: 0.5 },
      { key: 'b', value: null, weight: 0.5 },
    ])
    expect(unknown.score).toBe(80)
    expect(unknown.renormalized).toBe(true)
    expect(unknown.unknownKeys).toEqual(['b'])
    expect(unknown.score).not.toBe(80 * 0.5 + 0 * 0.5)
  })
})
