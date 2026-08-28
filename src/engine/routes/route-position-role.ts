/**
 * Gate 2D — provisional route-position roles (contextual, not POI metadata).
 */

import type { NarrativeRelationType } from '@/src/engine/narrative/narrative-types'
import type { RouteStopV01 } from '@/src/engine/routes/route-types'
import { classifyStructure } from '@/src/engine/routes/route-score'

export type RoutePositionRole =
  | 'OPENER'
  | 'ORIENTATION'
  | 'DEVELOPMENT'
  | 'CONTRAST'
  | 'REVEAL'
  | 'BREATHER'
  | 'CLIMAX'
  | 'LANDING'

export type RoutePositionRoleAssignment = {
  stgoId: string
  sequenceIndex: number
  role: RoutePositionRole
  rationale: string
}

function isRevealRelation(r: NarrativeRelationType | null): boolean {
  return r === 'reveal' || r === 'resolves_question'
}

function isContrastRelation(r: NarrativeRelationType | null): boolean {
  return r === 'contrast' || r === 'relief'
}

function isDevelopmentRelation(r: NarrativeRelationType | null): boolean {
  return (
    r === 'sets_up' ||
    r === 'deepens_context' ||
    r === 'causal_followup' ||
    r === 'escalation' ||
    r === 'thematic_echo'
  )
}

/**
 * Deterministic per-stop route-position role from sequence + local arc context.
 */
export function inferRoutePositionRoles(stops: RouteStopV01[]): RoutePositionRoleAssignment[] {
  if (!stops.length) return []

  const n = stops.length
  const utilities = stops.map((s) => s.nodeUtility)
  const maxUtility = Math.max(...utilities)
  const avgUtility = utilities.reduce((a, b) => a + b, 0) / n

  return stops.map((stop, i) => {
    const struct = classifyStructure(stop.tier, stop.editorialRole)
    const rel = stop.narrativeRelationFromPrevious
    const isFirst = i === 0
    const isLast = i === n - 1
    const isPenultimate = i === n - 2

    if (isFirst) {
      const weak = stop.nodeUtility < 40 && struct !== 'anchor'
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'OPENER' as const,
        rationale: weak
          ? 'First stop establishes route entry (modest utility — may be discovery-led).'
          : 'First stop opens the route with orientation / anchor value.',
      }
    }

    if (isLast) {
      const strong = stop.nodeUtility >= avgUtility * 0.9 || struct === 'anchor'
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'LANDING' as const,
        rationale: strong
          ? 'Final stop provides thematic or utility landing.'
          : 'Final stop closes route (quiet landing acceptable when arc supports it).',
      }
    }

    if (i === 1 && struct === 'anchor' && stop.nodeUtility >= avgUtility) {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'ORIENTATION' as const,
        rationale: 'Early anchor orients traveler after opener.',
      }
    }

    if (isPenultimate && stop.nodeUtility >= maxUtility * 0.85) {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'CLIMAX' as const,
        rationale: 'Penultimate high-utility stop acts as route climax.',
      }
    }

    if (isRevealRelation(rel) || struct === 'micro') {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'REVEAL' as const,
        rationale: 'Micro/reveal relation adds discovery beat.',
      }
    }

    if (isContrastRelation(rel)) {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'CONTRAST' as const,
        rationale: 'Contrast relation shifts register from prior stop.',
      }
    }

    if (struct === 'pocket' && stop.estimatedDwellMin >= 14) {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'BREATHER' as const,
        rationale: 'Thematic pocket with dwell room for absorption.',
      }
    }

    if (isDevelopmentRelation(rel) || struct === 'pocket') {
      return {
        stgoId: stop.stgoId,
        sequenceIndex: stop.sequenceIndex,
        role: 'DEVELOPMENT' as const,
        rationale: 'Mid-route development deepens themes or context.',
      }
    }

    return {
      stgoId: stop.stgoId,
      sequenceIndex: stop.sequenceIndex,
      role: 'DEVELOPMENT' as const,
      rationale: 'Mid-sequence stop extends route arc.',
    }
  })
}
