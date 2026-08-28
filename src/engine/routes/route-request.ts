/**
 * Gate 2C — RouteRequest normalization + stable serialization/hash.
 */

import { createHash } from 'node:crypto'
import { normalizeTraveler, type TravelerInput } from '@/src/engine/traveler'
import type { TravelerModel } from '@/src/engine/types'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import type {
  RouteIntent,
  RouteRequestV01,
  RouteStart,
  TransportPolicy,
} from '@/src/engine/routes/route-types'

export type RouteRequestInput = {
  traveler?: TravelerModel | TravelerInput
  startingStgoId?: string | null
  startCoordinate?: { lat: number; lng: number; provenance?: string } | null
  timeBudgetMin?: number
  transportPolicy?: TransportPolicy
  routeIntent?: RouteIntent
  preferredThemes?: ThemeCode[]
  avoidThemes?: ThemeCode[]
  desiredStopCount?: number | null
  nightContext?: boolean
  familyContext?: boolean
  stepFreeRequired?: boolean
  highComfort?: boolean
  memorySitesOptIn?: boolean
  useMetro?: boolean
}

function isTravelerModel(x: TravelerModel | TravelerInput): x is TravelerModel {
  return Array.isArray((x as TravelerModel).interests) && typeof (x as TravelerModel).themeWeights === 'object'
}

export function normalizeRouteRequest(input: RouteRequestInput): RouteRequestV01 {
  const baseTraveler = input.traveler
    ? isTravelerModel(input.traveler)
      ? input.traveler
      : normalizeTraveler(input.traveler)
    : normalizeTraveler({ interests: ['historia'] })

  const transportPolicy: TransportPolicy =
    input.transportPolicy ?? (input.useMetro === false || baseTraveler.useMetro === false ? 'WALK_ONLY' : 'WALK_METRO')

  const traveler: TravelerModel = {
    ...baseTraveler,
    timeBudgetMinutes: input.timeBudgetMin ?? baseTraveler.timeBudgetMinutes,
    useMetro: transportPolicy === 'WALK_METRO',
    nightContext: input.nightContext ?? baseTraveler.nightContext,
    familyContext: input.familyContext ?? baseTraveler.familyContext,
    stepFreeRequired: input.stepFreeRequired ?? baseTraveler.stepFreeRequired,
    highComfort: input.highComfort ?? baseTraveler.highComfort,
    memorySitesOptIn: input.memorySitesOptIn ?? baseTraveler.memorySitesOptIn,
    startingStgoId: input.startingStgoId ?? baseTraveler.startingStgoId,
  }

  let start: RouteStart
  if (input.startingStgoId || traveler.startingStgoId) {
    start = { kind: 'STGO_ID', stgoId: (input.startingStgoId || traveler.startingStgoId)! }
  } else if (input.startCoordinate) {
    start = {
      kind: 'UNSUPPORTED',
      reason:
        'Arbitrary coordinate nearest-entry resolution is not enabled in Gate 2C V0.1 without inventing walking connectivity',
    }
  } else {
    start = { kind: 'UNSUPPORTED', reason: 'startingStgoId is required for Gate 2C V0.1' }
  }

  return {
    schemaVersion: 'santiago-route-request.v0.1',
    traveler,
    start,
    timeBudgetMin: input.timeBudgetMin ?? traveler.timeBudgetMinutes,
    transportPolicy,
    routeIntent: input.routeIntent ?? 'BALANCED',
    preferredThemes: input.preferredThemes,
    avoidThemes: input.avoidThemes,
    desiredStopCount: input.desiredStopCount ?? null,
    nightContext: traveler.nightContext,
    familyContext: traveler.familyContext,
    stepFreeRequired: traveler.stepFreeRequired,
    highComfort: traveler.highComfort,
    memorySitesOptIn: traveler.memorySitesOptIn,
  }
}

/** Canonical JSON with sorted keys for stable hashing. */
export function serializeRouteRequest(request: RouteRequestV01): string {
  const canon = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canon)
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.keys(v as object)
          .sort()
          .map((k) => [k, canon((v as Record<string, unknown>)[k])]),
      )
    }
    return v
  }
  return JSON.stringify(canon(request))
}

export function hashRouteRequest(request: RouteRequestV01): string {
  return createHash('sha256').update(serializeRouteRequest(request)).digest('hex').slice(0, 24)
}
