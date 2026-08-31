/**
 * Gate 2E.6 — Explanation engine (traveler-facing + founder/debug).
 */

import type { ArcQualityVNextTerminal } from '@/src/engine/vnext/arc/arc-quality-terminal'
import type { VNextRouteCandidate } from '@/src/engine/vnext/composer/compose-vnext'
import type { ArbitrationVNextResult } from '@/src/engine/vnext/arbitration/arbitration-vnext'

export type FinalRouteExplanation = {
  routeWhy: string[]
  routeCharacter: string[]
  protectedEssentials: string[]
  personalizationReasons: string[]
  narrativeArcSummary: string[]
  timeSummary: string
  confidence: string
  limitations: string[]
  experiences: Array<{
    experienceId: string
    stgoId: string
    whyIncluded: string[]
    roleInJourney: string
    personalMatchReasons: string[]
    narrativeReason: string | null
    whyNow: string | null
    timeReason: string | null
    evidenceConfidence: string
  }>
  omittedHighValue: Array<{
    experienceId: string
    whyOmitted: string[]
    bestAlternativeInsertion: string | null
    constraintOrTradeoff: string
  }>
  founderDebug: Record<string, unknown>
}

export function buildFinalRouteExplanation(args: {
  winner: VNextRouteCandidate
  arbitration: ArbitrationVNextResult
  arcQuality: ArcQualityVNextTerminal
  tmDiagnostics?: { attainableCorpusMax: number | null; selectedRouteMean: number | null; selectionGap: number | null }
}): FinalRouteExplanation {
  const w = args.winner
  const phase = w.arcState.phase
  return {
    routeWhy: [
      `Selected via ${args.arbitration.objectiveUsed} arbitration`,
      `Lane diversification strategy: ${w.lane} (internal, not traveler category)`,
      `Arc phase ended in ${phase}`,
    ],
    routeCharacter: [
      w.lane === 'SIGNATURE' ? 'Essential-leaning sequence' : w.lane === 'DISCOVERY' ? 'Discovery-leaning sequence' : 'Flow-leaning sequence',
      `Orientation ${w.arcState.orientationSatisfied ? 'satisfied' : 'partial'}`,
      `Payoff ${w.arcState.payoffSatisfied ? 'present' : 'open'}`,
    ],
    protectedEssentials: w.stgoIds.slice(0, 2).map((id) => `${id} kept as early orientation/core`),
    personalizationReasons: [
      args.tmDiagnostics?.selectionGap != null
        ? `TravelerMatch selection gap vs corpus max: ${args.tmDiagnostics.selectionGap.toFixed(1)}`
        : 'TravelerMatch diagnostics available in founder debug',
    ],
    narrativeArcSummary: [
      `OPEN/ORIENT → DEVELOP → ${w.arcState.strongestRevealUsed ? 'REVEAL' : 'DEEPEN'} → ${w.arcState.landingSatisfied ? 'LAND' : 'LATE'}`,
      `Open questions: ${w.arcState.openQuestions.length}; resolved: ${w.arcState.resolvedQuestions.length}`,
      `ArcQualityVNext score: ${args.arcQuality.normalizedScore}`,
    ],
    timeSummary: [
      `Total ~${Math.round(w.totalEstimatedMin)} min`,
      `Time evidence mode: ${w.timeEvidenceMode}`,
      ...w.timeDisclosure.slice(0, 3),
    ].join(' · '),
    confidence: args.arbitration.confidence,
    limitations: [
      'NON_CANONICAL Feature-Complete Alpha',
      'Experience-Time calibration pending unless EXPLICITLY calibrated',
      'Semantic facets may be UNKNOWN',
      'Weights are provisional (CALIBRATION_REQUIRED)',
      ...w.timeDisclosure.filter((d) => d.includes('PENDING') || d.includes('LEGACY')),
    ],
    experiences: w.experienceIds.map((experienceId, i) => ({
      experienceId,
      stgoId: w.stgoIds[i]!,
      whyIncluded: [
        i === 0 ? 'Route start / orientation' : `Selected at step ${i} under ${w.compositionSteps[i - 1]?.phase ?? phase}`,
      ],
      roleInJourney: i === 0 ? 'ORIENT' : i === w.experienceIds.length - 1 ? 'LAND' : 'DEVELOP',
      personalMatchReasons: ['See TravelerMatch VNext components in founder debug'],
      narrativeReason: null,
      whyNow: w.compositionSteps[i - 1]
        ? `Budget fraction ${(w.compositionSteps[i - 1]!.budgetConsumedFrac * 100).toFixed(0)}% · phase ${w.compositionSteps[i - 1]!.phase}`
        : 'Start',
      timeReason: w.timeEvidenceMode,
      evidenceConfidence: w.timeEvidenceMode === 'LEGACY_COMPATIBILITY' ? 'LOW' : 'MEDIUM',
    })),
    omittedHighValue: [],
    founderDebug: {
      fingerprint: w.fingerprint,
      arcQuality: args.arcQuality,
      arbitrationScores: args.arbitration.scored.map((s) => ({
        lane: s.lane,
        score: s.score,
        coverage: s.coverage,
      })),
      tmDiagnostics: args.tmDiagnostics ?? null,
      compositionSteps: w.compositionSteps,
    },
  }
}
