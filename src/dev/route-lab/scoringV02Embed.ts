/**
 * Gate 2E.2A — embed V0.2 parallel scores for Route Lab (diagnostic only).
 */

import { createEmptyArcState } from '@/src/engine/narrative/arc-state'
import type { RouteStopV01, RouteRequestV01 } from '@/src/engine/routes/route-types'
import { evaluateNodeScoreV02 } from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import type { NodeScoreBundleV02, RouteStateContext } from '@/src/engine/scoring/v0.2/scoring-types'
import { scoreNodeUtility } from '@/src/engine/scoring/nodeUtility'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { normalizeTravelerFromRouteRequest } from '@/src/dev/route-lab/scoringV02Traveler'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../..')

function structuralClassFromStop(stop: RouteStopV01): 'anchor' | 'pocket' | 'micro' | 'other' {
  const t = `${stop.tier ?? ''} ${stop.editorialRole ?? ''}`.toLowerCase()
  if (t.includes('micro')) return 'micro'
  if (t.includes('pocket') || t.includes('thematic')) return 'pocket'
  if (t.includes('anchor') || t.includes('canonical')) return 'anchor'
  return 'other'
}

export function buildRouteStateFromStops(
  stops: RouteStopV01[],
  targetIndex: number,
  request: RouteRequestV01,
): RouteStateContext {
  const prefix = stops.slice(0, targetIndex + 1)
  const prev = stops[targetIndex - 1]
  const cur = stops[targetIndex]!
  let anchorCount = 0
  let pocketCount = 0
  let microCount = 0
  for (const s of prefix) {
    const c = structuralClassFromStop(s)
    if (c === 'anchor') anchorCount += 1
    else if (c === 'pocket') pocketCount += 1
    else if (c === 'micro') microCount += 1
  }
  const arcState = cur.arcStateAfter ?? prefix[prefix.length - 1]?.arcStateAfter ?? createEmptyArcState()
  return {
    arcState,
    routeSoFarStgoIds: prefix.map((s) => s.stgoId),
    routeThemes: [...arcState.themesSeen],
    anchorCount,
    pocketCount,
    microCount,
    recentStgoIds: prefix.slice(-4).map((s) => s.stgoId),
    routeIntent: request.routeIntent,
    prevStgoId: prev?.stgoId ?? null,
    narrativeEdgeScore: cur.narrativeEdgeScore ?? null,
    transitionDistanceM: cur.transition?.distanceM ?? null,
    transitionDurationMin: cur.transitionTimeMin ?? null,
    transitionFeasible: cur.arrivalMode !== 'START' && cur.transition != null,
    geographicEvidenceAvailable: cur.transition?.distanceM != null,
    bearingReversal: null,
  }
}

export function buildStopScoringInspect(args: {
  stgoId: string
  request: RouteRequestV01
  stops?: RouteStopV01[]
  stopIndex?: number
  root?: string
}): { v01NodeUtility: number | null; v02: NodeScoreBundleV02 | null } {
  const root = args.root ?? ROOT
  const nodes = loadLaunchNodes(root)
  const node = nodes.find((n) => n.stgoId === args.stgoId)
  const traveler = normalizeTravelerFromRouteRequest(args.request)
  const v01 = node ? scoreNodeUtility(node, traveler, { launchCorpusOnly: false }) : null

  const routeState =
    args.stops != null && args.stopIndex != null && args.stopIndex >= 0
      ? buildRouteStateFromStops(args.stops, args.stopIndex, args.request)
      : null

  const v02 = evaluateNodeScoreV02(
    {
      stgoId: args.stgoId,
      displayName: node?.displayName ?? args.stgoId,
      traveler,
      routeIntent: args.request.routeIntent,
      routeState,
    },
    root,
  )

  return { v01NodeUtility: v01?.utility ?? null, v02 }
}

export function buildFixtureV02StopIndex(
  request: RouteRequestV01,
  stops: RouteStopV01[],
  root = ROOT,
): Record<string, { v01NodeUtility: number | null; v02: NodeScoreBundleV02 | null }> {
  const out: Record<string, { v01NodeUtility: number | null; v02: NodeScoreBundleV02 | null }> = {}
  stops.forEach((s, i) => {
    out[s.stgoId] = buildStopScoringInspect({
      stgoId: s.stgoId,
      request,
      stops,
      stopIndex: i,
      root,
    })
  })
  return out
}
