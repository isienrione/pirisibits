/**
 * Gate 2E.2A — standardized V0.2 score explanations.
 */

import type { ScoreExplanation, ScoreFactor } from '@/src/engine/scoring/v0.2/scoring-types'
import { confidenceFromCoverage } from '@/src/engine/scoring/v0.2/utils'

export function buildExplanation(args: {
  scoreName: string
  score: number | null
  status?: ScoreExplanation['status']
  coverage: number
  positive?: ScoreFactor[]
  negative?: ScoreFactor[]
  unknown?: string[]
  provenance?: string[]
  plain?: string
  extras?: Partial<Pick<ScoreExplanation, 'whatThisAddsNow' | 'whatWouldBeRedundant' | 'roleNeedBeingFilled'>>
}): ScoreExplanation {
  const pos = (args.positive ?? []).filter((f) => f.available && f.contribution != null && f.contribution > 0)
  const neg = (args.negative ?? []).filter((f) => f.available && f.contribution != null && f.contribution < 0)
  return {
    scoreName: args.scoreName,
    score: args.score,
    status: args.status ?? (args.score == null ? 'UNAVAILABLE' : 'AVAILABLE'),
    coverage: args.coverage,
    confidence: confidenceFromCoverage(args.coverage),
    topPositiveFactors: pos.sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0)).slice(0, 5),
    topNegativeFactors: neg.sort((a, b) => (a.contribution ?? 0) - (b.contribution ?? 0)).slice(0, 5),
    unknownFactors: args.unknown ?? [],
    provenanceSummary: args.provenance ?? [],
    plainLanguageExplanation: args.plain ?? '',
    ...args.extras,
  }
}
