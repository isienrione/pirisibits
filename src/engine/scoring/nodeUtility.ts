/**
 * Gate 2A / 2A.1 — deterministic NodeUtility + YourMatch.
 *
 * YourMatch = traveler-specific fit (interest + structural + discovery components).
 * NodeUtility = editorial ChronoWorth/role + YourMatch + context.
 * ChronoWorth remains traveler-independent.
 */

import type { ModeCode, ThemeCode } from '@/src/lib/city-graph/types'
import {
  CHRONOWORTH_BLEND,
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
import { THEME_CODES } from '@/src/engine/taxonomy'
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

function effectiveChronoWorth(node: EngineNodeRecord): number | null {
  if (node.chronoWorthApproved != null) return node.chronoWorthApproved
  if (node.chronoWorth != null) return node.chronoWorth
  if (node.chronoWorthEffective != null) return node.chronoWorthEffective
  if (node.chronoWorthProposed != null) return node.chronoWorthProposed
  return null
}

function editorialComponent(node: EngineNodeRecord): ScoreComponent {
  const role = node.editorialRole
  const roleScore = role != null ? (EDITORIAL_ROLE_SCORES[role] ?? EDITORIAL_ROLE_FALLBACK) : EDITORIAL_ROLE_FALLBACK
  const max = COMPONENT_CAPS.editorial
  const worth = effectiveChronoWorth(node)

  if (worth == null) {
    const value = round1((roleScore / 22) * max * 0.45)
    return {
      key: 'editorial',
      value,
      max,
      available: false,
      provenance: 'CHRONOWORTH_MISSING; role soft signal only',
      details: { chronoWorth: null, role, roleScore },
    }
  }

  const w = Math.max(0, Math.min(100, worth))
  const blended = w * CHRONOWORTH_BLEND + (roleScore / 22) * 100 * ROLE_BLEND
  const value = round1((blended / 100) * max)
  const approved = node.chronoWorthApproved != null
  return {
    key: 'editorial',
    value,
    max,
    available: true,
    provenance: approved
      ? 'CURATOR_APPROVED chronoWorth + role blend'
      : `${node.chronoWorthProvenance ?? 'AI_PROPOSED_UNVERIFIED'} chronoWorth + role blend`,
    details: {
      chronoWorth: w,
      approved,
      proposed: node.chronoWorthProposed ?? null,
      role,
      roleScore,
      blended: round1(blended),
    },
  }
}

function nodeVector(node: EngineNodeRecord): Record<ThemeCode, number> {
  const out = Object.fromEntries(THEME_CODES.map((c) => [c, 0])) as Record<ThemeCode, number>
  if (node.thematicVector) {
    THEME_CODES.forEach((c) => {
      out[c] = Math.max(0, Math.min(1, Number(node.thematicVector?.[c] ?? 0)))
    })
    return out
  }
  // Fallback: binary tags → 0.7 (should be rare after 2A.1)
  ;(node.themes || []).forEach((t) => {
    if (t in out) out[t] = 0.7
  })
  return out
}

function interestComponent(
  node: EngineNodeRecord,
  traveler: TravelerModel,
): { component: ScoreComponent; matched: ThemeCode[]; contributions: Partial<Record<ThemeCode, number>>; yourMatchInterest: number } {
  const max = COMPONENT_CAPS.interests
  const vector = nodeVector(node)
  const contributions: Partial<Record<ThemeCode, number>> = {}
  let raw = 0
  let weightSum = 0
  THEME_CODES.forEach((t) => {
    const w = traveler.themeWeights[t] || 0
    weightSum += w
    const strength = vector[t] || 0
    const part = w * strength
    if (w > 0 && strength > 0) contributions[t] = round1(part)
    raw += part
  })
  const matched = THEME_CODES.filter((t) => (traveler.themeWeights[t] || 0) > 0 && (vector[t] || 0) > 0)
  const denom = Math.max(weightSum, 1e-9)
  const normalized = raw / denom
  const value = weightSum <= 0 ? 0 : round1(normalized * max)
  return {
    matched,
    contributions,
    yourMatchInterest: value,
    component: {
      key: 'interests',
      value,
      max,
      available: Object.values(vector).some((v) => v > 0),
      provenance: node.thematicVector
        ? 'continuous thematicVector · traveler_weight × node_strength'
        : 'binary theme fallback 0.7',
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
  const targets = travelerModeTargets(traveler)
  const suit = node.structuralSuitability

  if (targets.length === 0) {
    return {
      key: 'structural',
      value: STRUCTURAL_MODE_PARTIAL,
      max,
      available: Boolean(suit),
      provenance: 'No structural traveler modes asserted; partial neutral',
    }
  }

  let scoreSum = 0
  let considered = 0
  targets.forEach((m) => {
    const entry = suit?.[m]
    if (!entry) return
    if (entry.value == null || entry.status === 'UNKNOWN') {
      // M2 UNKNOWN never counted as fit
      return
    }
    considered += 1
    scoreSum += Math.max(0, Math.min(1, entry.value))
  })

  if (considered === 0) {
    // Fall back to explicit modes tags if suitability missing
    const nodeModes = new Set((node.modes || []) as ModeCode[])
    const hits = targets.filter((m) => nodeModes.has(m)).length
    if (hits === 0) {
      const value =
        traveler.expressPreference && node.visitDurationMinutes == null
          ? EXPRESS_UNKNOWN_VISIT_CONTRIBUTION
          : STRUCTURAL_MODE_MISS
      return {
        key: 'structural',
        value,
        max,
        available: false,
        provenance: 'structural suitability unavailable/UNKNOWN for requested modes',
      }
    }
    const ratio = hits / targets.length
    return {
      key: 'structural',
      value: round1(Math.min(max, ratio >= 1 ? STRUCTURAL_MODE_HIT : STRUCTURAL_MODE_PARTIAL)),
      max,
      available: true,
      provenance: 'fallback node.modes ∩ traveler modes',
    }
  }

  const avg = scoreSum / Math.max(targets.length, 1)
  return {
    key: 'structural',
    value: round1(avg * max),
    max,
    available: true,
    provenance: 'structuralSuitability continuous values (UNKNOWN excluded)',
    details: { considered, avg: round1(avg), targets: targets.join(',') },
  }
}

function discoveryComponent(node: EngineNodeRecord, traveler: TravelerModel): ScoreComponent {
  const max = COMPONENT_CAPS.discovery
  const role = node.editorialRole
  const tier = node.tierNormalized
  let value = 0
  const posture = traveler.discoveryPosture
  if (posture === 'D3') {
    if (role === 'anchor' || role === 'civic' || role === 'museum' || tier === 'canonical_anchor') {
      value += DISCOVERY_ADJUSTMENTS.D3_anchorBoost
    }
    if (role === 'micro' || tier === 'micro_reveal') value += DISCOVERY_ADJUSTMENTS.D3_microPenalty
  } else if (posture === 'D2') {
    if (role === 'micro' || role === 'pocket' || tier === 'micro_reveal') {
      value += DISCOVERY_ADJUSTMENTS.D2_microBoost
    }
    if (role === 'anchor' || tier === 'canonical_anchor') value += DISCOVERY_ADJUSTMENTS.D2_anchorSoft
  } else {
    value += DISCOVERY_ADJUSTMENTS.D1_balanced
  }
  return {
    key: 'discovery',
    value: round1(clamp(value, 0, max)),
    max,
    available: role != null || tier != null,
    provenance: `Discovery posture ${posture} × role/tier`,
    details: { posture, role: role ?? null, tier: tier ?? null },
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
    provenance: 'EvaluationContext only; no physical centrality',
    details: { alreadyVisited: visited.has(node.stgoId) },
  }
}

export type NodeUtilityWithMatch = NodeUtilityResult

export function scoreNodeUtility(
  node: EngineNodeRecord,
  traveler: TravelerModel,
  context: EvaluationContext = {},
): NodeUtilityResult {
  const eligibility = evaluateNodeEligibility(node, traveler, context)
  const editorial = editorialComponent(node)
  const { component: interests, matched, contributions, yourMatchInterest } = interestComponent(node, traveler)
  const structural = structuralComponent(node, traveler)
  const discovery = discoveryComponent(node, traveler)
  const ctx = contextComponent(node, traveler, context)

  const yourMatch = round1(clamp(yourMatchInterest + structural.value + discovery.value))
  const utility = eligibility.eligible
    ? round1(clamp(editorial.value + interests.value + structural.value + discovery.value + ctx.value))
    : 0

  return {
    nodeId: node.stgoId,
    displayName: node.displayName,
    eligible: eligibility.eligible,
    utility,
    yourMatch,
    chronoWorthEffective: effectiveChronoWorth(node),
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
      chronoWorth: effectiveChronoWorth(node) == null ? 'MISSING' : node.chronoWorthApproved != null ? 'PRESENT' : 'PARTIAL',
      themes: node.thematicVector ? 'PRESENT' : (node.themes || []).length ? 'PARTIAL' : 'MISSING',
      modes: node.structuralSuitability ? 'PARTIAL' : (node.modes || []).length ? 'PARTIAL' : 'MISSING',
      editorialRole: node.editorialRole == null ? 'MISSING' : 'PRESENT',
      visitDuration: node.visitDurationMinutes == null ? 'MISSING' : 'PARTIAL',
      accessibility:
        node.accessibility === 'UNKNOWN' || node.accessibility == null
          ? 'UNKNOWN'
          : 'PRESENT',
      openingHours: node.openingHours == null ? 'MISSING' : 'PRESENT',
    },
  }
}
