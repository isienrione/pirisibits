/**
 * Gate 2E.2A — IntrinsicWorth V0.2 (reproduces canonical ChronoWorth arithmetic).
 */

import type { SemanticCalibrationRecord } from '@/src/engine/semanticTypes'
import type { IntrinsicWorthResult } from '@/src/engine/scoring/v0.2/scoring-types'
import { INTRINSIC_WORTH_WEIGHTS, SCORING_CONFIG_STATUS } from '@/src/engine/scoring/v0.2/scoring-config'
import { SCORING_MODEL_VERSION } from '@/src/engine/scoring/v0.2/scoring-types'
import { buildExplanation } from '@/src/engine/scoring/v0.2/explain-score'
import {
  clamp01,
  coverageFromKnown,
  isKnown,
  percentileRank,
  round1,
} from '@/src/engine/scoring/v0.2/utils'

const METRIC_KEYS = ['heritage_depth', 'anchor_density', 'micro_reveal', 'polish'] as const

export function structuralInputs(record: SemanticCalibrationRecord): {
  heritageDepth: number | null
  anchorDensity: number | null
  microReveal: number | null
  polish: number | null
} {
  const m = record.structuralMetrics ?? {}
  return {
    heritageDepth: isKnown(m.heritage_depth) ? clamp01(m.heritage_depth!) : null,
    anchorDensity: isKnown(m.anchor_density) ? clamp01(m.anchor_density!) : null,
    microReveal: isKnown(m.micro_reveal) ? clamp01(m.micro_reveal!) : null,
    polish: isKnown(m.polish) ? clamp01(m.polish!) : null,
  }
}

export function computeIntrinsicWorthRaw(inputs: ReturnType<typeof structuralInputs>): {
  raw: number | null
  contributions: IntrinsicWorthResult['contributions']
  coverage: number
} {
  const { heritageDepth, anchorDensity, microReveal, polish } = inputs
  const vals = [heritageDepth, anchorDensity, microReveal, polish]
  const known = vals.filter(isKnown).length
  if (known < 4) {
    return {
      raw: null,
      contributions: {
        heritageDepth: isKnown(heritageDepth) ? round1(heritageDepth! * 35) : null,
        anchorDensity: isKnown(anchorDensity) ? round1(anchorDensity! * 30) : null,
        microReveal: isKnown(microReveal) ? round1(microReveal! * 20) : null,
        polish: isKnown(polish) ? round1(polish! * 15) : null,
      },
      coverage: coverageFromKnown(known, 4),
    }
  }
  const contributions = {
    heritageDepth: round1(heritageDepth! * 35),
    anchorDensity: round1(anchorDensity! * 30),
    microReveal: round1(microReveal! * 20),
    polish: round1(polish! * 15),
  }
  const raw = round1(
    contributions.heritageDepth +
      contributions.anchorDensity +
      contributions.microReveal +
      contributions.polish,
  )
  return { raw, contributions, coverage: 1 }
}

export function buildIntrinsicWorthPercentiles(
  allRecords: SemanticCalibrationRecord[],
  raw: number | null,
  activeCorpusIds?: Set<string>,
): { santiago: number | null; activeCorpus: number | null } {
  if (!isKnown(raw)) return { santiago: null, activeCorpus: null }
  const allRaw = allRecords
    .map((r) => computeIntrinsicWorthRaw(structuralInputs(r)).raw)
    .filter(isKnown)
    .sort((a, b) => a - b)
  const activeRaw = activeCorpusIds
    ? allRecords
        .filter((r) => activeCorpusIds.has(r.stgoId))
        .map((r) => computeIntrinsicWorthRaw(structuralInputs(r)).raw)
        .filter(isKnown)
        .sort((a, b) => a - b)
    : []
  return {
    santiago: percentileRank(raw, allRaw),
    activeCorpus: activeRaw.length ? percentileRank(raw, activeRaw) : null,
  }
}

export function computeIntrinsicWorth(
  record: SemanticCalibrationRecord,
  opts?: { allRecords?: SemanticCalibrationRecord[]; activeCorpusIds?: Set<string> },
): IntrinsicWorthResult {
  const inputs = structuralInputs(record)
  const { raw, contributions, coverage } = computeIntrinsicWorthRaw(inputs)
  const percentiles =
    opts?.allRecords && isKnown(raw)
      ? buildIntrinsicWorthPercentiles(opts.allRecords, raw, opts.activeCorpusIds)
      : { santiago: null, activeCorpus: null }

  const chronoEffective = record.chronoWorth?.effective ?? record.chronoWorth?.approved ?? record.chronoWorth?.proposed
  const provenance = record.structuralMetricsProvenance ?? record.chronoWorth?.provenance ?? 'UNKNOWN'

  const explanation = buildExplanation({
    scoreName: 'IntrinsicWorth',
    score: raw,
    status: raw == null ? 'UNAVAILABLE' : 'AVAILABLE',
    coverage,
    positive: [
      {
        key: 'heritageDepth',
        label: 'Heritage depth',
        value: inputs.heritageDepth,
        contribution: contributions.heritageDepth,
        available: isKnown(inputs.heritageDepth),
      },
      {
        key: 'anchorDensity',
        label: 'Anchor density',
        value: inputs.anchorDensity,
        contribution: contributions.anchorDensity,
        available: isKnown(inputs.anchorDensity),
      },
    ],
    unknown: METRIC_KEYS.filter((k) => !isKnown(record.structuralMetrics?.[k] ?? null)).map((k) => k),
    provenance: [String(provenance), SCORING_CONFIG_STATUS],
    plain:
      raw == null
        ? 'IntrinsicWorth UNAVAILABLE — one or more structural metrics are UNKNOWN (not treated as zero).'
        : `IntrinsicWorth ${raw} from canonical structural formula (${INTRINSIC_WORTH_WEIGHTS.heritageDepth}·heritage + ${INTRINSIC_WORTH_WEIGHTS.anchorDensity}·anchor + ${INTRINSIC_WORTH_WEIGHTS.microReveal}·micro + ${INTRINSIC_WORTH_WEIGHTS.polish}·polish).` +
          (chronoEffective != null && round1(chronoEffective) !== raw
            ? ` Note: stored ChronoWorth effective=${chronoEffective}.`
            : ''),
  })

  return {
    scoringModelVersion: SCORING_MODEL_VERSION,
    raw,
    status: raw == null ? 'UNAVAILABLE' : 'AVAILABLE',
    contributions,
    inputs: {
      heritageDepth: inputs.heritageDepth,
      anchorDensity: inputs.anchorDensity,
      microReveal: inputs.microReveal,
      polish: inputs.polish,
    },
    percentileSantiago: percentiles.santiago,
    percentileActiveCorpus: percentiles.activeCorpus,
    coverage,
    confidence: explanation.confidence,
    explanation,
  }
}
