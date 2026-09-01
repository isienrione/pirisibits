/**
 * Gate 2C — deterministic route explainability helpers.
 */

import type { NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import type { ThemeCode } from '@/src/lib/city-graph/types'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type { OmittedNodeReason, PhysicalTransition } from '@/src/engine/routes/route-types'

export function explainInclusion(args: {
  name: string
  matchedThemes: ThemeCode[]
  nodeUtility: number
  relationType: NarrativeRelationType | null
  tier: string | null
  role: string | null
  recentStructures: Array<'anchor' | 'pocket' | 'micro' | 'other'>
  remainingBudgetMin: number
  transition: PhysicalTransition | null
  isStart: boolean
}): string {
  if (args.isStart) {
    return `Start at ${args.name} (known physically eligible Launch30 node).`
  }
  const themes =
    args.matchedThemes.length > 0
      ? `strongly matches ${args.matchedThemes.slice(0, 2).join(' & ')}`
      : `utility ${Math.round(args.nodeUtility)}`
  const struct = classifyStructure(args.tier, args.role)
  const last = args.recentStructures[args.recentStructures.length - 1]
  let rhythm = 'continues the provisional sequence'
  if (struct === 'micro' && (last === 'anchor' || last === 'pocket')) {
    rhythm = 'adds a micro-reveal after larger stops'
  } else if (struct === 'anchor' && last === 'micro') {
    rhythm = 're-anchors the walk after finer-grain stops'
  } else if (args.relationType === 'contrast') {
    rhythm = 'provides useful contrast after the previous stop'
  } else if (args.relationType === 'relief') {
    rhythm = 'offers relief after higher-intensity stops'
  } else if (args.relationType === 'thematic_echo' || args.relationType === 'sets_up') {
    rhythm = 'extends thematic continuity from the previous stop'
  }
  const reach =
    args.transition == null
      ? 'within remaining time'
      : `reachable in ${args.transition.durationMin} min via ${args.transition.mode} with ${Math.round(args.remainingBudgetMin)} min remaining`
  return `Selected ${args.name} because it ${themes}, ${rhythm}, and is ${reach}.`
}

export function explainOmission(args: {
  stgoId: string
  displayName: string | null
  nodeUtility: number | null
  reasonCode: OmittedNodeReason['reasonCode']
  detail?: string
}): OmittedNodeReason {
  const name = args.displayName || args.stgoId
  const messages: Record<OmittedNodeReason['reasonCode'], string> = {
    PHYSICAL_STATUS_PENDING: `${name} is editorially interesting but physical edges are still pending enrichment.`,
    PHYSICAL_INELIGIBLE: `${name} fails physical route-generation eligibility on the frozen graph.`,
    EXCEEDS_REMAINING_BUDGET: `${name} would exceed the remaining time budget including dwell and transition.`,
    POOR_SEQUENCE_FIT: `${name} scored poorly as a next narrative/composition step after the current ArcState.`,
    REDUNDANT_WITH_SELECTED: `${name} is thematically redundant with a stronger already-selected stop.`,
    ACCESSIBILITY_CONSTRAINT: `${name} is incompatible with explicit step-free requirements (or only UNKNOWN, not verified).`,
    SENSITIVE_MEMORY_OPT_IN_MISSING: `${name} is an explicit sensitive-memory site and memorySitesOptIn is false.`,
    EXCESSIVE_DETOUR: `${name} requires an excessive physical detour for its marginal utility gain.`,
    COMPOSITION_IMBALANCE: `${name} would worsen anchor/pocket/micro rhythm balance.`,
    RUNTIME_EXCLUDED: `${name} is runtime-excluded from Launch30 routing.`,
    HARD_ELIGIBILITY: `${name} failed hard eligibility before scoring.`,
    NO_FEASIBLE_TRANSITION: `${name} has no feasible frozen walk/metro transition from the current stop.`,
    NOT_EXPANDED_IN_BEAM: `${name} remained outside the beam after pruning despite eligibility.`,
  }
  return {
    stgoId: args.stgoId,
    displayName: args.displayName,
    nodeUtility: args.nodeUtility,
    reasonCode: args.reasonCode,
    message: args.detail ? `${messages[args.reasonCode]} ${args.detail}` : messages[args.reasonCode],
  }
}

export function explainTradeoff(args: {
  rank: number
  intent: string
  score: number
  stopCount: number
  metroUsed: boolean
}): string {
  if (args.rank === 1) {
    return `Best balanced provisional score (${args.score}) under ${args.intent} intent with ${args.stopCount} stops${args.metroUsed ? ' using operational Metro' : ' on walk-only transitions'}.`
  }
  if (args.rank === 2) {
    return `Credible alternative emphasizing discovery/theme diversity while remaining within budget (score ${args.score}).`
  }
  return `Credible alternative emphasizing physical efficiency / essentials packing (score ${args.score}).`
}
