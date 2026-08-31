/**
 * Gate 2E.6 — Extensible semantic interest facets + request structure dimensions.
 * Do NOT assign final Santiago facet values. Missing facet = UNKNOWN, not dislike.
 */

import type { TravelerModel } from '@/src/engine/types'
import type { TravelerInput } from '@/src/engine/traveler'
import { normalizeTraveler } from '@/src/engine/traveler'

export type SemanticInterestFacet =
  | 'ORIGINS_INDIGENOUS'
  | 'COLONIAL'
  | 'REPUBLIC_NATION_FORMATION'
  | 'POLITICAL_INSTITUTIONS'
  | 'MEMORY_DICTATORSHIP'
  | 'ARCHITECTURE'
  | 'FOOD_MARKETS'
  | 'NATURE_SCENERY'
  | 'OUTDOOR_HIKING'

export type ActivityMode = 'URBAN_WALK' | 'MIXED' | 'OUTDOOR_HIKE' | 'UNKNOWN'

export type PartyContext = {
  adultCount: number | null
  childCount: number | null
  youngChildren: boolean | null
  familyMode: boolean | null
}

export type TravelerRequestVNext = TravelerInput & {
  semanticFacets?: Partial<Record<SemanticInterestFacet, number | null>>
  activityMode?: ActivityMode
  party?: PartyContext
}

export type TravelerModelVNext = TravelerModel & {
  semanticFacets: Partial<Record<SemanticInterestFacet, number | null>>
  activityMode: ActivityMode
  party: PartyContext
}

export function normalizeTravelerRequestVNext(input: TravelerRequestVNext): TravelerModelVNext {
  const base = normalizeTraveler(input)
  return {
    ...base,
    semanticFacets: input.semanticFacets ?? {},
    activityMode: input.activityMode ?? 'UNKNOWN',
    party: {
      adultCount: input.party?.adultCount ?? null,
      childCount: input.party?.childCount ?? null,
      youngChildren: input.party?.youngChildren ?? null,
      familyMode: input.party?.familyMode ?? base.familyContext,
    },
  }
}

/** Facet presence: absent/null = UNKNOWN evidence, not zero dislike. */
export function semanticFacetMatch(
  travelerFacets: Partial<Record<SemanticInterestFacet, number | null>>,
  experienceFacets: Partial<Record<SemanticInterestFacet, number | null>> | null,
): { score: number | null; coverage: number; unknown: boolean } {
  if (!experienceFacets) return { score: null, coverage: 0, unknown: true }
  let num = 0
  let den = 0
  let known = 0
  for (const key of Object.keys(travelerFacets) as SemanticInterestFacet[]) {
    const t = travelerFacets[key]
    if (t == null) continue
    den += Math.abs(t)
    const e = experienceFacets[key]
    if (e == null) continue
    known++
    num += t * e
  }
  if (den <= 0 || known === 0) return { score: null, coverage: 0, unknown: true }
  return { score: Math.max(0, Math.min(100, (num / den) * 100)), coverage: known / Math.max(1, Object.keys(travelerFacets).length), unknown: false }
}
