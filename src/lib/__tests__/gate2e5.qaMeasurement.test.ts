/**
 * Gate 2E.5-QA — tests for measurement scaffolds, EMT guardrails, provenance, PE/Arc Vnext.
 * Does not change frozen runtime scoring.
 */

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION,
  PHYSICAL_EFFICIENCY_VNEXT_PRODUCTION,
  ARC_QUALITY_VNEXT_PRODUCTION,
  PLACE_EXPERIENCE_SCHEMA_V0_1_PRODUCTION,
  PHYSICAL_ROUTE_GENERATION_ENABLED,
  ROUTE_ARBITRATION_V0_2_PRODUCTION,
  ROUTE_COMPOSER_V0_2_PRODUCTION,
  ARCQUALITY_V0_2_PRODUCTION,
  GATE_2E5_QA_MEASUREMENT_READY,
} from '@/src/lib/city-graph/flags'
import { computePhysicalEfficiencyVnext } from '@/src/engine/scoring/v0.2/physical-efficiency-vnext'
import { computeArcQualityVnextFromExisting, ARC_QUALITY_VNEXT_PARALLEL } from '@/src/engine/routes/v0.2/arc-quality/vnext'
import {
  computeEmtMovementWithGuardrails,
  recomputeRouteTimeFromSequence,
  EMT_MOVEMENT_EPSILON,
} from '@/src/engine/routes/experience-time/vnext/emt-guardrails'
import {
  experiencesViolateMutualExclusion,
  computeTwoChannelElapsed,
  WALKING_NARRATION_CAPACITY_POLICY,
  BUDGET_PROGRESSION_CONTRACT_V01,
  type ExperienceRecordV01,
} from '@/src/engine/routes/experience-time/vnext/place-experience-schema'
import {
  coordinatesRoutable,
  m2StepFreeFailClosed,
} from '@/src/engine/routes/experience-time/vnext/per-field-provenance'
import { POSTURE_TOUCHPOINT_COUNT } from '@/src/engine/qa/gate-2e5/posture-touchpoints'
import { ROUTE_CHOICE_WEIGHTS } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import { LANE_OBJECTIVE_WEIGHTS } from '@/src/engine/routes/v0.2/composer/composer-config.v0.2'
import { ARC_QUALITY_POSITIVE_WEIGHTS } from '@/src/engine/routes/arc-quality-config'
import type { ArcQualityResult } from '@/src/engine/routes/arc-quality'

const ROOT = resolve(__dirname, '../../..')

describe('Gate 2E.5-QA measurement & invariants', () => {
  it('production cutover flags remain false', () => {
    expect(PHYSICAL_ROUTE_GENERATION_ENABLED).toBe(false)
    expect(ROUTE_ARBITRATION_V0_2_PRODUCTION).toBe(false)
    expect(ROUTE_COMPOSER_V0_2_PRODUCTION).toBe(false)
    expect(ARCQUALITY_V0_2_PRODUCTION).toBe(false)
    expect(EXPERIENCE_TIME_MODEL_V0_1_PRODUCTION).toBe(false)
    expect(PHYSICAL_EFFICIENCY_VNEXT_PRODUCTION).toBe(false)
    expect(ARC_QUALITY_VNEXT_PRODUCTION).toBe(false)
    expect(PLACE_EXPERIENCE_SCHEMA_V0_1_PRODUCTION).toBe(false)
    expect(GATE_2E5_QA_MEASUREMENT_READY).toBe(true)
  })

  it('PhysicalEfficiency Vnext is bounded [0,100] and worsens with longer transitions', () => {
    const easy = computePhysicalEfficiencyVnext({
      dwellMin: 60,
      totalEstimatedMin: 100,
      transitionTimesMin: [5, 6],
      maxWalkChunkMin: 35,
      backtrackingPenalty01: 0,
      geographicProgression01Mean: 0.8,
      metroTransferCount: 0,
    })
    const hard = computePhysicalEfficiencyVnext({
      dwellMin: 60,
      totalEstimatedMin: 100,
      transitionTimesMin: [30, 34],
      maxWalkChunkMin: 35,
      backtrackingPenalty01: 0.5,
      geographicProgression01Mean: 0.2,
      metroTransferCount: 3,
    })
    expect(easy.score).toBeGreaterThanOrEqual(0)
    expect(easy.score).toBeLessThanOrEqual(100)
    expect(hard.score).toBeGreaterThanOrEqual(0)
    expect(hard.score).toBeLessThanOrEqual(100)
    expect(hard.score).toBeLessThan(easy.score)
    expect(easy.bounded).toBe(true)
  })

  it('ArcQuality Vnext removes timeUtilization weight (parallel only)', () => {
    expect(ARC_QUALITY_VNEXT_PARALLEL).toBe(true)
    const fake = {
      components: Object.fromEntries(
        Object.keys(ARC_QUALITY_POSITIVE_WEIGHTS).map((k) => [k, 0.5]),
      ),
      penalties: {
        repetitionPenalty: 0,
        unresolvedSetupPenalty: 0,
        structuralMonotonyPenalty: 0,
        themeMonotonyPenalty: 0,
        relationMonotonyPenalty: 0,
        weakEndingPenalty: 0,
        overstuffingPenalty: 0,
        underutilizedBudgetPenalty: 0,
        backtrackingPenalty: 0,
      },
      rawScore: 0.5,
      normalizedScore: 50,
    } as unknown as ArcQualityResult
    const vnext = computeArcQualityVnextFromExisting(fake)
    expect(vnext.timeUtilizationRemoved).toBe(true)
    expect(vnext.status).toBe('PARALLEL_ONLY_NOT_IN_RUNTIME')
  })

  it('EMT guardrails: same-snapshot required; negative EMT is DATA_INTEGRITY_ERROR', () => {
    const snap = {
      routingSnapshotId: 'snap-1',
      modeAssumptions: 'WALK',
      travelerPhysicalCoefficientsVersion: 'v1',
      evidenceVersion: 'e1',
    }
    const ok = computeEmtMovementWithGuardrails(
      { movementAX: 5, movementXB: 6, movementAB: 8, ...snap },
      snap,
    )
    expect(ok.ok).toBe(true)
    expect(ok.emtMovement).toBe(3)

    const badSnap = computeEmtMovementWithGuardrails(
      { movementAX: 5, movementXB: 6, movementAB: 8, ...snap, routingSnapshotId: 'other' },
      snap,
    )
    expect(badSnap.ok).toBe(false)
    expect(badSnap.errors.some((e) => e.includes('DATA_INTEGRITY_ERROR'))).toBe(true)

    const neg = computeEmtMovementWithGuardrails(
      { movementAX: 1, movementXB: 1, movementAB: 10, ...snap },
      snap,
    )
    expect(neg.emtMovement).toBeLessThan(-EMT_MOVEMENT_EPSILON)
    expect(neg.ok).toBe(false)
  })

  it('final route time recomputed from sequence — not cached EMT sum', () => {
    expect(
      recomputeRouteTimeFromSequence({
        movementLegsMin: [5, 7],
        stationaryDwellsMin: [10, 12],
        accessOverheadsMin: [1],
      }),
    ).toBe(35)
  })

  it('mutual exclusion: two experiences same place fail unless override', () => {
    const a: ExperienceRecordV01 = {
      experienceId: 'e1',
      placeId: 'p1',
      corridorRef: null,
      visitMode: 'EXTERIOR_CORE',
      stopRole: 'REQUIRED_STOP',
      parentExperienceId: null,
      mutuallyExclusiveGroupId: null,
      compatibilityOverride: false,
      openingConstraintsRef: null,
      ticketConstraintsRef: null,
      narrativeIdentity: null,
      provenance: 'UNKNOWN',
      contentTimeProfile: {
        authoredContentMin: null,
        walkCompatibleContentMin: null,
        requiredStopMin: null,
        stationaryDwellMin: null,
        accessOverheadMin: null,
        contentMayOverlapMovement: null,
      },
    }
    const b = { ...a, experienceId: 'e2', visitMode: 'INTERIOR_CORE' as const }
    expect(experiencesViolateMutualExclusion([a, b]).ok).toBe(false)
    expect(
      experiencesViolateMutualExclusion([{ ...b, compatibilityOverride: true }, a]).ok,
    ).toBe(true)
  })

  it('two-channel elapsed ignores authored content; walking capacity UNKNOWN', () => {
    expect(WALKING_NARRATION_CAPACITY_POLICY).toBe('UNKNOWN')
    expect(BUDGET_PROGRESSION_CONTRACT_V01.thresholdsAssigned).toBe(false)
    expect(
      computeTwoChannelElapsed({
        movementMin: 20,
        stationaryDwellMin: 15,
        accessOverheadMin: 2,
      }).elapsedMin,
    ).toBe(37)
  })

  it('provenance: AI_PROPOSED_UNVERIFIED coordinates not routable; M2 fail-closed', () => {
    expect(coordinatesRoutable('AI_PROPOSED_UNVERIFIED')).toBe(false)
    expect(coordinatesRoutable('CURATOR_APPROVED')).toBe(true)
    expect(
      m2StepFreeFailClosed({
        stepFreeRequired: true,
        accessibilityProvenance: 'UNKNOWN',
        stepFreeKnown: null,
      }).pass,
    ).toBe(false)
  })

  it('posture touchpoint inventory is non-empty and frozen weights unchanged', () => {
    expect(POSTURE_TOUCHPOINT_COUNT).toBeGreaterThanOrEqual(10)
    expect(ROUTE_CHOICE_WEIGHTS.lanePrior).toBe(0.05)
    expect(ROUTE_CHOICE_WEIGHTS.travelerMatchRoute).toBe(0.3)
    expect(LANE_OBJECTIVE_WEIGHTS.DISCOVERY.marginalRouteValue).toBe(0.35)
  })

  it('geometry integrity: Launch30 runtime coords are finite WGS84; no STGO_105 coords', () => {
    const engine = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    )
    const launch = engine.nodes.filter((n: { launchCorpus: boolean }) => n.launchCorpus)
    expect(launch).toHaveLength(30)
    const deltas: number[] = []
    let prev: { lat: number; lng: number } | null = null
    for (const n of launch) {
      if (n.stgoId === 'STGO_104') {
        // may be pending but founder-supplied coords exist
      }
      const c = n.poiCoordinate
      if (!c) continue
      expect(c.lat).toBeGreaterThan(-90)
      expect(c.lat).toBeLessThan(90)
      expect(c.lng).toBeGreaterThan(-180)
      expect(c.lng).toBeLessThan(180)
      // Santiago service region rough bbox
      expect(c.lat).toBeGreaterThan(-34.5)
      expect(c.lat).toBeLessThan(-32.5)
      expect(c.lng).toBeGreaterThan(-71.5)
      expect(c.lng).toBeLessThan(-69.5)
      if (prev) {
        deltas.push(Math.round((c.lat - prev.lat) * 1e7) / 1e7)
      }
      prev = c
    }
    const n105 = engine.nodes.find((n: { stgoId: string }) => n.stgoId === 'STGO_105')
    expect(n105.poiCoordinate).toBeNull()
    // Suspicious repeated identical delta pattern across many consecutive launch nodes
    const repeated = deltas.filter((d, i) => i > 0 && d === deltas[i - 1] && d !== 0).length
    expect(repeated).toBeLessThan(5)
  })

  it('duplicate coordinate check among Launch30 experience points', () => {
    const engine = JSON.parse(
      readFileSync(resolve(ROOT, 'src/data/santiago/santiago_engine_nodes.v0.1.json'), 'utf8'),
    )
    const keys = new Map<string, string[]>()
    for (const n of engine.nodes.filter((x: { launchCorpus: boolean }) => x.launchCorpus)) {
      const c = n.experiencePointCoordinate ?? n.poiCoordinate
      if (!c) continue
      const k = `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`
      const arr = keys.get(k) ?? []
      arr.push(n.stgoId)
      keys.set(k, arr)
    }
    const dups = [...keys.values()].filter((ids) => ids.length > 1)
    // Allow reporting but fail if many identical grid points
    expect(dups.length).toBeLessThan(3)
  })
})
