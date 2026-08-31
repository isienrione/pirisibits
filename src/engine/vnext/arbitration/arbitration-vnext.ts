/**
 * Gate 2E.6 — Arbitration VNext (CURRENT + EXPERIMENTAL_FULL_FEATURE).
 * LanePrior optional. No final weight tuning.
 */

import type { VNextRouteCandidate, ComposerLaneVNext } from '@/src/engine/vnext/composer/compose-vnext'
import type { ArcQualityVNextTerminal } from '@/src/engine/vnext/arc/arc-quality-terminal'
import { evaluateArcQualityVNext } from '@/src/engine/vnext/arc/arc-quality-terminal'

export type ArbitrationObjective =
  | 'CURRENT_OBJECTIVE'
  | 'EXPERIMENTAL_FULL_FEATURE_OBJECTIVE'

export type ArbitrationVNextConfig = {
  objective: ArbitrationObjective
  lanePriorEnabled: boolean
  version: string
  calibrationRequired: boolean
}

export const ARBITRATION_CURRENT_CONFIG: ArbitrationVNextConfig = {
  objective: 'CURRENT_OBJECTIVE',
  lanePriorEnabled: true,
  version: 'arbitration.vnext.current.0.1',
  calibrationRequired: false,
}

/** Experimental — can value every common feature; weights provisional. */
export const ARBITRATION_EXPERIMENTAL_FULL_FEATURE: ArbitrationVNextConfig = {
  objective: 'EXPERIMENTAL_FULL_FEATURE_OBJECTIVE',
  lanePriorEnabled: false,
  version: 'arbitration.vnext.experimental-full.0.1',
  calibrationRequired: true,
}

/** Provisional experimental weights — CALIBRATION_REQUIRED. Not production. */
const EXPERIMENTAL_WEIGHTS = {
  travelerMatchRoute: 0.22,
  intrinsicWorthRoute: 0.1,
  routeMarginalValue: 0.12,
  arcQualityVNext: 0.18,
  physicalEfficiency: 0.08,
  timeFitVNext: 0.08,
  structuralFit: 0.08,
  discoveryFit: 0.08,
  narrativeCoherence: 0.06,
  // lanePrior optional / off in experimental default
}

const CURRENT_WEIGHTS = {
  travelerMatchRoute: 0.3,
  arcQualityVNext: 0.2,
  routeMarginalValue: 0.15,
  physicalEfficiency: 0.12,
  structuralFit: 0.1,
  timeFitVNext: 0.08,
  lanePrior: 0.05,
}

export type TimeFitVNextResult = {
  value: number | null
  band: 'OVER_BUDGET' | 'NEAR_BUDGET' | 'UNDER_UTILIZED' | 'UNKNOWN'
  coverage: number
}

export function computeTimeFitVNext(args: {
  totalEstimatedMin: number
  timeBudgetMin: number
  timeEvidenceMode: string
}): TimeFitVNextResult {
  if (args.timeEvidenceMode === 'DIAGNOSTIC_UNKNOWN') {
    return { value: null, band: 'UNKNOWN', coverage: 0 }
  }
  const util = args.totalEstimatedMin / Math.max(1, args.timeBudgetMin)
  if (util > 1.08) return { value: 55, band: 'OVER_BUDGET', coverage: 1 }
  if (util >= 0.72) return { value: 92, band: 'NEAR_BUDGET', coverage: 1 }
  if (util < 0.55) return { value: 62, band: 'UNDER_UTILIZED', coverage: 1 }
  return { value: 78, band: 'UNDER_UTILIZED', coverage: 1 }
}

export type ScoredArbitrationCandidate = {
  lane: ComposerLaneVNext
  candidate: VNextRouteCandidate
  arcQuality: ArcQualityVNextTerminal
  score: number
  coverage: number
  features: Record<string, number | null>
}

export type ArbitrationVNextResult = {
  objectiveUsed: ArbitrationObjective
  config: ArbitrationVNextConfig
  winner: ScoredArbitrationCandidate | null
  scored: ScoredArbitrationCandidate[]
  confidence: 'CLEAR' | 'MODERATE' | 'CLOSE_CALL' | 'UNKNOWN'
  margin: number | null
  lanePriorEnabled: boolean
  discoveryFitAvailable: true
  calibrationRequired: boolean
}

function lanePriorScore(lane: ComposerLaneVNext, posture: string | null | undefined): number {
  const p = posture ?? 'D2'
  const table: Record<string, Record<ComposerLaneVNext, number>> = {
    D1: { SIGNATURE: 80, DISCOVERY: 45, FLOW: 60 },
    D2: { SIGNATURE: 70, DISCOVERY: 65, FLOW: 70 },
    D3: { SIGNATURE: 55, DISCOVERY: 85, FLOW: 60 },
  }
  return (table[p] ?? table.D2!)[lane]
}

export function arbitrateVNext(args: {
  candidates: VNextRouteCandidate[]
  posture?: string | null
  config?: ArbitrationVNextConfig
  /** Optional feature overlays from frozen common-feature estimates. */
  featureOverrides?: Partial<Record<ComposerLaneVNext, Record<string, number | null>>>
}): ArbitrationVNextResult {
  const config = args.config ?? ARBITRATION_CURRENT_CONFIG
  const scored: ScoredArbitrationCandidate[] = args.candidates.map((c) => {
    const arcQuality = evaluateArcQualityVNext({
      arcState: c.arcState,
      stopCount: c.stgoIds.length,
      themeCount: c.arcState.themesIntroduced.length,
    })
    const timeFit = computeTimeFitVNext({
      totalEstimatedMin: c.totalEstimatedMin,
      timeBudgetMin: c.totalEstimatedMin > 0 ? Math.max(c.totalEstimatedMin, 60) : 105,
      // use disclosure: prefer candidate's own budget via composition — approximate with total
      timeEvidenceMode: c.timeEvidenceMode,
    })
    // Recompute timeFit with request budget if present on fingerprint path — use total vs 105 default fixed below in pipeline
    const overrides = args.featureOverrides?.[c.lane] ?? {}
    const features: Record<string, number | null> = {
      travelerMatchRoute: overrides.travelerMatchRoute ?? 60,
      intrinsicWorthRoute: overrides.intrinsicWorthRoute ?? 65,
      routeMarginalValue: overrides.routeMarginalValue ?? 55,
      arcQualityVNext: arcQuality.normalizedScore,
      physicalEfficiency: overrides.physicalEfficiency ?? 80,
      timeFitVNext: timeFit.value,
      structuralFit: overrides.structuralFit ?? 60,
      discoveryFit: overrides.discoveryFit ?? (c.lane === 'DISCOVERY' ? 70 : 55),
      narrativeCoherence: overrides.narrativeCoherence ?? arcQuality.dimensions.coherence * 100,
      lanePrior: config.lanePriorEnabled ? lanePriorScore(c.lane, args.posture) : null,
      coverageConfidence: 0.85,
    }

    const weights =
      config.objective === 'EXPERIMENTAL_FULL_FEATURE_OBJECTIVE' ? EXPERIMENTAL_WEIGHTS : CURRENT_WEIGHTS
    let num = 0
    let den = 0
    for (const [k, w] of Object.entries(weights)) {
      if (k === 'lanePrior' && !config.lanePriorEnabled) continue
      const v = features[k]
      if (v == null || !Number.isFinite(v)) continue
      num += w * v
      den += w
    }
    const score = den > 0 ? num / den : 0
    return {
      lane: c.lane,
      candidate: c,
      arcQuality,
      score: Math.round(score * 10) / 10,
      coverage: den / Object.values(weights).reduce((a, b) => a + b, 0),
      features,
    }
  })

  scored.sort((a, b) => b.score - a.score || a.lane.localeCompare(b.lane))
  const winner = scored[0] ?? null
  const margin = scored.length >= 2 ? scored[0]!.score - scored[1]!.score : null
  let confidence: ArbitrationVNextResult['confidence'] = 'UNKNOWN'
  if (margin == null) confidence = 'UNKNOWN'
  else if (margin >= 4) confidence = 'CLEAR'
  else if (margin >= 1.5) confidence = 'MODERATE'
  else confidence = 'CLOSE_CALL'

  return {
    objectiveUsed: config.objective,
    config,
    winner,
    scored,
    confidence,
    margin,
    lanePriorEnabled: config.lanePriorEnabled,
    discoveryFitAvailable: true,
    calibrationRequired: config.calibrationRequired,
  }
}
