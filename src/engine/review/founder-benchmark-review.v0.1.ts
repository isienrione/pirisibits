/**
 * Gate 2E.6F — Founder benchmark comparison schema (human calibration handoff).
 * Does NOT invoke or mutate engine scoring/composer/arbitration.
 */

import { createHash } from 'node:crypto'
import type { FeatureCompleteAlphaResult } from '@/src/engine/vnext/pipeline/run-feature-complete-alpha'

export const FOUNDER_BENCHMARK_REVIEW_SCHEMA = 'founder-benchmark-review.v0.1' as const
export const FEATURE_COMPLETE_ALPHA_FREEZE_SHA = '21cc50c4' as const

export type DifferenceClassification =
  | 'DATA'
  | 'EXPERIENCE_TIME'
  | 'NARRATIVE_GRAPH'
  | 'CONTENT_GAP'
  | 'CALIBRATION'
  | 'SEARCH'
  | 'ARBITRATION'
  | 'HUMAN_PREFERENCE'
  | 'ENGINE_BETTER'
  | 'UNKNOWN'

export type DifferenceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER'

export type HumanRouteEntry = {
  experienceId: string
  assumedVisitMode: string | null
  humanEstimatedTime: number | null
  narrativeRole: string | null
  inclusionReason: string | null
  omissionNotes: string | null
}

export type HumanRouteSnapshot = {
  experienceSequence: HumanRouteEntry[]
}

export type EngineRouteSnapshot = {
  runFingerprint: string
  experienceSequence: string[]
  stgoIds: string[]
  estimatedTime: number | null
  arcSummary: Record<string, unknown> | null
  arbitrationResult: {
    winnerLane: string | null
    score: number | null
    confidence: string | null
    margin: number | null
    objective: string | null
    candidateFingerprint: string | null
  }
  frozenBaselineSha: typeof FEATURE_COMPLETE_ALPHA_FREEZE_SHA
}

export type PerDifferenceEntry = {
  experienceId: string | null
  position: number | null
  humanChoice: string | null
  engineChoice: string | null
  classification: DifferenceClassification
  severity: DifferenceSeverity
  founderNote: string | null
}

export type RouteRubric = {
  travelerFit: number | null
  essentialCoverage: number | null
  geographicFlow: number | null
  narrativeArc: number | null
  varietyRhythm: number | null
  timeUse: number | null
  opening: number | null
  payoff: number | null
  landing: number | null
  sellable: number | null
}

export type FounderBenchmarkReview = {
  schemaVersion: typeof FOUNDER_BENCHMARK_REVIEW_SCHEMA
  status: 'NON_CANONICAL'
  frozenBaselineSha: typeof FEATURE_COMPLETE_ALPHA_FREEZE_SHA
  benchmarkId: string
  travelerRequestFingerprint: string
  recordedAtIso: string | null
  humanRoute: HumanRouteSnapshot
  engineRoute: EngineRouteSnapshot
  perDifference: PerDifferenceEntry[]
  routeRubric: RouteRubric
  founderNotes: string | null
}

export function travelerRequestFingerprint(input: unknown): string {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 24)
}

/** Build engine snapshot from a frozen Gate 2E.6 alpha run — read-only. */
export function engineRouteFromAlphaRun(run: FeatureCompleteAlphaResult): EngineRouteSnapshot {
  const winner = run.arbitrationCurrent.winner
  const rec = run.recommendation
  return {
    runFingerprint: run.runFingerprint,
    experienceSequence: rec?.experienceIds ?? [],
    stgoIds: rec?.stgoIds ?? [],
    estimatedTime: rec?.totalEstimatedMin ?? null,
    arcSummary: winner?.arcQuality.arcStateSummary
      ? { ...winner.arcQuality.arcStateSummary, normalizedScore: winner.arcQuality.normalizedScore }
      : null,
    arbitrationResult: {
      winnerLane: winner?.lane ?? run.arbitrationCurrent.winner?.lane ?? null,
      score: winner?.score ?? null,
      confidence: run.arbitrationCurrent.confidence,
      margin: run.arbitrationCurrent.margin,
      objective: run.arbitrationCurrent.objectiveUsed,
      candidateFingerprint: rec?.fingerprint ?? null,
    },
    frozenBaselineSha: FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
  }
}

/** Suggest per-position differences — founder may override classification/severity. */
export function suggestPerDifferences(
  human: HumanRouteSnapshot,
  engine: EngineRouteSnapshot,
): PerDifferenceEntry[] {
  const out: PerDifferenceEntry[] = []
  const humanIds = human.experienceSequence.map((e) => e.experienceId)
  const engineIds = engine.experienceSequence
  const maxLen = Math.max(humanIds.length, engineIds.length)
  for (let i = 0; i < maxLen; i++) {
    const h = humanIds[i] ?? null
    const e = engineIds[i] ?? null
    if (h === e) continue
    let classification: DifferenceClassification = 'UNKNOWN'
    if (h == null && e != null) classification = 'HUMAN_PREFERENCE'
    else if (h != null && e == null) classification = 'SEARCH'
    else if (h && e && h.split('::')[0] === e.split('::')[0]) classification = 'EXPERIENCE_TIME'
    else classification = 'ARBITRATION'
    out.push({
      experienceId: h ?? e,
      position: i,
      humanChoice: h,
      engineChoice: e,
      classification,
      severity: h == null || e == null ? 'MEDIUM' : 'LOW',
      founderNote: null,
    })
  }
  const humanSet = new Set(humanIds)
  const engineSet = new Set(engineIds)
  for (const id of humanSet) {
    if (!engineSet.has(id)) {
      if (!out.some((d) => d.humanChoice === id && d.engineChoice == null)) {
        out.push({
          experienceId: id,
          position: null,
          humanChoice: id,
          engineChoice: null,
          classification: 'HUMAN_PREFERENCE',
          severity: 'MEDIUM',
          founderNote: null,
        })
      }
    }
  }
  for (const id of engineSet) {
    if (!humanSet.has(id)) {
      if (!out.some((d) => d.engineChoice === id && d.humanChoice == null)) {
        out.push({
          experienceId: id,
          position: null,
          humanChoice: null,
          engineChoice: id,
          classification: 'ENGINE_BETTER',
          severity: 'LOW',
          founderNote: null,
        })
      }
    }
  }
  return out
}

export function emptyRouteRubric(): RouteRubric {
  return {
    travelerFit: null,
    essentialCoverage: null,
    geographicFlow: null,
    narrativeArc: null,
    varietyRhythm: null,
    timeUse: null,
    opening: null,
    payoff: null,
    landing: null,
    sellable: null,
  }
}

export function createFounderBenchmarkReview(input: {
  benchmarkId: string
  travelerRequestFingerprint: string
  humanRoute: HumanRouteSnapshot
  engineRoute: EngineRouteSnapshot
  perDifference?: PerDifferenceEntry[]
  routeRubric?: Partial<RouteRubric>
  founderNotes?: string | null
  recordedAtIso?: string | null
}): FounderBenchmarkReview {
  return {
    schemaVersion: FOUNDER_BENCHMARK_REVIEW_SCHEMA,
    status: 'NON_CANONICAL',
    frozenBaselineSha: FEATURE_COMPLETE_ALPHA_FREEZE_SHA,
    benchmarkId: input.benchmarkId,
    travelerRequestFingerprint: input.travelerRequestFingerprint,
    recordedAtIso: input.recordedAtIso ?? null,
    humanRoute: input.humanRoute,
    engineRoute: input.engineRoute,
    perDifference:
      input.perDifference ?? suggestPerDifferences(input.humanRoute, input.engineRoute),
    routeRubric: { ...emptyRouteRubric(), ...input.routeRubric },
    founderNotes: input.founderNotes ?? null,
  }
}

export function parseHumanRouteSequence(text: string): HumanRouteEntry[] {
  const tokens = text
    .split(/[\n,→>]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  return tokens.map((experienceId) => ({
    experienceId: experienceId.includes('::') ? experienceId : `${experienceId}::LEGACY_CORE`,
    assumedVisitMode: null,
    humanEstimatedTime: null,
    narrativeRole: null,
    inclusionReason: null,
    omissionNotes: null,
  }))
}

export function validateFounderBenchmarkReview(doc: FounderBenchmarkReview): string[] {
  const errors: string[] = []
  if (doc.schemaVersion !== FOUNDER_BENCHMARK_REVIEW_SCHEMA) errors.push('INVALID_SCHEMA_VERSION')
  if (doc.frozenBaselineSha !== FEATURE_COMPLETE_ALPHA_FREEZE_SHA) errors.push('BASELINE_SHA_MISMATCH')
  if (!doc.benchmarkId) errors.push('MISSING_BENCHMARK_ID')
  if (!doc.travelerRequestFingerprint) errors.push('MISSING_TRAVELER_FINGERPRINT')
  if (!doc.engineRoute.runFingerprint) errors.push('MISSING_ENGINE_RUN_FINGERPRINT')
  return errors
}

export function exportFounderBenchmarkReviewJson(doc: FounderBenchmarkReview): string {
  return JSON.stringify(doc, null, 2) + '\n'
}
