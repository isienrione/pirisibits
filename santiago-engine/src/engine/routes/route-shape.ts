/**
 * Gate 2D — deterministic route shape tags (diagnostic, not exclusive labels).
 */

import type { RouteStopV01 } from '@/src/engine/routes/route-types'
import { classifyStructure } from '@/src/engine/routes/route-score'
import type { RoutePositionRoleAssignment } from '@/src/engine/routes/route-position-role'

export type RouteShapeTag =
  | 'ANCHOR_LED_CIVIC_ARC'
  | 'DISCOVERY_WEAVE'
  | 'CONTRAST_LADDER'
  | 'MICRO_REVEAL_TRAIL'
  | 'THEMATIC_DEEP_DIVE'
  | 'BALANCED_ESCALATION'
  | 'FRAGMENTED'
  | 'WEAK_LANDING'

export type RouteShapeSummary = {
  tags: RouteShapeTag[]
  primaryTag: RouteShapeTag | null
  explanation: string
}

function longestRun(
  stops: RouteStopV01[],
  kind: 'anchor' | 'pocket' | 'micro' | 'other',
): number {
  let best = 0
  let cur = 0
  for (const s of stops) {
    if (classifyStructure(s.tier, s.editorialRole) === kind) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 0
    }
  }
  return best
}

function contrastEdgeCount(stops: RouteStopV01[]): number {
  return stops.filter((s) => s.narrativeRelationFromPrevious === 'contrast').length
}

function revealEdgeCount(stops: RouteStopV01[]): number {
  return stops.filter(
    (s) =>
      s.narrativeRelationFromPrevious === 'reveal' ||
      s.narrativeRelationFromPrevious === 'resolves_question',
  ).length
}

/**
 * Derive multiple diagnostic shape tags from route composition + roles.
 */
export function summarizeRouteShape(
  stops: RouteStopV01[],
  roles: RoutePositionRoleAssignment[],
  dominantThemes: string[],
): RouteShapeSummary {
  const tags: RouteShapeTag[] = []
  const n = stops.length
  if (n === 0) {
    return { tags: ['FRAGMENTED'], primaryTag: 'FRAGMENTED', explanation: 'Empty route.' }
  }

  const counts = { anchor: 0, pocket: 0, micro: 0, other: 0 }
  for (const s of stops) counts[classifyStructure(s.tier, s.editorialRole)] += 1

  const anchorRatio = counts.anchor / n
  const pocketRatio = counts.pocket / n
  const microRatio = counts.micro / n
  const anchorRun = longestRun(stops, 'anchor')
  const microRun = longestRun(stops, 'micro')
  const contrasts = contrastEdgeCount(stops)
  const reveals = revealEdgeCount(stops)

  const landing = roles.find((r) => r.role === 'LANDING')
  const landingStop = landing ? stops.find((s) => s.stgoId === landing.stgoId) : stops[n - 1]
  const avgUtility = stops.reduce((a, s) => a + s.nodeUtility, 0) / n

  if (anchorRatio >= 0.45 || anchorRun >= 4) {
    tags.push('ANCHOR_LED_CIVIC_ARC')
  }
  if (pocketRatio >= 0.35 && microRatio >= 0.25 && anchorRatio <= 0.4) {
    tags.push('DISCOVERY_WEAVE')
  }
  if (contrasts >= Math.max(2, Math.floor(n / 3))) {
    tags.push('CONTRAST_LADDER')
  }
  if (microRatio >= 0.4 || microRun >= 3 || reveals >= 2) {
    tags.push('MICRO_REVEAL_TRAIL')
  }
  if (dominantThemes.length <= 2 && pocketRatio + microRatio >= 0.35) {
    tags.push('THEMATIC_DEEP_DIVE')
  }
  if (
    anchorRatio >= 0.2 &&
    anchorRatio <= 0.4 &&
    pocketRatio >= 0.15 &&
    microRatio >= 0.2 &&
    anchorRun <= 3
  ) {
    tags.push('BALANCED_ESCALATION')
  }

  const themeJump =
    new Set(stops.flatMap((s) => s.arcStateAfter.themesSeen)).size >= 4 &&
    dominantThemes.length >= 3 &&
    pocketRatio < 0.15
  if (themeJump && anchorRun <= 2) {
    tags.push('FRAGMENTED')
  }

  if (
    landingStop &&
    landingStop.nodeUtility < avgUtility * 0.75 &&
    landingStop.nodeUtility < 40 &&
    classifyStructure(landingStop.tier, landingStop.editorialRole) !== 'anchor'
  ) {
    tags.push('WEAK_LANDING')
  }

  if (!tags.length) tags.push('BALANCED_ESCALATION')

  const primaryTag = tags.includes('WEAK_LANDING')
    ? 'WEAK_LANDING'
    : tags.includes('ANCHOR_LED_CIVIC_ARC') && tags.length === 1
      ? 'ANCHOR_LED_CIVIC_ARC'
      : tags[0]!

  const explanation = `anchors=${counts.anchor} pockets=${counts.pocket} micro=${counts.micro}; longestAnchorRun=${anchorRun}; contrasts=${contrasts}; reveals=${reveals}.`

  return { tags: [...new Set(tags)], primaryTag, explanation }
}
