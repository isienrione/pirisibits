/**
 * Deterministic route-choice explanations. No runtime LLM.
 */

import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import { DISCOVERY_POSTURE_LABELS } from '@/src/engine/taxonomy'
import type { ArbitratedCandidate } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'
import { labelCopy } from '@/src/engine/routes/v0.2/arbitration/route-character-labels.v0.2'
import { round1 } from '@/src/engine/scoring/v0.2/utils'

function n(v: number | null | undefined): string {
  return v == null ? 'UNKNOWN' : String(round1(v))
}

function travelerPhrase(request: RouteRequestV01): string {
  const posture = DISCOVERY_POSTURE_LABELS[request.traveler.discoveryPosture] || request.traveler.discoveryPosture
  if (request.traveler.expressPreference || request.traveler.mobilityArchetype === 'M1') {
    return `this Express traveler`
  }
  if (request.routeIntent === 'THEMATIC') return `this thematic traveler`
  if (request.routeIntent === 'DISCOVERY') return `this ${posture}`
  if (request.routeIntent === 'ESSENTIALS') return `this essentials-first traveler`
  return `this ${posture}`
}

function strongestCommon(c: ArbitratedCandidate, request: RouteRequestV01): string[] {
  const pairs: Array<[string, number | null]> = [
    ['traveler match', c.features.travelerMatchRoute.value],
    ['discovery value', c.features.discoveryFit.value],
    ['physical ease', c.features.physicalEfficiency.value],
    ['arc quality', c.features.arcQuality.value],
    ['structural fit', c.features.structuralFit.value],
    ['route marginal value', c.features.routeMarginalValue.value],
  ]
  const ranked = pairs
    .filter((x): x is [string, number] => x[1] != null)
    .sort((a, b) => b[1] - a[1])
  const preferred: string[] = []
  if (request.traveler.discoveryPosture === 'D1' || request.routeIntent === 'DISCOVERY') {
    preferred.push('discovery value')
  }
  if (request.routeIntent === 'THEMATIC') preferred.push('traveler match')
  if (request.traveler.expressPreference || request.traveler.mobilityArchetype === 'M1') {
    preferred.push('physical ease')
  }
  const out: string[] = []
  for (const p of preferred) {
    if (ranked.some(([k]) => k === p) && !out.includes(p)) out.push(p)
  }
  for (const [k] of ranked) {
    if (out.length >= 2) break
    if (!out.includes(k)) out.push(k)
  }
  return out.slice(0, 2)
}

export function explainWhyWon(args: {
  request: RouteRequestV01
  recommended: ArbitratedCandidate
  others: ArbitratedCandidate[]
}): string {
  const { request, recommended, others } = args
  const who = travelerPhrase(request)
  const strengths = strongestCommon(recommended, request)
  const combo = strengths.length ? strengths.join(' and ') : 'common route features'
  const phys = recommended.features.physicalEfficiency.value
  const disc = recommended.features.discoveryFit.value
  let extra = ''
  if (phys != null && phys >= 70) extra = ' while keeping a smoother physical route'
  else if (disc != null && disc >= 60) extra = ' with stronger measured discovery characteristics'
  return `Recommended because it gives ${who} the strongest combination of ${combo}${extra}. Originating lane: ${recommended.originatingLane} (provenance only; labels use observed character). RouteChoiceScore ${n(recommended.routeChoiceScore)}.`
}

export function explainWhyLost(args: {
  recommended: ArbitratedCandidate
  other: ArbitratedCandidate
}): string {
  const { recommended, other } = args
  const diffs: Array<{ k: string; d: number; rec: number; oth: number }> = []
  const keys: Array<[string, number | null, number | null]> = [
    ['traveler match', recommended.features.travelerMatchRoute.value, other.features.travelerMatchRoute.value],
    ['discovery fit', recommended.features.discoveryFit.value, other.features.discoveryFit.value],
    ['physical efficiency', recommended.features.physicalEfficiency.value, other.features.physicalEfficiency.value],
    ['arc quality', recommended.features.arcQuality.value, other.features.arcQuality.value],
    ['structural fit', recommended.features.structuralFit.value, other.features.structuralFit.value],
    ['time fit', recommended.features.timeFit.value, other.features.timeFit.value],
    ['marginal value', recommended.features.routeMarginalValue.value, other.features.routeMarginalValue.value],
  ]
  for (const [k, rec, oth] of keys) {
    if (rec == null || oth == null) continue
    diffs.push({ k, d: rec - oth, rec, oth })
  }
  diffs.sort((a, b) => Math.abs(b.d) - Math.abs(a.d) || a.k.localeCompare(b.k))
  const top = diffs[0]
  const label = labelCopy(other.userFacingLabel)
  const lane = `The ${other.originatingLane}-lane candidate`
  if (!top) {
    return `${lane} was not recommended (RouteChoiceScore ${n(other.routeChoiceScore)} vs ${n(recommended.routeChoiceScore)}).`
  }
  if (top.d > 0) {
    return `${lane} (${label || 'alternative'}) trails on ${top.k} (${n(top.oth)} vs ${n(top.rec)}) with RouteChoiceScore ${n(other.routeChoiceScore)}.`
  }
  return `${lane} (${label || 'alternative'}) is stronger on ${top.k} (${n(top.oth)} vs ${n(top.rec)}) but loses overall (RouteChoiceScore ${n(other.routeChoiceScore)} vs ${n(recommended.routeChoiceScore)}).`
}
