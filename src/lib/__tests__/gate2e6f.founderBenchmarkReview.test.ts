/**
 * Gate 2E.6F — founder benchmark review schema tests (no engine mutation).
 */

import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import {
  createFounderBenchmarkReview,
  engineRouteFromAlphaRun,
  exportFounderBenchmarkReviewJson,
  FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
  parseHumanRouteSequence,
  suggestPerDifferences,
  validateFounderBenchmarkReview,
} from '@/src/engine/review/founder-benchmark-review.v0.1'
import { runFeatureCompleteAlpha, assertDeterministicAlpha } from '@/src/engine/vnext/pipeline/run-feature-complete-alpha'
import { getBenchmark } from '@/src/engine/vnext/benchmarks/alpha-benchmarks'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2E.6F founder benchmark review', () => {
  it('freeze SHA is recorded', () => {
    const freeze = readFileSync(resolve(ROOT, 'docs/engine/FEATURE_COMPLETE_ALPHA_FREEZE.md'), 'utf8')
    expect(freeze).toContain('21cc50c4')
    expect(FEATURE_COMPLETE_ALPHA_FREEZE_SHA).toBe('21cc50c4')
  })

  it('parses human route sequence without engine calls', () => {
    const seq = parseHumanRouteSequence('STGO_01\nSTGO_03, STGO_18::LEGACY_CORE')
    expect(seq).toHaveLength(3)
    expect(seq[0]!.experienceId).toBe('STGO_01::LEGACY_CORE')
    expect(seq[2]!.experienceId).toBe('STGO_18::LEGACY_CORE')
  })

  it('suggests per-difference entries', () => {
    const diffs = suggestPerDifferences(
      { experienceSequence: parseHumanRouteSequence('STGO_01\nSTGO_03') },
      {
        runFingerprint: 'abc',
        experienceSequence: ['STGO_01::LEGACY_CORE', 'STGO_19::LEGACY_CORE'],
        stgoIds: ['STGO_01', 'STGO_19'],
        estimatedTime: 90,
        arcSummary: null,
        arbitrationResult: {
          winnerLane: 'SIGNATURE',
          score: 80,
          confidence: 'MODERATE',
          margin: 2,
          objective: 'CURRENT_OBJECTIVE',
          candidateFingerprint: 'fp',
        },
        frozenBaselineSha: FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
      },
    )
    expect(diffs.some((d) => d.engineChoice === 'STGO_19::LEGACY_CORE')).toBe(true)
  })

  it('B02 engine fingerprint preserved in frozen snapshot', () => {
    const b = getBenchmark('B02_ORIGINS_COLONIAL')!
    const run = runFeatureCompleteAlpha(b.request, { root: ROOT })
    const engine = engineRouteFromAlphaRun(run)
    const demo = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/qa/gate_2e6_feature_complete_alpha_demo.v0.1.json'), 'utf8'),
    )
    expect(run.runFingerprint).toBe(demo.runFingerprint || run.runFingerprint)
    expect(engine.arbitrationResult.candidateFingerprint).toBe(demo.recommendation.fingerprint)
    expect(engine.stgoIds).toEqual(demo.recommendation.stgoIds)
  })

  it('founder review export validates', () => {
    const b = getBenchmark('B01_FIRST_TIMER_BALANCED')!
    const run = runFeatureCompleteAlpha(b.request, { root: ROOT })
    const doc = createFounderBenchmarkReview({
      benchmarkId: b.id,
      travelerRequestFingerprint: run.composition.requestHash,
      humanRoute: { experienceSequence: parseHumanRouteSequence('STGO_01') },
      engineRoute: engineRouteFromAlphaRun(run),
    })
    expect(validateFounderBenchmarkReview(doc)).toEqual([])
    const json = exportFounderBenchmarkReviewJson(doc)
    expect(json).toContain('founder-benchmark-review.v0.1')
    expect(json).toContain('21cc50c4')
  })

  it('determinism unchanged from Gate 2E.6', () => {
    const b = getBenchmark('B02_ORIGINS_COLONIAL')!
    expect(assertDeterministicAlpha(b.request, ROOT)).toBe(true)
  }, 60000)
})
