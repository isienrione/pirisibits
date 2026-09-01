/**
 * Gate 2A — deterministic candidate pool (NOT a route).
 */

import { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
import type {
  CandidatePool,
  CandidatePoolItem,
  EngineNodeRecord,
  EvaluationContext,
  TravelerModel,
} from '@/src/engine/types'

function compareCandidates(a: CandidatePoolItem, b: CandidatePoolItem): number {
  if (b.utility !== a.utility) return b.utility - a.utility
  // Deterministic tie-break: canonical STGO ID ascending.
  return a.nodeId.localeCompare(b.nodeId)
}

export function buildCandidatePool(
  nodes: EngineNodeRecord[],
  traveler: TravelerModel,
  context: EvaluationContext = {},
): CandidatePool {
  const ctx: EvaluationContext = { launchCorpusOnly: true, ...context }
  const launch = nodes.filter((n) => n.launchCorpus)
  const backlogLeak = nodes.filter((n) => !n.launchCorpus)
  // Evaluate launch only for traveler-facing pool.
  const scored = launch.map((node) => {
    const result = scoreNodeUtility(node, traveler, ctx)
    return {
      ...result,
      rank: 0,
      disposition: node.launchRuntimeDisposition ?? null,
    } satisfies CandidatePoolItem
  })

  const excludedIds = scored.filter((s) => !s.eligible).map((s) => s.nodeId).sort()
  const eligible = scored.filter((s) => s.eligible).sort(compareCandidates)
  const candidates = eligible.map((item, i) => ({ ...item, rank: i + 1 }))

  return {
    gate: '2A',
    travelerSummary: {
      interests: traveler.interests,
      discoveryPosture: traveler.discoveryPosture,
      stepFreeRequired: traveler.stepFreeRequired,
      timeBudgetMinutes: traveler.timeBudgetMinutes,
    },
    evaluatedLaunchCount: launch.length,
    eligibleCount: candidates.length,
    excludedIds,
    backlogLeakCount: backlogLeak.length, // informational; never scored into pool
    candidates,
  }
}
