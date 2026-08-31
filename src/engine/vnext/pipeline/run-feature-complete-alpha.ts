/**
 * Gate 2E.6 — Feature-Complete Alpha end-to-end pipeline.
 */

import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import type { RouteRequestInput } from '@/src/engine/routes/route-request'
import type { RouteRequestV01 } from '@/src/engine/routes/route-types'
import { composeRoutesVNext, type ComposeVNextResult } from '@/src/engine/vnext/composer/compose-vnext'
import {
  arbitrateVNext,
  ARBITRATION_CURRENT_CONFIG,
  ARBITRATION_EXPERIMENTAL_FULL_FEATURE,
  computeTimeFitVNext,
  type ArbitrationVNextConfig,
  type ArbitrationVNextResult,
} from '@/src/engine/vnext/arbitration/arbitration-vnext'
import { buildFinalRouteExplanation, type FinalRouteExplanation } from '@/src/engine/vnext/explanation/final-route-explanation'
import { evaluateTravelerMatchVNext, diagnoseTravelerMatchSelection } from '@/src/engine/vnext/scoring/traveler-match-vnext'
import { adaptLaunchCorpusToExperienceGraph } from '@/src/engine/vnext/place/legacy-adapter'
import { loadLaunchNodes } from '@/src/engine/loadSantiagoNodes'
import { appendTraceEvent, assertTraceCompleteness, type LiveTrace } from '@/src/engine/vnext/trace/live-trace'
import { getPosturePolicyVNext } from '@/src/engine/vnext/posture/posture-policy-vnext'
import { selectContentModules } from '@/src/engine/vnext/content/select-content-modules'
import { summarizeFeatureCompleteStatus } from '@/src/engine/vnext/status/engine-feature-status'
import type { TimeEvaluationMode } from '@/src/engine/vnext/time/experience-time-engine'

const ROOT_DEFAULT = resolve(__dirname, '../../../..')

export type FeatureCompleteAlphaResult = {
  schemaVersion: 'feature-complete-alpha.v0.1'
  status: 'NON_CANONICAL'
  ENGINE_FEATURE_COMPLETE_ALPHA: true
  ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL: false
  LEGACY_EXPERIENCE_ADAPTER: true
  timeEvaluationMode: TimeEvaluationMode
  timeDisclosure: string[]
  composition: ComposeVNextResult
  arbitrationCurrent: ArbitrationVNextResult
  arbitrationExperimental: ArbitrationVNextResult
  recommendation: {
    lane: string | null
    stgoIds: string[]
    experienceIds: string[]
    totalEstimatedMin: number
    fingerprint: string
  } | null
  explanation: FinalRouteExplanation | null
  tmDiagnostics: ReturnType<typeof diagnoseTravelerMatchSelection> | null
  contentSelections: Array<{ experienceId: string; selectedModuleIds: string[]; reasons: string[] }>
  posturePolicyShadow: ReturnType<typeof getPosturePolicyVNext>
  featureStatus: ReturnType<typeof summarizeFeatureCompleteStatus>
  trace: LiveTrace
  runFingerprint: string
  determinismKey: string
}

export function runFeatureCompleteAlpha(
  input: RouteRequestInput | RouteRequestV01,
  opts?: {
    root?: string
    timeMode?: TimeEvaluationMode
    primaryConfig?: ArbitrationVNextConfig
  },
): FeatureCompleteAlphaResult {
  const root = opts?.root ?? ROOT_DEFAULT
  const timeMode = opts?.timeMode ?? 'LEGACY_COMPATIBILITY'
  const composition = composeRoutesVNext(input, { root, timeMode })
  const request = composition.request

  // Enrich timeFit using actual request budget via feature overrides
  const featureOverrides = Object.fromEntries(
    composition.candidates.map((c) => {
      const tf = computeTimeFitVNext({
        totalEstimatedMin: c.totalEstimatedMin,
        timeBudgetMin: request.timeBudgetMin,
        timeEvidenceMode: c.timeEvidenceMode,
      })
      // Approximate TM route mean from evaluateTravelerMatchVNext
      const tmVals = c.experienceIds.map((experienceId, i) => {
        const exp = {
          experienceId,
          sourceStgoId: c.stgoIds[i]!,
          displayName: c.stgoIds[i]!,
        } as any
        return evaluateTravelerMatchVNext({
          experience: exp,
          traveler: request.traveler,
          routeIntent: request.routeIntent,
          root,
        }).total
      })
      const known = tmVals.filter((v): v is number => v != null)
      const tmMean = known.length ? known.reduce((a, b) => a + b, 0) / known.length : null
      return [
        c.lane,
        {
          travelerMatchRoute: tmMean,
          timeFitVNext: tf.value,
          intrinsicWorthRoute: 68,
          physicalEfficiency: 82,
          structuralFit: 60,
          discoveryFit: c.lane === 'DISCOVERY' ? 72 : 55,
          routeMarginalValue: 55,
          narrativeCoherence: null,
        },
      ]
    }),
  ) as any

  const arbitrationCurrent = arbitrateVNext({
    candidates: composition.candidates,
    posture: request.traveler.discoveryPosture,
    config: opts?.primaryConfig ?? ARBITRATION_CURRENT_CONFIG,
    featureOverrides,
  })
  const arbitrationExperimental = arbitrateVNext({
    candidates: composition.candidates,
    posture: request.traveler.discoveryPosture,
    config: ARBITRATION_EXPERIMENTAL_FULL_FEATURE,
    featureOverrides,
  })

  const winner = arbitrationCurrent.winner
  const nodes = loadLaunchNodes(root)
  const adapted = adaptLaunchCorpusToExperienceGraph(nodes)

  let tmDiagnostics = null as FeatureCompleteAlphaResult['tmDiagnostics']
  if (winner) {
    const corpusScores = adapted.experiences.map((e) => ({
      experienceId: e.experienceId,
      total: evaluateTravelerMatchVNext({
        experience: e,
        traveler: request.traveler,
        routeIntent: request.routeIntent,
        root,
      }).total,
    }))
    const selectedScores = winner.candidate.experienceIds.map((experienceId, i) => ({
      experienceId,
      total: evaluateTravelerMatchVNext({
        experience: {
          ...adapted.experiences.find((e) => e.experienceId === experienceId)!,
          experienceId,
          sourceStgoId: winner.candidate.stgoIds[i]!,
          displayName: winner.candidate.stgoIds[i]!,
        } as any,
        traveler: request.traveler,
        routeIntent: request.routeIntent,
        root,
      }).total,
    }))
    tmDiagnostics = diagnoseTravelerMatchSelection({ corpusScores, selectedScores })
  }

  const contentSelections =
    winner == null
      ? []
      : winner.candidate.experienceIds.map((experienceId) => {
          const sel = selectContentModules({
            experienceId,
            available: adapted.contentModules,
            traveler: request.traveler,
            arcState: winner.candidate.arcState,
            timeContext: { remainingMin: null, walkCompatibleCapacity: 'UNKNOWN' },
          })
          return {
            experienceId,
            selectedModuleIds: sel.selected.map((m) => m.contentModuleId),
            reasons: sel.reasons,
          }
        })

  const explanation =
    winner == null
      ? null
      : buildFinalRouteExplanation({
          winner: winner.candidate,
          arbitration: arbitrationCurrent,
          arcQuality: winner.arcQuality,
          tmDiagnostics: tmDiagnostics ?? undefined,
        })

  const trace = composition.trace
  if (winner) {
    appendTraceEvent(trace, {
      stage: 'ARCQUALITY',
      decision: `score=${winner.arcQuality.normalizedScore}`,
      reasonComponents: winner.arcQuality.dimensions as any,
      unknowns: [],
      provenance: 'evaluateArcQualityVNext',
    })
  }
  appendTraceEvent(trace, {
    stage: 'ARBITRATION',
    decision: winner ? `winner=${winner.lane}` : 'no_winner',
    reasonComponents: {
      objective: arbitrationCurrent.objectiveUsed,
      margin: arbitrationCurrent.margin,
      confidence: arbitrationCurrent.confidence,
      experimentalWinner: arbitrationExperimental.winner?.lane ?? null,
    },
    unknowns: arbitrationCurrent.calibrationRequired ? ['CALIBRATION_REQUIRED'] : [],
    provenance: 'arbitrateVNext',
  })
  appendTraceEvent(trace, {
    stage: 'EXPLANATION',
    decision: explanation ? 'built' : 'skipped',
    reasonComponents: { routeWhy: explanation?.routeWhy ?? [] },
    unknowns: explanation?.limitations ?? [],
    provenance: 'buildFinalRouteExplanation',
  })

  const timeDisclosure = [
    ...new Set(composition.candidates.flatMap((c) => c.timeDisclosure)),
  ]
  if (timeMode === 'LEGACY_COMPATIBILITY') {
    timeDisclosure.unshift('TIME MODEL: LEGACY COMPATIBILITY')
    timeDisclosure.unshift('EXPERIENCE-TIME CALIBRATION PENDING')
  }

  const recommendation = winner
    ? {
        lane: winner.lane,
        stgoIds: winner.candidate.stgoIds,
        experienceIds: winner.candidate.experienceIds,
        totalEstimatedMin: winner.candidate.totalEstimatedMin,
        fingerprint: winner.candidate.fingerprint,
      }
    : null

  const determinismKey = createHash('sha256')
    .update(
      JSON.stringify({
        requestHash: composition.requestHash,
        recommendation,
        objective: arbitrationCurrent.objectiveUsed,
      }),
    )
    .digest('hex')
    .slice(0, 24)

  return {
    schemaVersion: 'feature-complete-alpha.v0.1',
    status: 'NON_CANONICAL',
    ENGINE_FEATURE_COMPLETE_ALPHA: true,
    ENGINE_FEATURE_COMPLETE_ALPHA_CANONICAL: false,
    LEGACY_EXPERIENCE_ADAPTER: true,
    timeEvaluationMode: timeMode,
    timeDisclosure,
    composition,
    arbitrationCurrent,
    arbitrationExperimental,
    recommendation,
    explanation,
    tmDiagnostics,
    contentSelections,
    posturePolicyShadow: getPosturePolicyVNext(),
    featureStatus: summarizeFeatureCompleteStatus(),
    trace,
    runFingerprint: determinismKey,
    determinismKey,
  }
}

export function assertDeterministicAlpha(input: RouteRequestInput | RouteRequestV01, root?: string): boolean {
  const a = runFeatureCompleteAlpha(input, { root })
  const b = runFeatureCompleteAlpha(input, { root })
  return a.runFingerprint === b.runFingerprint && a.recommendation?.fingerprint === b.recommendation?.fingerprint
}

export { assertTraceCompleteness }
