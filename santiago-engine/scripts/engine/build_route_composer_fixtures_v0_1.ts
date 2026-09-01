#!/usr/bin/env npx tsx
/**
 * Gate 2C — emit provisional route composer fixture matrix summary (not production routes).
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { composeProvisionalRoutes } from '../../src/engine/routes/route-composer'
import { F8_D1_FLANEUR_TRAVELER, TRAVELER_FIXTURES } from '../../src/engine/fixtures/travelerFixtures'
import { normalizeTraveler } from '../../src/engine/traveler'
import type { RouteRequestInput } from '../../src/engine/routes/route-request'

const ROOT = resolve(__dirname, '../..')
const OUT = resolve(ROOT, 'src/data/santiago/routes/route-composer-fixtures.v0.1.json')

type FixtureDef = {
  id: string
  label: string
  input: RouteRequestInput
}

const fixtures: FixtureDef[] = [
  {
    id: 'F1',
    label: '60 min WALK_ONLY balanced',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 60,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F2',
    label: '120 min WALK_ONLY balanced',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F3',
    label: '180 min WALK_ONLY balanced',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 180,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F4',
    label: '120 min WALK_METRO',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_METRO',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F5',
    label: '120 min strong T1A',
    input: {
      traveler: TRAVELER_FIXTURES.B_civic_history,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'THEMATIC',
      preferredThemes: ['T1A'],
    },
  },
  {
    id: 'F6',
    label: '120 min strong T2 culinary',
    input: {
      traveler: TRAVELER_FIXTURES.C_food_street_life,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'THEMATIC',
      preferredThemes: ['T2'],
    },
  },
  {
    id: 'F7',
    label: '120 min strong T3 aesthetics',
    input: {
      traveler: TRAVELER_FIXTURES.D_architecture_aesthetics,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'THEMATIC',
      preferredThemes: ['T3'],
    },
  },
  {
    id: 'F8',
    label: '120 min D1 Flâneur',
    input: {
      traveler: F8_D1_FLANEUR_TRAVELER,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'DISCOVERY',
    },
  },
  {
    id: 'F9',
    label: '120 min D2 Detective',
    input: {
      traveler: normalizeTraveler({
        interests: ['arquitectura', 'memoria_ddhh'],
        discoveryPosture: 'D2',
        rhythm: 'espontaneo',
        memorySitesOptIn: true,
      }),
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'DISCOVERY',
    },
  },
  {
    id: 'F10',
    label: '120 min M1 Express',
    input: {
      traveler: TRAVELER_FIXTURES.G_express_time_boxed,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'ESSENTIALS',
    },
  },
  {
    id: 'F11',
    label: 'stepFreeRequired',
    input: {
      traveler: TRAVELER_FIXTURES.H_accessibility_sensitive,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
      stepFreeRequired: true,
    },
  },
  {
    id: 'F12',
    label: 'memorySitesOptIn=false',
    input: {
      traveler: TRAVELER_FIXTURES.B_civic_history,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
      memorySitesOptIn: false,
    },
  },
  {
    id: 'F13',
    label: 'memorySitesOptIn=true',
    input: {
      traveler: TRAVELER_FIXTURES.E_memory_human_rights,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'THEMATIC',
      memorySitesOptIn: true,
      preferredThemes: ['T1B'],
    },
  },
  {
    id: 'F14',
    label: 'highComfort',
    input: {
      traveler: TRAVELER_FIXTURES.I_high_comfort,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
      highComfort: true,
    },
  },
  {
    id: 'F15',
    label: 'tight time budget',
    input: {
      traveler: TRAVELER_FIXTURES.G_express_time_boxed,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 45,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'ESSENTIALS',
    },
  },
  {
    id: 'F16',
    label: 'start near STGO_33 physically supported (STGO_01 hub; 33 not start)',
    input: {
      traveler: TRAVELER_FIXTURES.D_architecture_aesthetics,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F17',
    label: 'STGO_104 excluded physical pending',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
  {
    id: 'F18',
    label: 'deterministic repeat of F2',
    input: {
      traveler: TRAVELER_FIXTURES.A_first_time_essentials,
      startingStgoId: 'STGO_01',
      timeBudgetMin: 120,
      transportPolicy: 'WALK_ONLY',
      routeIntent: 'BALANCED',
    },
  },
]

function summarize(id: string, label: string, result: ReturnType<typeof composeProvisionalRoutes>) {
  const top = result.candidates[0]
  const sims = result.pairwiseSimilarity.map((s) => s.similarity)
  return {
    id,
    label,
    candidatesReturned: result.candidates.length,
    requestHash: result.requestHash,
    diagnostics: result.diagnostics,
    topRouteStopIds: top?.orderedStops.map((s) => s.stgoId) || [],
    totalEstimatedMin: top?.totalEstimatedMin ?? null,
    budgetDeltaMin: top?.budgetDeltaMin ?? null,
    composition: top
      ? {
          anchors: top.anchorCount,
          pockets: top.thematicPocketCount,
          micros: top.microRevealCount,
          stops: top.stopCount,
        }
      : null,
    dominantThemes: top?.dominantThemes || [],
    transportUse: top?.metroUse || null,
    provisionalScore: top?.provisionalRouteScore ?? null,
    primaryOmissionReasons: (top?.omittedHighUtilityNodes || []).slice(0, 5).map((o) => ({
      stgoId: o.stgoId,
      reasonCode: o.reasonCode,
    })),
    candidateSimilarityRange:
      sims.length > 0 ? { min: Math.min(...sims), max: Math.max(...sims) } : null,
    flags: {
      overBudget: top ? top.budgetDeltaMin > 8 : false,
      includesStgo104: top ? top.orderedStops.some((s) => s.stgoId === 'STGO_104') : false,
      includesL7: top ? top.metroUse.lineIds.includes('L7') : false,
      calibrationApproved: result.calibrationApproved,
    },
  }
}

function main() {
  const rows = fixtures.map((f) => {
    const result = composeProvisionalRoutes(f.input, { root: ROOT, candidateCount: 3 })
    return summarize(f.id, f.label, result)
  })

  // F18 determinism vs F2
  const f2 = rows.find((r) => r.id === 'F2')!
  const f18 = rows.find((r) => r.id === 'F18')!
  const deterministicRepeat =
    JSON.stringify(f2.topRouteStopIds) === JSON.stringify(f18.topRouteStopIds) &&
    f2.provisionalScore === f18.provisionalScore

  const payload = {
    schemaVersion: 'santiago-route-composer-fixtures.v0.1',
    gate: '2C',
    status: 'PROVISIONAL_FIXTURE_SUMMARY',
    calibrationApproved: false,
    physicalRouteGenerationEnabled: false,
    note: 'Fixture summaries for Route Lab / QA — not authoritative production routes.',
    deterministicRepeatF2F18: deterministicRepeat,
    fixtures: rows,
  }
  mkdirSync(resolve(ROOT, 'src/data/santiago/routes'), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8')
  console.log(JSON.stringify({ out: 'src/data/santiago/routes/route-composer-fixtures.v0.1.json', fixtures: rows.length, deterministicRepeat }, null, 2))
}

main()
