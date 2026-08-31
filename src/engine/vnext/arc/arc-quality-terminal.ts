/**
 * Gate 2E.6 — ArcQuality VNext terminal (timeUtilization removed).
 * Computes from ArcState + stop diagnostics; optionally overlays frozen Arc when available.
 */

import type { ArcStateVNext } from '@/src/engine/vnext/arc/arc-state-vnext'
import { ARC_QUALITY_VNEXT_PARALLEL } from '@/src/engine/routes/v0.2/arc-quality/vnext'

export type ArcQualityVNextTerminal = {
  version: string
  status: 'PARALLEL_ONLY'
  timeUtilizationRemoved: true
  normalizedScore: number
  dimensions: {
    opening: number
    development: number
    payoff: number
    landing: number
    rhythm: number
    contrastDiversity: number
    unresolvedSetup: number
    coherence: number
  }
  unresolvedSetupEvidenceAware: boolean
  correlationNote: string
  arcStateSummary: {
    phase: string
    orientationSatisfied: boolean
    payoffSatisfied: boolean
    landingSatisfied: boolean
    openQuestions: number
    resolvedQuestions: number
  }
}

export function evaluateArcQualityVNext(args: {
  arcState: ArcStateVNext
  stopCount: number
  themeCount: number
}): ArcQualityVNextTerminal {
  const s = args.arcState
  const opening = s.orientationSatisfied ? 0.85 : Math.min(0.7, 0.3 + args.stopCount * 0.1)
  const development = Math.min(1, 0.4 + s.themesDeveloped.length * 0.15 + (s.phase === 'MIDDLE' ? 0.2 : 0))
  const payoff = s.payoffSatisfied || s.strongestRevealUsed ? 0.85 : s.phase === 'LATE' || s.phase === 'LANDING' ? 0.45 : 0.35
  const landing = s.landingSatisfied || s.phase === 'LANDING' ? 0.8 : 0.35
  const rhythm = Math.max(0, 1 - s.repetitionLoad * 0.5 - Math.max(0, s.recentExperienceBeats - 4) * 0.08)
  const contrastDiversity = Math.min(1, args.themeCount / 5 + s.contrastNeed * 0.3)
  const unresolvedSetup = s.openQuestions.length === 0 ? 0 : Math.min(1, s.openQuestions.length * 0.35)
  const coherence = Math.max(0, 1 - s.unknownNarrativeCoverage * 0.5 - unresolvedSetup * 0.3)

  const positives =
    0.12 * opening +
    0.14 * development +
    0.12 * payoff +
    0.12 * landing +
    0.12 * rhythm +
    0.12 * contrastDiversity +
    0.14 * coherence
  const normalizedScore = Math.round(Math.max(0, Math.min(1, positives - 0.12 * unresolvedSetup)) * 1000) / 10

  return {
    version: 'arc-quality.vnext.0.2',
    status: 'PARALLEL_ONLY',
    timeUtilizationRemoved: true,
    normalizedScore,
    dimensions: {
      opening: round2(opening),
      development: round2(development),
      payoff: round2(payoff),
      landing: round2(landing),
      rhythm: round2(rhythm),
      contrastDiversity: round2(contrastDiversity),
      unresolvedSetup: round2(unresolvedSetup),
      coherence: round2(coherence),
    },
    unresolvedSetupEvidenceAware: true,
    correlationNote:
      'relationTypeVariety↔themeDiversity ρ≈0.836 observed in 2E.5 — kept separate pending behavior tests',
    arcStateSummary: {
      phase: s.phase,
      orientationSatisfied: s.orientationSatisfied,
      payoffSatisfied: s.payoffSatisfied,
      landingSatisfied: s.landingSatisfied,
      openQuestions: s.openQuestions.length,
      resolvedQuestions: s.resolvedQuestions.length,
    },
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export { ARC_QUALITY_VNEXT_PARALLEL }
