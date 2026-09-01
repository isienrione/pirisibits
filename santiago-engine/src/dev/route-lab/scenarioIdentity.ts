/**
 * Gate 2E.3.1-R — scenario identity + reproducibility QA (read-only).
 *
 * Fingerprints what we asked (scenario) vs what the engine produced (route).
 * Does not score, search, or select routes.
 *
 * Executable oracle: F1–F18. Historical R1–R8 are LOST_HISTORICAL_ORACLES.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { F8_D1_FLANEUR_TRAVELER, TRAVELER_FIXTURES } from '@/src/engine/fixtures/travelerFixtures'
import { hashRouteRequest, normalizeRouteRequest } from '@/src/engine/routes/route-request'
import type { RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import {
  ARBITRATION_CONFIG_STATUS,
  ARBITRATION_VERSION,
  ROUTE_CHOICE_SCORE_VERSION,
} from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type { RouteLabFixtureDef } from '@/src/dev/route-lab/fixtures'
import { getRouteLabFixture, ROUTE_LAB_FIXTURES } from '@/src/dev/route-lab/fixtures'
import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'
import type { ArbitrationResultV02 } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

export const SCENARIO_IDENTITY_SCHEMA = 'santiago-scenario-identity.v0.1' as const
export const SCENARIO_QA_ORACLE_SCHEMA = 'gate-2e31r-scenario-identity-oracle.v0.1' as const
export const SCENARIO_QA_ORACLE_REL = 'src/data/santiago/routes/gate-2e31r-scenario-identity-oracle.v0.1.json'
export const RECONSTRUCTION_PARENT_SHA = 'd7c62f490e0ee9337ba73e50107fdbcd09a56579'

export const NOT_MODELED_IDENTITY_FIELDS = ['familiarity'] as const

export type TravelerFixtureRef =
  | `TRAVELER_FIXTURES.${string}`
  | 'F8_D1_FLANEUR_TRAVELER'
  | 'INLINE'

export type IncludedIdentityFields = {
  scenarioId: string
  travelerFixtureId: TravelerFixtureRef
  interests: string[]
  themeWeights: Record<string, number>
  discoveryPosture: string
  rhythm: string
  mobilityArchetype: string | null
  stepFreeRequired: boolean
  memorySitesOptIn: boolean
  highComfort: boolean
  familyContext: boolean
  nightContext: boolean
  expressPreference: boolean
  walkChunkMinutes: number
  useMetro: boolean
  timeBudgetMin: number
  start: RouteRequestV01['start']
  startingStgoId: string | null
  routeIntent: string
  transportPolicy: string
  preferredThemes: string[] | null
  avoidThemes: string[] | null
  desiredStopCount: number | null
  stayDays: number
  locationEnabled: boolean
}

export type ScenarioIdentity = {
  schemaVersion: typeof SCENARIO_IDENTITY_SCHEMA
  scenarioId: string
  scenarioLabel: string
  travelerFixtureId: TravelerFixtureRef
  request: RouteRequestV01
  requestHash: string
  notModeled: readonly string[]
  includedFields: IncludedIdentityFields
  scenarioFingerprint: string
}

export type RouteResultIdentity = {
  requestHash: string
  routeFingerprintV01: string
  routeIdV01: string | null
  routeFingerprintV02: string | null
  routeIdV02: string | null
}

export type ScenarioQaRecord = {
  scenarioId: string
  scenarioFingerprint: string
  travelerFixtureId: TravelerFixtureRef
  requestHash: string
  engineVersions: {
    requestSchemaVersion: string
    arbitrationVersion: string
    routeChoiceScoreVersion: string
    arbitrationConfigStatus: string
  }
  winningLane: string | null
  orderedStopIds: string[]
  routeFingerprintV01: string
  routeIdV01: string | null
  routeFingerprintV02: string | null
  routeIdV02: string | null
  totalModeledMinutes: number | null
  composerScore: number | null
  rerankedScore: number | null
  arbitrationStatus: string | null
}

export type FrozenOracleCompare = {
  frozenOracleMatch: 'PASS' | 'FAIL'
  scenarioDrift: 'YES' | 'NO'
  routeDrift: 'YES' | 'NO'
}

/** Canonical JSON: sorted object keys, sorted unordered theme arrays, arrays otherwise kept. */
export function canonicalizeForIdentity(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeForIdentity)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const out: Record<string, unknown> = {}
    for (const k of keys) {
      if (k === 'preferredThemes' || k === 'avoidThemes') {
        const arr = obj[k]
        out[k] = Array.isArray(arr)
          ? [...(arr as string[])].map(String).sort().map(canonicalizeForIdentity)
          : canonicalizeForIdentity(arr)
      } else {
        out[k] = canonicalizeForIdentity(obj[k])
      }
    }
    return out
  }
  return value
}

export function serializeCanonical(value: unknown): string {
  return JSON.stringify(canonicalizeForIdentity(value))
}

export function hashCanonical(value: unknown, length = 24): string {
  return createHash('sha256').update(serializeCanonical(value)).digest('hex').slice(0, length)
}

export function namedTravelerFixtureId(traveler: unknown): TravelerFixtureRef {
  if (traveler === F8_D1_FLANEUR_TRAVELER) return 'F8_D1_FLANEUR_TRAVELER'
  for (const [k, v] of Object.entries(TRAVELER_FIXTURES)) {
    if (traveler === v) return `TRAVELER_FIXTURES.${k}`
  }
  return 'INLINE'
}

export function buildScenarioIdentity(fixture: RouteLabFixtureDef): ScenarioIdentity {
  const request = normalizeRouteRequest(fixture.input)
  const travelerFixtureId = namedTravelerFixtureId(fixture.input.traveler)
  const requestHash = hashRouteRequest(request)
  const fingerprintPayload = {
    scenarioId: fixture.id,
    travelerFixtureId,
    request,
    notModeled: [...NOT_MODELED_IDENTITY_FIELDS],
  }
  const identity: ScenarioIdentity = {
    schemaVersion: SCENARIO_IDENTITY_SCHEMA,
    scenarioId: fixture.id,
    scenarioLabel: fixture.label,
    travelerFixtureId,
    request,
    requestHash,
    notModeled: NOT_MODELED_IDENTITY_FIELDS,
    includedFields: includedIdentityFieldsBase(fixture.id, travelerFixtureId, request),
    scenarioFingerprint: hashCanonical(fingerprintPayload, 24),
  }
  return identity
}

export function includedIdentityFields(identity: ScenarioIdentity): IncludedIdentityFields {
  return identity.includedFields
}

function includedIdentityFieldsBase(
  scenarioId: string,
  travelerFixtureId: TravelerFixtureRef,
  request: RouteRequestV01,
): IncludedIdentityFields {
  const t = request.traveler
  return {
    scenarioId,
    travelerFixtureId,
    interests: [...t.interests],
    themeWeights: { ...t.themeWeights },
    discoveryPosture: t.discoveryPosture,
    rhythm: t.rhythm,
    mobilityArchetype: t.mobilityArchetype,
    stepFreeRequired: request.stepFreeRequired ?? t.stepFreeRequired,
    memorySitesOptIn: request.memorySitesOptIn ?? t.memorySitesOptIn,
    highComfort: request.highComfort ?? t.highComfort,
    familyContext: request.familyContext ?? t.familyContext,
    nightContext: request.nightContext ?? t.nightContext,
    expressPreference: t.expressPreference,
    walkChunkMinutes: t.walkChunkMinutes,
    useMetro: t.useMetro,
    timeBudgetMin: request.timeBudgetMin,
    start: request.start,
    startingStgoId: t.startingStgoId,
    routeIntent: request.routeIntent,
    transportPolicy: request.transportPolicy,
    preferredThemes: request.preferredThemes ? [...request.preferredThemes] : null,
    avoidThemes: request.avoidThemes ? [...request.avoidThemes] : null,
    desiredStopCount: request.desiredStopCount ?? null,
    stayDays: t.stayDays,
    locationEnabled: t.locationEnabled,
  }
}

export function buildScenarioIdentityById(scenarioId: string): ScenarioIdentity {
  const fx = getRouteLabFixture(scenarioId)
  if (!fx) throw new Error(`Unknown scenario ${scenarioId}`)
  return buildScenarioIdentity(fx)
}

/**
 * Existing V0.1 inspection route fingerprint (16 hex). Payload key order is frozen.
 * Do not change — Founder Inspection and QA must share this hash.
 */
export function computeV01RouteFingerprint(args: {
  requestHash: string
  routeId: string | null
  stopIds: string[]
  totalEstimatedMin: number | null
  provisionalRouteScore: number | null
  rerankedScore: number | null
}): string {
  const fingerprintPayload = {
    requestHash: args.requestHash,
    routeId: args.routeId,
    stopIds: args.stopIds,
    totalEstimatedMin: args.totalEstimatedMin,
    provisionalRouteScore: args.provisionalRouteScore,
    rerankedScore: args.rerankedScore,
  }
  return createHash('sha256').update(JSON.stringify(fingerprintPayload)).digest('hex').slice(0, 16)
}

export function computeV02RouteFingerprint(args: {
  recommendedRouteId: string | null
  recommendedLane: string | null
  choiceConfidence: string | null
}): string | null {
  if (!args.recommendedRouteId && !args.recommendedLane) return null
  return hashCanonical(
    {
      recommendedLane: args.recommendedLane,
      recommendedRouteId: args.recommendedRouteId,
      choiceConfidence: args.choiceConfidence,
    },
    16,
  )
}

export function buildRouteResultIdentity(args: {
  lab: RouteLabRunResult
  arbitration?: ArbitrationResultV02 | null
}): RouteResultIdentity {
  const winner =
    args.lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1) ??
    args.lab.reranked.rerankedCandidates[0]
  const candidate = winner?.candidate
  const routeIdV01 = candidate?.routeId ?? args.lab.reranked.topRerankedRouteId ?? null
  const stopIds = candidate?.orderedStops.map((s) => s.stgoId) ?? []
  const arb = args.arbitration ?? null
  return {
    requestHash: args.lab.composed.requestHash,
    routeFingerprintV01: computeV01RouteFingerprint({
      requestHash: args.lab.composed.requestHash,
      routeId: routeIdV01,
      stopIds,
      totalEstimatedMin: candidate?.totalEstimatedMin ?? null,
      provisionalRouteScore: candidate?.provisionalRouteScore ?? null,
      rerankedScore: winner?.rerankedScore ?? null,
    }),
    routeIdV01,
    routeFingerprintV02: computeV02RouteFingerprint({
      recommendedRouteId: arb?.recommendedRouteId ?? null,
      recommendedLane: arb?.recommendedLane ? String(arb.recommendedLane) : null,
      choiceConfidence: arb?.choiceConfidence ?? null,
    }),
    routeIdV02: arb?.recommendedRouteId ?? null,
  }
}

export function engineVersions() {
  return {
    requestSchemaVersion: 'santiago-route-request.v0.1',
    arbitrationVersion: ARBITRATION_VERSION,
    routeChoiceScoreVersion: ROUTE_CHOICE_SCORE_VERSION,
    arbitrationConfigStatus: ARBITRATION_CONFIG_STATUS,
  }
}

export function buildScenarioQaRecord(args: {
  fixture: RouteLabFixtureDef
  lab: RouteLabRunResult
  arbitration?: ArbitrationResultV02 | null
}): ScenarioQaRecord {
  const identity = buildScenarioIdentity(args.fixture)
  const route = buildRouteResultIdentity(args)
  const winner =
    args.lab.reranked.rerankedCandidates.find((x) => x.rerankedRank === 1) ??
    args.lab.reranked.rerankedCandidates[0]
  const arb = args.arbitration ?? null
  return {
    scenarioId: identity.scenarioId,
    scenarioFingerprint: identity.scenarioFingerprint,
    travelerFixtureId: identity.travelerFixtureId,
    requestHash: identity.requestHash,
    engineVersions: engineVersions(),
    winningLane: arb?.recommendedLane ? String(arb.recommendedLane) : null,
    orderedStopIds: winner?.candidate.orderedStops.map((s) => s.stgoId) ?? [],
    routeFingerprintV01: route.routeFingerprintV01,
    routeIdV01: route.routeIdV01,
    routeFingerprintV02: route.routeFingerprintV02,
    routeIdV02: route.routeIdV02,
    totalModeledMinutes: winner?.candidate.totalEstimatedMin ?? null,
    composerScore: winner?.candidate.provisionalRouteScore ?? null,
    rerankedScore: winner?.rerankedScore ?? null,
    arbitrationStatus: arb?.choiceConfidence ?? null,
  }
}

export type ScenarioQaOracleFile = {
  schemaVersion: typeof SCENARIO_QA_ORACLE_SCHEMA
  executableOracle: 'F1-F18'
  lostHistoricalOracle: 'R1-R8'
  reconstructionParent: string
  records: Record<string, ScenarioQaRecord>
}

export function loadScenarioQaOracle(root: string): ScenarioQaOracleFile {
  const raw = JSON.parse(readFileSync(resolve(root, SCENARIO_QA_ORACLE_REL), 'utf8'))
  return raw as ScenarioQaOracleFile
}

export function compareToFrozenOracle(live: ScenarioQaRecord, frozen: ScenarioQaRecord): FrozenOracleCompare {
  const scenarioDrift = live.scenarioFingerprint !== frozen.scenarioFingerprint ? 'YES' : 'NO'
  const routeDrift =
    live.routeFingerprintV01 !== frozen.routeFingerprintV01 ||
    live.routeIdV01 !== frozen.routeIdV01 ||
    live.routeFingerprintV02 !== frozen.routeFingerprintV02 ||
    live.routeIdV02 !== frozen.routeIdV02 ||
    live.winningLane !== frozen.winningLane ||
    JSON.stringify(live.orderedStopIds) !== JSON.stringify(frozen.orderedStopIds) ||
    live.totalModeledMinutes !== frozen.totalModeledMinutes ||
    live.composerScore !== frozen.composerScore ||
    live.rerankedScore !== frozen.rerankedScore ||
    live.requestHash !== frozen.requestHash ||
    live.arbitrationStatus !== frozen.arbitrationStatus ||
    JSON.stringify(live.engineVersions) !== JSON.stringify(frozen.engineVersions)
      ? 'YES'
      : 'NO'
  return {
    scenarioDrift,
    routeDrift,
    frozenOracleMatch: scenarioDrift === 'NO' && routeDrift === 'NO' ? 'PASS' : 'FAIL',
  }
}

export function buildAllScenarioIdentities(): Record<string, ScenarioIdentity> {
  const out: Record<string, ScenarioIdentity> = {}
  for (const f of ROUTE_LAB_FIXTURES) out[f.id] = buildScenarioIdentity(f)
  return out
}

/** Test helper: identity from a request clone without mutating F1–F18. */
export function scenarioFingerprintForInput(scenarioId: string, input: RouteRequestInput, label = ''): string {
  const fixture: RouteLabFixtureDef = {
    id: scenarioId,
    label,
    description: '',
    input,
  }
  return buildScenarioIdentity(fixture).scenarioFingerprint
}
