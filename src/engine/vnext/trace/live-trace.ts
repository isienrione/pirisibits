/**
 * Gate 2E.6 — Live thinking trace (deterministic telemetry, not chain-of-thought).
 */

export type TraceStage =
  | 'TRAVELER_MODEL'
  | 'CONTEXT'
  | 'HARD_FEASIBILITY'
  | 'EXPERIENCE_VALUE'
  | 'ROUTE_EXPANSION'
  | 'ARCSTATE_UPDATE'
  | 'TIME_UPDATE'
  | 'CANDIDATE_COMPLETE'
  | 'ARCQUALITY'
  | 'ARBITRATION'
  | 'EXPLANATION'

export type TraceEvent = {
  order: number
  stage: TraceStage
  inputRefs?: string[]
  decision: string
  topAlternatives?: string[]
  reasonComponents: Record<string, unknown>
  unknowns: string[]
  provenance: string
  stateAfter?: Record<string, unknown>
}

export type LiveTrace = {
  schemaVersion: 'live-trace.v0.1'
  events: TraceEvent[]
}

export function createLiveTrace(): LiveTrace {
  return { schemaVersion: 'live-trace.v0.1', events: [] }
}

export function appendTraceEvent(
  trace: LiveTrace,
  event: Omit<TraceEvent, 'order'>,
): void {
  trace.events.push({ ...event, order: trace.events.length + 1 })
}

export function assertTraceCompleteness(trace: LiveTrace): { ok: boolean; missing: TraceStage[] } {
  const required: TraceStage[] = [
    'TRAVELER_MODEL',
    'CONTEXT',
    'HARD_FEASIBILITY',
    'EXPERIENCE_VALUE',
    'ROUTE_EXPANSION',
    'ARCSTATE_UPDATE',
    'TIME_UPDATE',
    'CANDIDATE_COMPLETE',
    'ARCQUALITY',
    'ARBITRATION',
    'EXPLANATION',
  ]
  const present = new Set(trace.events.map((e) => e.stage))
  const missing = required.filter((s) => !present.has(s))
  return { ok: missing.length === 0, missing }
}
