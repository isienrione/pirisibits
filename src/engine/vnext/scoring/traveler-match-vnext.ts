/**
 * Gate 2E.6 — TravelerMatch VNext interface (runtime formula frozen).
 * Adds diagnostics: attainable corpus max, selected mean, selection gap.
 */

import { evaluateNodeScoreV02 } from '@/src/engine/scoring/v0.2/evaluate-node-v02'
import type { TravelerModel } from '@/src/engine/types'
import type { RouteIntent } from '@/src/engine/routes/route-types'
import type { ExperienceRecord } from '@/src/engine/vnext/place/types'
import { semanticFacetMatch, type TravelerModelVNext } from '@/src/engine/vnext/scoring/traveler-facets'

export type TravelerMatchVNextResult = {
  total: number | null
  thematic: number | null
  discovery: number | null
  familiarity: number | null
  structural: number | null
  context: number | null
  semanticFacetMatch: number | null
  coverage: number
  unknownFactors: string[]
  provenance: string
  formulaUnchanged: true
}

export function evaluateTravelerMatchVNext(args: {
  experience: ExperienceRecord
  traveler: TravelerModel | TravelerModelVNext
  routeIntent?: RouteIntent
  root: string
}): TravelerMatchVNextResult {
  const stgoId = args.experience.sourceStgoId
  const unknownFactors: string[] = []
  if (!stgoId) {
    return {
      total: null,
      thematic: null,
      discovery: null,
      familiarity: null,
      structural: null,
      context: null,
      semanticFacetMatch: null,
      coverage: 0,
      unknownFactors: ['MISSING_SOURCE_STGO'],
      provenance: 'UNKNOWN',
      formulaUnchanged: true,
    }
  }
  const bundle = evaluateNodeScoreV02(
    {
      stgoId,
      displayName: args.experience.displayName,
      traveler: args.traveler,
      routeIntent: args.routeIntent,
    },
    args.root,
  )
  const tm = bundle?.travelerMatch
  const facets =
    'semanticFacets' in args.traveler
      ? semanticFacetMatch(args.traveler.semanticFacets, null)
      : { score: null, coverage: 0, unknown: true }
  if (facets.unknown) unknownFactors.push('SEMANTIC_FACETS_ABSENT_EVIDENCE')

  return {
    total: tm?.score ?? null,
    thematic: tm?.components.thematicAffinity ?? null,
    discovery: tm?.components.discoveryPostureAffinity ?? null,
    familiarity: tm?.components.familiarityAffinity ?? null,
    structural: tm?.components.structuralPreference ?? null,
    context: tm?.components.contextAffinity ?? null,
    semanticFacetMatch: facets.score,
    coverage: tm?.coverage ?? 0,
    unknownFactors,
    provenance: 'SCORING_V0_2_FROZEN_FORMULA',
    formulaUnchanged: true,
  }
}

export type TravelerMatchDiagnostics = {
  attainableCorpusMax: number | null
  selectedRouteMean: number | null
  selectionGap: number | null
  perExperience: Array<{ experienceId: string; total: number | null }>
}

export function diagnoseTravelerMatchSelection(args: {
  corpusScores: Array<{ experienceId: string; total: number | null }>
  selectedScores: Array<{ experienceId: string; total: number | null }>
}): TravelerMatchDiagnostics {
  const known = args.corpusScores.map((s) => s.total).filter((v): v is number => v != null)
  const selected = args.selectedScores.map((s) => s.total).filter((v): v is number => v != null)
  const max = known.length ? Math.max(...known) : null
  const mean = selected.length ? selected.reduce((a, b) => a + b, 0) / selected.length : null
  return {
    attainableCorpusMax: max,
    selectedRouteMean: mean,
    selectionGap: max != null && mean != null ? max - mean : null,
    perExperience: args.corpusScores,
  }
}
