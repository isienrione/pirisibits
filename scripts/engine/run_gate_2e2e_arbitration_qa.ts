#!/usr/bin/env npx tsx
/**
 * Gate 2E.2E — emit arbitration QA summary for the gate report (not production).
 */

import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { ROUTE_LAB_FIXTURES } from '../../src/dev/route-lab/fixtures'
import { runChoicePolicyV02 } from '../../src/engine/routes/v0.2/arbitration/run-choice-policy.v0.2'
import { normalizeTraveler } from '../../src/engine/traveler'
import {
  summarizeComposerScoresByLane,
  summarizeFeatureByLane,
  composerScalesComparable,
} from '../../src/engine/routes/v0.2/arbitration/score-distribution-audit.v0.2'
import type { CommonRouteFeatures } from '../../src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import type { ComposerLane } from '../../src/engine/routes/v0.2/composer/composer-types.v0.2'

const ROOT = resolve(__dirname, '../..')

function slim(run: ReturnType<typeof runChoicePolicyV02>, id: string) {
  return {
    id,
    recommendedLane: run.arbitration.recommendedLane,
    recommendedRouteId: run.arbitration.recommendedRouteId,
    confidence: run.arbitration.choiceConfidence,
    margin: run.arbitration.choiceMargin,
    whyWon: run.arbitration.whyWon,
    whyOthersLost: run.arbitration.whyOthersLost,
    alternatives: run.arbitration.alternatives.map((a) => ({
      lane: a.originatingLane,
      label: a.userFacingLabel,
      choice: a.routeChoiceScore,
    })),
    constraintDominated: run.arbitration.constraintDominated,
    b0Winner: run.arbitration.legacyBlends.B0.winnerLane,
    b1Winner: run.arbitration.legacyBlends.B1.winnerLane,
    candidates: run.arbitration.allCandidates.map((c) => ({
      lane: c.originatingLane,
      stops: c.candidate.candidate.orderedStops.map((s) => s.stgoId),
      composerScore: c.candidate.composerScore,
      choice: c.routeChoiceScore,
      coverage: c.routeChoiceCoverage,
      travelerMatchRoute: c.features.travelerMatchRoute.value,
      arcQuality: c.features.arcQuality.value,
      routeMarginalValue: c.features.routeMarginalValue.value,
      physicalEfficiency: c.features.physicalEfficiency.value,
      structuralFit: c.features.structuralFit.value,
      discoveryFit: c.features.discoveryFit.value,
      timeFit: c.features.timeFit.value,
      lanePrior: c.features.lanePrior.value,
      character: c.character,
      label: c.userFacingLabel,
    })),
  }
}

function main() {
  const composerRows: Array<{ lane: ComposerLane; composerScore: number }> = []
  const featureRows: Array<{ lane: ComposerLane; features: CommonRouteFeatures }> = []
  const winners: Record<string, string> = {}
  const b0: Record<string, string | null> = {}
  const watch: Record<string, ReturnType<typeof slim>> = {}
  const all: Record<string, ReturnType<typeof slim>> = {}

  for (const fx of ROUTE_LAB_FIXTURES) {
    const run = runChoicePolicyV02(fx.input, { root: ROOT })
    const row = slim(run, fx.id)
    all[fx.id] = row
    winners[fx.id] = String(run.arbitration.recommendedLane)
    b0[fx.id] = run.arbitration.legacyBlends.B0.winnerLane
    if (['F1', 'F2', 'F6', 'F8', 'F9', 'F15'].includes(fx.id)) watch[fx.id] = row
    for (const c of run.arbitration.allCandidates) {
      if (c.originatingLane === 'H1') continue
      composerRows.push({ lane: c.originatingLane, composerScore: c.candidate.composerScore })
      featureRows.push({ lane: c.originatingLane, features: c.features })
    }
  }

  const profiles = {
    BALANCED: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['historia_civica'], rhythm: 'equilibrado' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' },
      { root: ROOT },
    ),
    T1A: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['historia_civica', 'arq_monumental'], rhythm: 'estructurado' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T1A'] },
      { root: ROOT },
    ),
    T2: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['gastronomia'], rhythm: 'espontaneo' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T2'] },
      { root: ROOT },
    ),
    T3: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['arq_monumental', 'arte_visual'], rhythm: 'equilibrado' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T3'] },
      { root: ROOT },
    ),
    D1: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['barrios_vivos', 'arte_visual'], discoveryPosture: 'D1', rhythm: 'espontaneo' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' },
      { root: ROOT },
    ),
    D2: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['arquitectura', 'memoria_ddhh'], discoveryPosture: 'D2', rhythm: 'espontaneo', memorySitesOptIn: true }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' },
      { root: ROOT },
    ),
    D3: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['historia_civica', 'arq_monumental'], discoveryPosture: 'D3', rhythm: 'estructurado' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' },
      { root: ROOT },
    ),
    M1: runChoicePolicyV02(
      { traveler: normalizeTraveler({ interests: ['historia_civica'], expressPreference: true, mobilityArchetype: 'M1', rhythm: 'estructurado' }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' },
      { root: ROOT },
    ),
  }

  const dist = summarizeComposerScoresByLane(composerRows)
  const featureAverages = {
    travelerMatchRoute: summarizeFeatureByLane(featureRows, 'travelerMatchRoute'),
    arcQuality: summarizeFeatureByLane(featureRows, 'arcQuality'),
    routeMarginalValue: summarizeFeatureByLane(featureRows, 'routeMarginalValue'),
    physicalEfficiency: summarizeFeatureByLane(featureRows, 'physicalEfficiency'),
    structuralFit: summarizeFeatureByLane(featureRows, 'structuralFit'),
    discoveryFit: summarizeFeatureByLane(featureRows, 'discoveryFit'),
    timeFit: summarizeFeatureByLane(featureRows, 'timeFit'),
    lanePrior: summarizeFeatureByLane(featureRows, 'lanePrior'),
  }
  const profileSummary = Object.fromEntries(
    Object.entries(profiles).map(([k, run]) => [
      k,
      {
        lane: run.arbitration.recommendedLane,
        discoveryFit: run.arbitration.recommended?.features.discoveryFit.value ?? null,
        essentiality: run.arbitration.recommended?.character.essentiality ?? null,
        physical: run.arbitration.recommended?.features.physicalEfficiency.value ?? null,
        travelerMatch: run.arbitration.recommended?.features.travelerMatchRoute.value ?? null,
        choice: run.arbitration.recommended?.routeChoiceScore ?? null,
      },
    ]),
  )

  const out = {
    composerDist: dist,
    featureAverages,
    comparability: composerScalesComparable(dist),
    recommendedLaneDistribution: Object.values(winners).reduce((acc, v) => {
      acc[v] = (acc[v] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    b0LaneDistribution: Object.values(b0).reduce((acc, v) => {
      const key = String(v)
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    winners,
    b0,
    watch,
    profileSummary,
  }
  const dest = resolve(ROOT, 'docs/engine/gate-2e-2e-arbitration-qa.json')
  writeFileSync(dest, JSON.stringify(out, null, 2))
  console.log(dest)
  console.log(JSON.stringify({ recommendedLaneDistribution: out.recommendedLaneDistribution, b0LaneDistribution: out.b0LaneDistribution, comparability: out.comparability, composerDist: out.composerDist, featureAverages: out.featureAverages, profileSummary: out.profileSummary }, null, 2))
}

main()
