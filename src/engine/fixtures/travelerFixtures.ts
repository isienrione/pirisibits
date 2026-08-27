/**
 * Gate 2A — deterministic ENGINE QA traveler fixtures (not validated customer personas).
 */

import { normalizeTraveler } from '@/src/engine/traveler'
import type { TravelerModel } from '@/src/engine/types'

export const TRAVELER_FIXTURES: Record<string, TravelerModel> = {
  A_first_time_essentials: normalizeTraveler({
    interests: ['historia_civica', 'arq_monumental'],
    rhythm: 'estructurado',
    timeBudgetMinutes: 105,
    walkChunkMinutes: 30,
    memorySitesOptIn: false,
    mobilityArchetype: 'M3',
  }),
  B_civic_history: normalizeTraveler({
    interests: ['historia_civica', 'arq_monumental', 'arq_vernacula'],
    rhythm: 'estructurado',
    timeBudgetMinutes: 180,
    walkChunkMinutes: 30,
    memorySitesOptIn: false,
    mobilityArchetype: 'M3',
  }),
  C_food_street_life: normalizeTraveler({
    interests: ['gastronomia'],
    rhythm: 'espontaneo',
    timeBudgetMinutes: 105,
    walkChunkMinutes: 30,
    memorySitesOptIn: false,
    mobilityArchetype: 'M3',
  }),
  D_architecture_aesthetics: normalizeTraveler({
    interests: ['arq_monumental', 'arq_vernacula', 'arte_visual'],
    rhythm: 'equilibrado',
    timeBudgetMinutes: 105,
    walkChunkMinutes: 30,
    memorySitesOptIn: false,
    mobilityArchetype: 'M3',
  }),
  E_memory_human_rights: normalizeTraveler({
    interests: ['memoria_ddhh', 'historia_civica'],
    rhythm: 'estructurado',
    timeBudgetMinutes: 180,
    walkChunkMinutes: 30,
    memorySitesOptIn: true,
    mobilityArchetype: 'M3',
  }),
  F_discovery_forward: normalizeTraveler({
    interests: ['barrios_vivos', 'arte_visual', 'vida_cotidiana'],
    rhythm: 'espontaneo',
    discoveryPosture: 'D2',
    timeBudgetMinutes: 180,
    walkChunkMinutes: 45,
    memorySitesOptIn: false,
    mobilityArchetype: 'M4',
  }),
  G_express_time_boxed: normalizeTraveler({
    interests: ['historia_civica', 'arq_monumental'],
    rhythm: 'estructurado',
    timeBudgetMinutes: 45,
    walkChunkMinutes: 15,
    expressPreference: true,
    mobilityArchetype: 'M1',
    memorySitesOptIn: false,
  }),
  H_accessibility_sensitive: normalizeTraveler({
    interests: ['historia_civica', 'arte_visual'],
    rhythm: 'equilibrado',
    timeBudgetMinutes: 105,
    walkChunkMinutes: 20,
    avoidStairs: true,
    stepFreeRequired: true,
    mobilityArchetype: 'M2',
    memorySitesOptIn: false,
  }),
  I_high_comfort: normalizeTraveler({
    interests: ['historia_civica', 'barrios_vivos'],
    rhythm: 'equilibrado',
    timeBudgetMinutes: 105,
    walkChunkMinutes: 15,
    highComfort: true,
    mobilityArchetype: 'M5',
    avoidStairs: true,
    memorySitesOptIn: false,
  }),
}

export type TravelerFixtureId = keyof typeof TRAVELER_FIXTURES
