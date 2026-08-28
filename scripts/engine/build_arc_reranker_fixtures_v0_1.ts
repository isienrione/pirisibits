#!/usr/bin/env npx tsx
/**
 * Gate 2D — emit arc reranker fixture matrix (F1–F18 composer vs reranked).
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { composeAndRerankProvisionalRoutes } from '../../src/engine/routes/route-reranker'
import { TRAVELER_FIXTURES } from '../../src/engine/fixtures/travelerFixtures'
import { normalizeTraveler } from '../../src/engine/traveler'
import type { RouteRequestInput } from '../../src/engine/routes/route-request'

const ROOT = resolve(__dirname, '../..')
const OUT = resolve(ROOT, 'src/data/santiago/routes/arc-reranker-fixtures.v0.1.json')

type FixtureDef = { id: string; label: string; input: RouteRequestInput }

const fixtures: FixtureDef[] = [
  { id: 'F1', label: '60 min WALK_ONLY balanced', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 60, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F2', label: '120 min WALK_ONLY balanced', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F3', label: '180 min WALK_ONLY balanced', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 180, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F4', label: '120 min WALK_METRO', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_METRO', routeIntent: 'BALANCED' } },
  { id: 'F5', label: '120 min strong T1A', input: { traveler: TRAVELER_FIXTURES.B_civic_history, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T1A'] } },
  { id: 'F6', label: '120 min strong T2 culinary', input: { traveler: TRAVELER_FIXTURES.C_food_street_life, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T2'] } },
  { id: 'F7', label: '120 min strong T3 aesthetics', input: { traveler: TRAVELER_FIXTURES.D_architecture_aesthetics, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T3'] } },
  { id: 'F8', label: '120 min D1 Flâneur', input: { traveler: TRAVELER_FIXTURES.F_discovery_forward, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' } },
  { id: 'F9', label: '120 min D2 Detective', input: { traveler: normalizeTraveler({ interests: ['arquitectura', 'memoria_ddhh'], discoveryPosture: 'D2', rhythm: 'espontaneo', memorySitesOptIn: true }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' } },
  { id: 'F10', label: '120 min M1 Express', input: { traveler: TRAVELER_FIXTURES.G_express_time_boxed, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' } },
  { id: 'F11', label: 'stepFreeRequired', input: { traveler: TRAVELER_FIXTURES.H_accessibility_sensitive, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', stepFreeRequired: true } },
  { id: 'F12', label: 'memorySitesOptIn=false', input: { traveler: TRAVELER_FIXTURES.B_civic_history, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', memorySitesOptIn: false } },
  { id: 'F13', label: 'memorySitesOptIn=true', input: { traveler: TRAVELER_FIXTURES.E_memory_human_rights, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', memorySitesOptIn: true, preferredThemes: ['T1B'] } },
  { id: 'F14', label: 'highComfort', input: { traveler: TRAVELER_FIXTURES.I_high_comfort, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', highComfort: true } },
  { id: 'F15', label: 'tight time budget', input: { traveler: TRAVELER_FIXTURES.G_express_time_boxed, startingStgoId: 'STGO_01', timeBudgetMin: 45, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' } },
  { id: 'F16', label: 'start near STGO_33 physically supported (STGO_01 hub; 33 not start)', input: { traveler: TRAVELER_FIXTURES.D_architecture_aesthetics, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F17', label: 'STGO_104 excluded physical pending', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F18', label: 'deterministic repeat of F2', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
]

function topPositiveFactor(arc: { components: Record<string, number> }): string {
  const [k, v] = Object.entries(arc.components).sort((a, b) => b[1] - a[1])[0]!
  return `${k} (${v})`
}

function topPenalty(arc: { penalties: Record<string, number> }): string {
  const sorted = Object.entries(arc.penalties).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return 'none'
  return `${sorted[0]![0]} (${sorted[0]![1]})`
}

function summarize(id: string, label: string, result: ReturnType<typeof composeAndRerankProvisionalRoutes>) {
  const { composed, reranked } = result
  const composerTop = composed.candidates[0]
  const rerankTop = reranked.rerankedCandidates[0]
  const topArc = rerankTop?.arcQuality

  return {
    id,
    label,
    candidatesReturned: composed.candidates.length,
    rerankedCount: reranked.rerankedCandidates.length,
    rejectedCount: reranked.rejectedCandidates.length,
    winnerChanged: reranked.winnerChanged,
    winnerChangeExplanation: reranked.winnerChangeExplanation,
    composerTopRouteId: composerTop?.routeId ?? null,
    rerankedTopRouteId: rerankTop?.candidate.routeId ?? null,
    composerTopStopIds: composerTop?.orderedStops.map((s) => s.stgoId) ?? [],
    rerankedTopStopIds: rerankTop?.candidate.orderedStops.map((s) => s.stgoId) ?? [],
    composerScore: composerTop?.provisionalRouteScore ?? null,
    arcQualityScore: topArc?.normalizedScore ?? null,
    rerankedScore: rerankTop?.rerankedScore ?? null,
    totalEstimatedMin: rerankTop?.candidate.totalEstimatedMin ?? composerTop?.totalEstimatedMin ?? null,
    unusedBudgetMin: topArc?.unusedBudgetMin ?? null,
    underutilizedBudgetPenalty: topArc?.penalties.underutilizedBudgetPenalty ?? null,
    feasibleWorthwhileContinuations: topArc?.feasibleWorthwhileContinuations ?? null,
    timeUtilizationReason: topArc?.timeUtilizationReason ?? null,
    composition: topArc?.structuralDistribution ?? null,
    shapeTags: rerankTop?.shapeSummary.tags ?? [],
    strongestPositiveFactor: topArc ? topPositiveFactor(topArc) : null,
    strongestPenalty: topArc ? topPenalty(topArc) : null,
    candidateRankChanges: reranked.rerankedCandidates.map((r) => ({
      routeId: r.candidate.routeId,
      originalComposerRank: r.originalComposerRank,
      rerankedRank: r.rerankedRank,
      rankChange: r.rankChange,
      composerScore: r.composerProvisionalScore,
      arcQualityScore: r.arcQualityScore,
      rerankedScore: r.rerankedScore,
    })),
    flags: {
      includesStgo104: composed.candidates.some((c) => c.orderedStops.some((s) => s.stgoId === 'STGO_104')),
      includesStgo33: composed.candidates.some((c) => c.orderedStops.some((s) => s.stgoId === 'STGO_33')),
      calibrationApproved: reranked.calibrationApproved,
      arcQualityStatus: reranked.arcQualityStatus,
    },
  }
}

function main() {
  const rows = fixtures.map((f) => {
    const result = composeAndRerankProvisionalRoutes(f.input, { root: ROOT, candidateCount: 3 })
    return summarize(f.id, f.label, result)
  })

  const f2 = rows.find((r) => r.id === 'F2')!
  const f18 = rows.find((r) => r.id === 'F18')!
  const deterministicRepeat =
    JSON.stringify(f2.rerankedTopStopIds) === JSON.stringify(f18.rerankedTopStopIds) &&
    f2.rerankedScore === f18.rerankedScore

  const winnersChanged = rows.filter((r) => r.winnerChanged).length

  const payload = {
    schemaVersion: 'santiago-arc-reranker-fixtures.v0.1',
    gate: '2D',
    status: 'PROVISIONAL_FIXTURE_SUMMARY',
    arcQualityStatus: 'PROVISIONAL_V0_1',
    calibrationApproved: false,
    physicalRouteGenerationEnabled: false,
    winnersChangedCount: winnersChanged,
    deterministicRepeatF2F18: deterministicRepeat,
    fixtures: rows,
  }

  mkdirSync(resolve(ROOT, 'src/data/santiago/routes'), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({ out: 'src/data/santiago/routes/arc-reranker-fixtures.v0.1.json', fixtures: rows.length, winnersChanged, deterministicRepeat }, null, 2))
}

main()
