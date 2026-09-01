/**
 * Gate 2E.3.2-R — route-time & marginal-insertion diagnostics (read-only).
 *
 * Observes the pre-2E.4 search time model. Does not score, search, or select routes.
 * Diagnostic terminology for missing 2E.4 concepts is allowed; those concepts are NOT operative.
 */

import { DEFAULT_DWELL_FALLBACK_MIN } from '@/src/engine/routes/route-config'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { loadPhysicalGraphIndex, outgoingTransitions } from '@/src/engine/routes/route-physical'
import type { EngineNodeRecord } from '@/src/engine/types'
import type { RouteCandidateV01, RouteStopV01, TransportPolicy } from '@/src/engine/routes/route-types'
import type { RouteLabRunResult } from '@/src/dev/route-lab/runRouteLab'

export const ROUTE_TIME_DIAGNOSTIC_SCHEMA = 'santiago-route-time-ledger.v0.1' as const
export const INSERTION_ESTIMATE_LABEL = 'PRE_2E4_DIAGNOSTIC_INSERTION_ESTIMATE' as const

export const MISSING_TIME_CONCEPTS = [
  'VisitMode',
  'accessOverhead',
  'marginalInsertionBurden',
  'onPathness',
  'contentTimeVsStationaryTime',
  'optionalInteriorTime',
  'arrivalComplexity',
] as const

export type MissingTimeConceptKey = (typeof MISSING_TIME_CONCEPTS)[number]

export type DiagnosticAvailability = 'AVAILABLE' | 'UNKNOWN' | 'NOT_MODELED'

export type MissingTimeConceptDiagnostic = {
  key: MissingTimeConceptKey
  availability: 'NOT_MODELED'
  value: null
  note: string
}

export type RouteTimeLedgerEntry = {
  sequenceIndex: number
  stgoId: string
  stopName: string
  transitionIntoStopMin: number
  dwellMinutes: number
  cumulativeModeledMinutes: number
  arrivalMode: string
}

export type RouteTimeLedgerDiagnostic = {
  schemaVersion: typeof ROUTE_TIME_DIAGNOSTIC_SCHEMA
  timeModel: 'SUM_STOP_DWELL_PLUS_SUM_TRANSITION_DURATION'
  timeModelNote: string
  entries: RouteTimeLedgerEntry[]
  TOTAL_TRANSITION_MIN: number
  TOTAL_DWELL_MIN: number
  TOTAL_MODELED_MIN: number
  engineTotalEstimatedMin: number
  engineDwellMin: number
  engineMovementMin: number
  reconcilesExactly: boolean
}

export type OnPathDiagnosticClass = 'POTENTIALLY_ON_PATH' | 'POTENTIAL_DETOUR' | 'UNKNOWN'

export type MarginalInsertionDiagnostic = {
  label: typeof INSERTION_ESTIMATE_LABEL
  runtimeUsedBySearch: false
  A: string
  X: string
  B: string
  movementAX: { availability: DiagnosticAvailability; minutes: number | null }
  movementXB: { availability: DiagnosticAvailability; minutes: number | null }
  movementAB: { availability: DiagnosticAvailability; minutes: number | null }
  movementDelta: { availability: DiagnosticAvailability; minutes: number | null }
  currentEngineDwellX: { availability: DiagnosticAvailability; minutes: number | null }
  diagnosticKnownInsertionBurden: { availability: DiagnosticAvailability; minutes: number | null }
  onPathClassification: OnPathDiagnosticClass
  onPathClassificationNote: string
}

export type InsertionSlot = { index: number; A: string; B: string; aName: string; bName: string }
export type InsertionCandidate = { stgoId: string; name: string; source: 'omitted' | 'composed_candidate' | 'concern_target' }

export type TimeInsertionDiagnostics = {
  ledger: RouteTimeLedgerDiagnostic
  missingConcepts: MissingTimeConceptDiagnostic[]
  insertionSlots: InsertionSlot[]
  insertionCandidates: InsertionCandidate[]
  transitionMinutes: Record<string, number>
  dwellMinutesById: Record<string, number | null>
  defaultInsertion: MarginalInsertionDiagnostic | null
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function currentEngineDwellMinutes(node: EngineNodeRecord | undefined): number | null {
  if (!node) return null
  const typical = node.visitDurationMinutes ?? node.visitTimeTypical ?? null
  if (typical != null && Number.isFinite(typical)) return Number(typical)
  return DEFAULT_DWELL_FALLBACK_MIN
}

export function buildRouteTimeLedger(candidate: RouteCandidateV01): RouteTimeLedgerDiagnostic {
  const entries: RouteTimeLedgerEntry[] = candidate.orderedStops.map((s: RouteStopV01) => ({
    sequenceIndex: s.sequenceIndex,
    stgoId: s.stgoId,
    stopName: s.name,
    transitionIntoStopMin: s.transitionTimeMin,
    dwellMinutes: s.estimatedDwellMin,
    cumulativeModeledMinutes: s.cumulativeTimeMin,
    arrivalMode: s.arrivalMode,
  }))
  const TOTAL_TRANSITION_MIN = round1(entries.reduce((s, e) => s + e.transitionIntoStopMin, 0))
  const TOTAL_DWELL_MIN = round1(entries.reduce((s, e) => s + e.dwellMinutes, 0))
  const TOTAL_MODELED_MIN = round1(TOTAL_TRANSITION_MIN + TOTAL_DWELL_MIN)
  return {
    schemaVersion: ROUTE_TIME_DIAGNOSTIC_SCHEMA,
    timeModel: 'SUM_STOP_DWELL_PLUS_SUM_TRANSITION_DURATION',
    timeModelNote:
      'V0.1 beam search (src/engine/routes/route-search.ts) sets elapsed += transition.durationMin + dwellMinutes(node) at each expansion. Start stop contributes dwell only (transition 0). Dwell is visitDurationMinutes/visitTimeTypical, else DEFAULT_DWELL_FALLBACK_MIN (12). No VisitMode, access overhead, or marginal insertion.',
    entries,
    TOTAL_TRANSITION_MIN,
    TOTAL_DWELL_MIN,
    TOTAL_MODELED_MIN,
    engineTotalEstimatedMin: candidate.totalEstimatedMin,
    engineDwellMin: candidate.dwellMin,
    engineMovementMin: candidate.movementMin,
    reconcilesExactly:
      TOTAL_MODELED_MIN === candidate.totalEstimatedMin &&
      TOTAL_TRANSITION_MIN === candidate.movementMin &&
      TOTAL_DWELL_MIN === candidate.dwellMin,
  }
}

export function missingTimeConceptDiagnostics(): MissingTimeConceptDiagnostic[] {
  const notes: Record<MissingTimeConceptKey, string> = {
    VisitMode: 'VisitMode is not a runtime field. NOT_MODELED ≠ 0.',
    accessOverhead: 'Access overhead is not an executable route cost. NOT_MODELED ≠ 0.',
    marginalInsertionBurden: 'Runtime search costs adding X as transition(into X)+dwell(X), not A→X→B minus A→B. NOT_MODELED in runtime.',
    onPathness: 'onPath is not a runtime insertion field. Diagnostic classification below is not production semantics.',
    contentTimeVsStationaryTime: 'Content time vs stationary time is not separated. NOT_MODELED ≠ 0.',
    optionalInteriorTime: 'Optional interior time is not modeled. NOT_MODELED ≠ 0.',
    arrivalComplexity: 'Arrival complexity is not modeled. NOT_MODELED ≠ 0.',
  }
  return MISSING_TIME_CONCEPTS.map((key) => ({
    key,
    availability: 'NOT_MODELED',
    value: null,
    note: notes[key],
  }))
}

export function lookupExistingTransitionMinutes(
  fromStgoId: string,
  toStgoId: string,
  transportPolicy: TransportPolicy,
  root: string,
): number | null {
  const physical = loadPhysicalGraphIndex(root)
  const list = outgoingTransitions(physical, fromStgoId, transportPolicy, physical.physicallyEligibleIds)
  const t = list.find((x) => x.toStgoId === toStgoId)
  return t ? t.durationMin : null
}

function transitionField(minutes: number | null): { availability: DiagnosticAvailability; minutes: number | null } {
  if (minutes == null) return { availability: 'UNKNOWN', minutes: null }
  return { availability: 'AVAILABLE', minutes }
}

/**
 * Diagnostic-only A→X→B movement delta. Not Experience-Time EMT. Not used by search.
 * onPath classification is a heuristic on raw movementDelta (round1 quantum), not a production threshold.
 */
export function diagnoseMarginalInsertion(args: {
  A: string
  X: string
  B: string
  transportPolicy: TransportPolicy
  dwellX: number | null
  root: string
}): MarginalInsertionDiagnostic {
  const ax = lookupExistingTransitionMinutes(args.A, args.X, args.transportPolicy, args.root)
  const xb = lookupExistingTransitionMinutes(args.X, args.B, args.transportPolicy, args.root)
  const ab = lookupExistingTransitionMinutes(args.A, args.B, args.transportPolicy, args.root)
  const movementAX = transitionField(ax)
  const movementXB = transitionField(xb)
  const movementAB = transitionField(ab)
  let movementDelta: { availability: DiagnosticAvailability; minutes: number | null } = {
    availability: 'UNKNOWN',
    minutes: null,
  }
  if (ax != null && xb != null && ab != null) {
    movementDelta = { availability: 'AVAILABLE', minutes: round1(ax + xb - ab) }
  }
  const currentEngineDwellX =
    args.dwellX == null
      ? { availability: 'UNKNOWN' as const, minutes: null }
      : { availability: 'AVAILABLE' as const, minutes: args.dwellX }
  const diagnosticKnownInsertionBurden =
    movementDelta.availability === 'AVAILABLE' && currentEngineDwellX.availability === 'AVAILABLE'
      ? {
          availability: 'AVAILABLE' as const,
          minutes: round1((movementDelta.minutes ?? 0) + (currentEngineDwellX.minutes ?? 0)),
        }
      : { availability: 'UNKNOWN' as const, minutes: null }

  let onPathClassification: OnPathDiagnosticClass = 'UNKNOWN'
  if (movementDelta.availability === 'AVAILABLE' && movementDelta.minutes != null) {
    onPathClassification = movementDelta.minutes <= 0.1 ? 'POTENTIALLY_ON_PATH' : 'POTENTIAL_DETOUR'
  }

  return {
    label: INSERTION_ESTIMATE_LABEL,
    runtimeUsedBySearch: false,
    A: args.A,
    X: args.X,
    B: args.B,
    movementAX,
    movementXB,
    movementAB,
    movementDelta,
    currentEngineDwellX,
    diagnosticKnownInsertionBurden,
    onPathClassification,
    onPathClassificationNote:
      'Diagnostic heuristic only: movementDelta ≤ 0.1 min (engine round1 quantum) → POTENTIALLY_ON_PATH; otherwise POTENTIAL_DETOUR. Not a production onPath threshold. Raw movementDelta is authoritative.',
  }
}

export function buildTimeInsertionDiagnostics(args: {
  candidate: RouteCandidateV01
  lab: RouteLabRunResult
  root: string
}): TimeInsertionDiagnostics {
  const ledger = buildRouteTimeLedger(args.candidate)
  const stops = args.candidate.orderedStops
  const used = new Set(stops.map((s) => s.stgoId))
  const insertionSlots: InsertionSlot[] = []
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i]!
    const b = stops[i + 1]!
    insertionSlots.push({ index: i, A: a.stgoId, B: b.stgoId, aName: a.name, bName: b.name })
  }

  const insertionCandidates: InsertionCandidate[] = []
  const seen = new Set<string>()
  const addCand = (stgoId: string, name: string, source: InsertionCandidate['source']) => {
    if (used.has(stgoId) || seen.has(stgoId)) return
    seen.add(stgoId)
    insertionCandidates.push({ stgoId, name, source })
  }
  for (const o of args.candidate.omittedHighUtilityNodes) {
    addCand(o.stgoId, o.displayName || o.stgoId, 'omitted')
  }
  for (const c of args.lab.composed.candidates) {
    for (const s of c.orderedStops) {
      addCand(s.stgoId, s.name, 'composed_candidate')
    }
  }
  for (const id of ['STGO_92', 'STGO_03'] as const) {
    if (!used.has(id)) addCand(id, id, 'concern_target')
  }

  const nodes = loadLaunchNodes(args.root)
  const byId = new Map(nodes.map((n) => [n.stgoId, n]))
  const dwellMinutesById: Record<string, number | null> = {}
  const ids = [...used, ...insertionCandidates.map((c) => c.stgoId)]
  for (const id of ids) {
    const onRoute = stops.find((s) => s.stgoId === id)
    dwellMinutesById[id] = onRoute ? onRoute.estimatedDwellMin : currentEngineDwellMinutes(byId.get(id))
  }

  const policy = args.candidate.requestSnapshot.transportPolicy
  const physical = loadPhysicalGraphIndex(args.root)
  const transitionMinutes: Record<string, number> = {}
  const fromIds = [...used]
  const toIds = [...new Set([...used, ...insertionCandidates.map((c) => c.stgoId)])]
  for (const from of fromIds) {
    const list = outgoingTransitions(physical, from, policy, physical.physicallyEligibleIds)
    for (const t of list) {
      if (!toIds.includes(t.toStgoId) && !insertionCandidates.some((c) => c.stgoId === t.toStgoId)) continue
      transitionMinutes[`${from}>${t.toStgoId}`] = t.durationMin
    }
  }
  for (const cand of insertionCandidates) {
    const list = outgoingTransitions(physical, cand.stgoId, policy, physical.physicallyEligibleIds)
    for (const t of list) {
      if (!used.has(t.toStgoId)) continue
      transitionMinutes[`${cand.stgoId}>${t.toStgoId}`] = t.durationMin
    }
  }

  let defaultInsertion: MarginalInsertionDiagnostic | null = null
  const slot = insertionSlots[0]
  const cand = insertionCandidates[0]
  if (slot && cand) {
    defaultInsertion = diagnoseMarginalInsertion({
      A: slot.A,
      X: cand.stgoId,
      B: slot.B,
      transportPolicy: policy,
      dwellX: dwellMinutesById[cand.stgoId] ?? null,
      root: args.root,
    })
  }

  return {
    ledger,
    missingConcepts: missingTimeConceptDiagnostics(),
    insertionSlots,
    insertionCandidates,
    transitionMinutes,
    dwellMinutesById,
    defaultInsertion,
  }
}

export type BanderaMonedaCase = {
  stgoId: 'STGO_92' | 'STGO_03'
  displayName: string
  scenarioId: string
  selected: boolean
  omission: { reasonCode: string; message: string } | null
  reconstructable: boolean
}

export type BanderaMonedaReconstruction = {
  historicalConclusionSurvives: true
  exactScenarioLost: true
  reproducesOriginalDiagnostic: false
  STGO_92: {
    name: 'Paseo Bandera'
    status: 'NO_RECONSTRUCTABLE_CASE' | 'ENGINE_OMISSION_EXPLAINED'
    note: string
    cases: BanderaMonedaCase[]
  }
  STGO_03: {
    name: 'La Moneda'
    status: 'ENGINE_OMISSION_EXPLAINED' | 'NO_RECONSTRUCTABLE_CASE'
    note: string
    cases: BanderaMonedaCase[]
  }
}

export function reconstructBanderaMoneda(args: {
  scenarioId: string
  candidate: RouteCandidateV01
}): { bandera: BanderaMonedaCase; moneda: BanderaMonedaCase } {
  const used = new Set(args.candidate.orderedStops.map((s) => s.stgoId))
  const omitOf = (id: string) => args.candidate.omittedHighUtilityNodes.find((o) => o.stgoId === id)
  const one = (id: 'STGO_92' | 'STGO_03', displayName: string): BanderaMonedaCase => {
    const selected = used.has(id)
    const o = omitOf(id)
    return {
      stgoId: id,
      displayName,
      scenarioId: args.scenarioId,
      selected,
      omission: o ? { reasonCode: o.reasonCode, message: o.message } : null,
      reconstructable: !selected && Boolean(o),
    }
  }
  return {
    bandera: one('STGO_92', 'Paseo Bandera Urban Art Corridor'),
    moneda: one('STGO_03', 'Palacio de La Moneda'),
  }
}
