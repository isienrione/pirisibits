/**
 * Deterministic choice-confidence from score margin + evidence coverage.
 */

import { CHOICE_CONFIDENCE_THRESHOLDS } from '@/src/engine/routes/v0.2/arbitration/arbitration-config.v0.2'
import type { ChoiceConfidence } from '@/src/engine/routes/v0.2/arbitration/arbitration-types.v0.2'

export function classifyChoiceConfidence(args: {
  margin: number | null
  coverage: number
  uniquePresented: number
  constraintDominated: boolean
}): ChoiceConfidence {
  if (args.constraintDominated || args.uniquePresented <= 1) return 'CONSTRAINT_DOMINATED'
  if (args.coverage < CHOICE_CONFIDENCE_THRESHOLDS.insufficientCoverage) return 'INSUFFICIENT_EVIDENCE'
  if (args.margin == null) return 'INSUFFICIENT_EVIDENCE'
  if (
    args.margin >= CHOICE_CONFIDENCE_THRESHOLDS.clearMargin &&
    args.coverage >= CHOICE_CONFIDENCE_THRESHOLDS.clearCoverage
  ) {
    return 'CLEAR'
  }
  if (args.margin < CHOICE_CONFIDENCE_THRESHOLDS.closeCallMargin) return 'CLOSE_CALL'
  if (
    args.margin >= CHOICE_CONFIDENCE_THRESHOLDS.moderateMargin &&
    args.coverage >= CHOICE_CONFIDENCE_THRESHOLDS.moderateCoverage
  ) {
    return 'MODERATE'
  }
  return 'CLOSE_CALL'
}
