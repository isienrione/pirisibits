/**
 * Gate 2A — deterministic NodeUtility scorer.
 * Does not use physical centrality, NarrativeEdgeScore, or route composition.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'
import {
  CHRONOWORTH_BLEND,
  CHRONOWORTH_MISSING_CONTRIBUTION,
  COMPONENT_CAPS,
  CONTEXT_ALREADY_VISITED_PENALTY,
  DISCOVERY_ADJUSTMENTS,
  EDITORIAL_ROLE_FALLBACK,
  EDITORIAL_ROLE_SCORES,
  EXPRESS_UNKNOWN_VISIT_CONTRIBUTION,
  NODE_UTILITY_MAX,
  NODE_UTILITY_MIN,
  ROLE_BLEND,
  STRUCTURAL_MODE_HIT,
  STRUCTURAL_MODE_MISS,
  STRUCTURAL_MODE_PARTIAL,
} from '@/src/engine/scoring/constants'
import { evaluateNodeEligibility } from '@/src/engine/eligibility/evaluateNodeEligibility'
import type {
  EngineNodeRecord,
  EvaluationContext,
  NodeUtilityResult,
  ScoreComponent,
  TravelerModel,
} from '@/src/engine/types'

function clamp(n: number, lo = NODE_UTILITY_MIN, hi = NODE_UTILITY_MAX): number {
  return Math.max(lo, Math.min(hi, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function editorialComponent(node: EngineNodeRecord): ScoreComponent {
  const role = node.editorialRole
  const roleScore = role != null ? (EDITORIAL_ROLE_SCORES[role] ?? EDITORIAL_ROLE_FALLBACK) : EDITORIAL_ROLE_FALLBACK
  const max = COMPONENT_CAPS.editorial

  if (node.chronoWorth == null) {
    // Role-only soft signal; ChronoWorth missing stays explicit (not a fake curated mid).
    const value = round1((roleScore / 22) * max * 0.45)
    return {
      key: 'editorial',
      value,
      max,
      available: false,
      provenance: 'CHRONOWORTH_MISSING; role soft signal only (not curator ChronoWorth)',
      details: {
        chronoWorth: null,
        role: role,
        roleScore,
        missingContribution: CHRONOWORTH_MISSING_CONTRIBUTION,
      },
    }
  }

  const worth = Math.max(0, Math.min(100, node.chronoWorth))
  const blended = worth * CHRONOWORTH_BLEND + (roleScore / 22) * 100 * ROLE_BLEND
  const value = round1((blended / 100) * max)
  return {
    key: 'editorial',
    value,
    max,
    available: true,
    provenance: 'chronoWorth editorial + role blend',
    details: { chronoWorth: worth, role, roleScore, blended: round1(blended) },
  }
}

function interestComponent(
  node: EngineNodeRecord,
  traveler: TravelerModel,
): { component: ScoreComponent; matched: ThemeCode[]; contributions: Partial<Record<ThemeCode, number>> } {
  const max = COMPONENT_CAPS.interests
  const themes = (node.themes || []) as ThemeCode[]
  const contributions: Partial<Record<ThemeCode, number>> = {}
  let raw = 0
  let weightSum = 0
  ;(Object.keys(traveler.themeWeights) as ThemeCode[]).forEach((t) => {
    weightSum += traveler.themeWeights[t] || 0
  })
  themes.forEach((t) => {
    const w = traveler.themeWeights[t] || 0
    contributions[t] = w
    raw += w
  })
  const matched = themes.filter((t) => (traveler.themeWeights[t] || 0) > 0)
  const denom = Math.max(weightSum, 1e-9)
  const normalized = raw / denom
  const value = themes.length === 0 ? 0 : round1(normalized * max)
  return {
    matched,
    contributions,
    component: {
      key: 'interests',
      value,
      max,
      available: themes.length > 0,
      provenance: themes.length ? 'ThemeCode tag overlap with traveler themeWeights' : 'NODE_THEMES_MISSING',
      details: { raw: round1(raw), weightSum: round1(weightSum), normalized: round1(normalized) },
    },
  }
}

function travelerModeTargets(traveler: TravelerModel): ModeCode[] {
  const modes: ModeCode[] = []
  if (traveler.expressPreference) modes.push('M1')
  if (traveler.stepFreeRequired) modes.push('M2')
  if (traveler.familyContext) modes.push('M3')
  if (traveler.nightContext) modes.push('M4')
  if (traveler.highComfort) modes.push('M5')
  if (traveler.mobilityArchetype === 'M1') modes.push('M1')
  if (traveler.mobilityArchetype === 'M2') modes.push('M2')
  if (traveler.mobilityArchetype === 'M3') modes.push('M3')
  if (traveler.mobilityArchetype === 'M4') modes.push('M4')
  if (traveler.mobilityArchetype === 'M5') modes.push('M5')
  return Array.from(new Set(modes))
}

function structuralComponent(node: EngineNodeRecord, traveler: TravelerModel): ScoreComponent {
  const max = COMPONENT_CAPS.structural
  const nodeModes = new Set((node.modes || []) as ModeCode[])
  const targets = travelerModeTargets(traveler)
  if (targets.length === 0) {
    return {
      key: 'structural',
      value: STRUCTURAL_MODE_PARTIAL,
      max,
      available: nodeModes.size > 0,
      provenance: 'No structural traveler modes asserted; partial neutral',
      details: { nodeModes: Array.from(nodeModes).join(',') },
    }
  }

  let hits = 0
  targets.forEach((m) => {
    if (nodeModes.has(m)) hits += 1
  })
  const ratio = hits / targets.length
  let value = STRUCTURAL_MODE_MISS
  if (hits === 0) {
    // Express preference with UNKNOWN visit duration stays zero-neutral (no invented short dwell).
    if (traveler.expressPreference && node.visitDurationMinutes == null && node.timeCostMinutes == null) {
      value = EXPRESS_UNKNOWN_VISIT_CONTRIBUTION
    } else {
      value = STRUCTURAL_MODE_MISS
    }
  } else if (ratio >= 1) {
    value = STRUCTURAL_MODE_HIT
  } else {
    value = STRUCTURAL_MODE_PARTIAL
  }

  return {
    key: 'structural',
    value: round1(Math.min(max, value)),
    max,
    available: nodeModes.size > 0,
    provenance: 'Explicit node.modes ∩ traveler structural preferences only; no vibe inference',
    details: {
      targets: targets.join(','),
      nodeModes: Array.from(nodeModes).join(','),
      hits,
    },
  }
}

function discoveryComponent(node: EngineNodeRecord, traveler: TravelerModel): ScoreComponent {
  const max = COMPONENT_CAPS.discovery
  const role = node.editorialRole
  let value = 0
  const posture = traveler.discoveryPosture
  if (posture === 'D3') {
    if (role === 'anchor' || role === 'civic' || role === 'museum') value += DISCOVERY_ADJUSTMENTS.D3_anchorBoost
    if (role === 'micro') value += DISCOVERY_ADJUSTMENTS.D3_microPenalty
  } else if (posture === 'D2') {
    if (role === 'micro' || role === 'pocket') value += DISCOVERY_ADJUSTMENTS.D2_microBoost
    if (role === 'anchor') value += DISCOVERY_ADJUSTMENTS.D2_anchorSoft
  } else {
    value += DISCOVERY_ADJUSTMENTS.D1_balanced
  }
  return {
    key: 'discovery',
    value: round1(clamp(value, 0, max)),
    max,
    available: role != null,
    provenance: `Discovery posture ${posture} × editorialRole (not route order)`,
    details: { posture, role },
  }
}

function contextComponent(
  node: EngineNodeRecord,
  _traveler: TravelerModel,
  context: EvaluationContext,
): ScoreComponent {
  const max = COMPONENT_CAPS.context
  let value = 0
  const visited = new Set(context.alreadyVisitedStgoIds ?? [])
  if (visited.has(node.stgoId) && !context.hardExcludeVisited) {
    value += CONTEXT_ALREADY_VISITED_PENALTY
  }
  return {
    key: 'context',
    value: round1(clamp(value, -max, max)),
    max,
    available: true,
    provenance: 'EvaluationContext only (visited soft demotion); no physical centrality',
    details: { alreadyVisited: visited.has(node.stgoId) },
  }
}

export function scoreNodeUtility(
  node: EngineNodeRecord,
  traveler: TravelerModel,
  context: EvaluationContext = {},
): NodeUtilityResult {
  const eligibility = evaluateNodeEligibility(node, traveler, context)
  const editorial = editorialComponent(node)
  const { component: interests, matched, contributions } = interestComponent(node, traveler)
  const structural = structuralComponent(node, traveler)
  const discovery = discoveryComponent(node, traveler)
  const ctx = contextComponent(node, traveler, context)

  const utility = eligibility.eligible
    ? round1(
        clamp(
          editorial.value + interests.value + structural.value + discovery.value + ctx.value,
        ),
      )
    : 0

  return {
    nodeId: node.stgoId,
    displayName: node.displayName,
    eligible: eligibility.eligible,
    utility,
    components: {
      editorial,
      interests,
      structural,
      discovery,
      context: ctx,
    },
    matchedThemes: matched,
    themeContributions: contributions,
    structuralModesConsidered: travelerModeTargets(traveler),
    hardFailures: eligibility.hardFailures,
    warnings: eligibility.warnings,
    provenance: {
      chronoWorth: node.chronoWorth == null ? 'MISSING' : 'PRESENT',
      themes: (node.themes || []).length ? 'PRESENT' : 'MISSING',
      modes: (node.modes || []).length ? (node.modes!.length <= 1 ? 'PARTIAL' : 'PRESENT') : 'MISSING',
      editorialRole: node.editorialRole == null ? 'MISSING' : 'PRESENT',
      visitDuration:
        node.visitDurationMinutes == null && node.timeCostMinutes == null ? 'MISSING' : 'PRESENT',
      accessibility:
        node.accessibility == null && node.stepFree == null && node.step_free_certified == null
          ? 'UNKNOWN'
          : 'PRESENT',
      openingHours: node.openingHours == null ? 'MISSING' : 'PRESENT',
    },
  }
}
