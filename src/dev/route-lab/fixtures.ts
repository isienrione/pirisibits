/**
 * Gate 2E — Route Lab fixture presets (F1–F18), shared with engine QA matrix.
 */

import { TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { normalizeTraveler } from '@/src/engine/traveler'
import type { RouteRequestInput } from '@/src/engine/routes/route-request'

export type RouteLabFixtureDef = {
  id: string
  label: string
  description: string
  input: RouteRequestInput
  watchCase?: boolean
  watchNote?: string
}

export const ROUTE_LAB_DEFAULT_FIXTURE_ID = 'F2'

export const ROUTE_LAB_WATCH_FIXTURE_IDS = ['F1', 'F2', 'F8', 'F9', 'F15'] as const

export const ROUTE_LAB_FIXTURES: RouteLabFixtureDef[] = [
  { id: 'F1', label: 'F1 — 60 min · Walk · Balanced', description: '60 min WALK_ONLY balanced', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 60, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' }, watchCase: true, watchNote: 'Arc reranker changed winner — may overweight opening/ending strength vs composer utility.' },
  { id: 'F2', label: 'F2 — 120 min · Walk · Balanced', description: '120 min WALK_ONLY balanced (default)', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' }, watchCase: true, watchNote: 'Civic anchor-heavy routes with low pocket representation — inspect structural monotony.' },
  { id: 'F3', label: 'F3 — 180 min · Walk · Balanced', description: '180 min WALK_ONLY balanced', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 180, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F4', label: 'F4 — 120 min · Walk+Metro', description: '120 min WALK_METRO', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_METRO', routeIntent: 'BALANCED' } },
  { id: 'F5', label: 'F5 — 120 min · Civic T1A', description: '120 min strong T1A thematic', input: { traveler: TRAVELER_FIXTURES.B_civic_history, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T1A'] } },
  { id: 'F6', label: 'F6 — 120 min · Culinary', description: '120 min strong T2 culinary', input: { traveler: TRAVELER_FIXTURES.C_food_street_life, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T2'] } },
  { id: 'F7', label: 'F7 — 120 min · T3 aesthetics', description: '120 min strong T3 aesthetics', input: { traveler: TRAVELER_FIXTURES.D_architecture_aesthetics, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', preferredThemes: ['T3'] } },
  { id: 'F8', label: 'F8 — 120 min · D1 Flâneur', description: '120 min DISCOVERY (Flâneur posture fixture)', input: { traveler: TRAVELER_FIXTURES.F_discovery_forward, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' }, watchCase: true, watchNote: 'Reranking promoted a candidate that filled previously unused budget (Gate 2C left slack).' },
  { id: 'F9', label: 'F9 — 120 min · D2 Detective', description: '120 min D2 Detective discovery', input: { traveler: normalizeTraveler({ interests: ['arquitectura', 'memoria_ddhh'], discoveryPosture: 'D2', rhythm: 'espontaneo', memorySitesOptIn: true }), startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'DISCOVERY' }, watchCase: true, watchNote: '~13.5 min unused with feasible continuations — no underutilizedBudgetPenalty at current 15% threshold.' },
  { id: 'F10', label: 'F10 — 120 min · M1 Express', description: '120 min M1 Express essentials', input: { traveler: TRAVELER_FIXTURES.G_express_time_boxed, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' } },
  { id: 'F11', label: 'F11 — Step-free required', description: 'stepFreeRequired accessibility', input: { traveler: TRAVELER_FIXTURES.H_accessibility_sensitive, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', stepFreeRequired: true } },
  { id: 'F12', label: 'F12 — Memory opt-out', description: 'memorySitesOptIn=false', input: { traveler: TRAVELER_FIXTURES.B_civic_history, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', memorySitesOptIn: false } },
  { id: 'F13', label: 'F13 — Memory opt-in', description: 'memorySitesOptIn=true T1B', input: { traveler: TRAVELER_FIXTURES.E_memory_human_rights, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'THEMATIC', memorySitesOptIn: true, preferredThemes: ['T1B'] } },
  { id: 'F14', label: 'F14 — High comfort', description: 'highComfort preference', input: { traveler: TRAVELER_FIXTURES.I_high_comfort, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED', highComfort: true } },
  { id: 'F15', label: 'F15 — 45 min tight', description: 'tight time budget essentials', input: { traveler: TRAVELER_FIXTURES.G_express_time_boxed, startingStgoId: 'STGO_01', timeBudgetMin: 45, transportPolicy: 'WALK_ONLY', routeIntent: 'ESSENTIALS' }, watchCase: true, watchNote: 'Tight budget where arc reranker changed winner despite lower composer score.' },
  { id: 'F16', label: 'F16 — STGO_33 hub context', description: 'STGO_33 physical status respected (hub STGO_01)', input: { traveler: TRAVELER_FIXTURES.D_architecture_aesthetics, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F17', label: 'F17 — STGO_104 regression', description: 'STGO_104 excluded while physical pending', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
  { id: 'F18', label: 'F18 — F2 repeat', description: 'deterministic repeat of F2', input: { traveler: TRAVELER_FIXTURES.A_first_time_essentials, startingStgoId: 'STGO_01', timeBudgetMin: 120, transportPolicy: 'WALK_ONLY', routeIntent: 'BALANCED' } },
]

export function getRouteLabFixture(id: string): RouteLabFixtureDef | undefined {
  return ROUTE_LAB_FIXTURES.find((f) => f.id === id)
}

export function fixtureIdFromRequestHash(hash: string, hashByFixture: Record<string, string>): string | null {
  const entry = Object.entries(hashByFixture).find(([, h]) => h === hash)
  return entry?.[0] ?? null
}
