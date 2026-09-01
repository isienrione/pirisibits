/**
 * Gate 2A — TravelerModel normalization from existing algorithm / knapsack inputs.
 */

import {
  MICRO_INTERESTS,
  RHYTHM_POSTURE,
  normalizeInterests,
  type ExplorerRhythm,
  type InterestId,
  type MicroInterestId,
  type MobilityArchetypeId,
  isMicroInterest,
  isPillarId,
  INTEREST_VECTORS,
} from '@/src/data/algorithm'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import { emptyThemeWeights, type DiscoveryPostureCode } from '@/src/engine/taxonomy'
import type { TravelerModel } from '@/src/engine/types'

export type TravelerInput = {
  interests: InterestId[] | string[]
  rhythm?: ExplorerRhythm
  discoveryPosture?: DiscoveryPostureCode
  timeBudgetMinutes?: number
  walkChunkMinutes?: number
  useMetro?: boolean
  avoidStairs?: boolean
  stepFreeRequired?: boolean
  highComfort?: boolean
  familyContext?: boolean
  nightContext?: boolean
  memorySitesOptIn?: boolean
  mobilityArchetype?: MobilityArchetypeId | 'M1' | null
  startingStgoId?: string | null
  stayDays?: number
  locationEnabled?: boolean
  expressPreference?: boolean
}

/**
 * Map product interests onto ThemeCode weights using MICRO_INTERESTS.code
 * (T1A/T1B/T3–T9) — NOT the demo vector index T1/T2 encoding.
 */
export function themeWeightsFromInterests(interests: InterestId[]): Record<ThemeCode, number> {
  const w = emptyThemeWeights()
  normalizeInterests(interests).forEach((id) => {
    if (isMicroInterest(id)) {
      const code = MICRO_INTERESTS[id].code as ThemeCode
      if (code in w) w[code] = 1
      return
    }
    if (isPillarId(id)) {
      ;(Object.keys(MICRO_INTERESTS) as MicroInterestId[])
        .filter((micro) => MICRO_INTERESTS[micro].pillar === id)
        .forEach((micro) => {
          const code = MICRO_INTERESTS[micro].code as ThemeCode
          if (code in w) w[code] = 1
        })
      // Pillar historia expands to T1A+T1B via micros; ignore INTEREST_VECTORS T1/T2 alias.
      void INTEREST_VECTORS
    }
  })
  return w
}

export function normalizeTraveler(input: TravelerInput): TravelerModel {
  const interests = normalizeInterests(input.interests as InterestId[])
  const rhythm = input.rhythm ?? 'equilibrado'
  const discoveryPosture = input.discoveryPosture ?? RHYTHM_POSTURE[rhythm]
  const mobility = input.mobilityArchetype ?? null
  const stepFreeRequired = Boolean(
    input.stepFreeRequired || input.avoidStairs || mobility === 'M2' || mobility === 'M5',
  )
  const highComfort = Boolean(input.highComfort || mobility === 'M5' || (input.walkChunkMinutes ?? 30) <= 15)
  const expressPreference = Boolean(
    input.expressPreference || mobility === 'M1' || (input.timeBudgetMinutes ?? 105) <= 45,
  )

  return {
    interests,
    themeWeights: themeWeightsFromInterests(interests),
    discoveryPosture,
    rhythm,
    timeBudgetMinutes: input.timeBudgetMinutes ?? 105,
    expressPreference,
    stepFreeRequired,
    highComfort,
    familyContext: Boolean(input.familyContext || mobility === 'M3'),
    nightContext: Boolean(input.nightContext || mobility === 'M4'),
    memorySitesOptIn: Boolean(input.memorySitesOptIn),
    walkChunkMinutes: input.walkChunkMinutes ?? 30,
    useMetro: input.useMetro ?? true,
    mobilityArchetype: mobility,
    startingStgoId: input.startingStgoId ?? null,
    stayDays: input.stayDays ?? 1,
    locationEnabled: input.locationEnabled ?? false,
  }
}
