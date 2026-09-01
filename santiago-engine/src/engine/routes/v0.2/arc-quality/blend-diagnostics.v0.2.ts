/**
 * LEGACY CROSS-LANE BLEND EXPERIMENT (Gate 2E.2D B0–B4).
 *
 * Compares lane-specific ComposerScore against ArcQuality.
 * Winner distributions from this experiment are NOT canonical selection
 * after Gate 2E.2E. Preserved as diagnostics only.
 */

import { round1 } from '@/src/engine/scoring/v0.2/utils'
import type { ComposerLane, LaneCandidateV02 } from '@/src/engine/routes/v0.2/composer/composer-types.v0.2'
import type { ArcQualityResultV02 } from '@/src/engine/routes/v0.2/arc-quality/arc-quality.v0.2'
import {
  LEGACY_BLEND_EXPERIMENT_ID,
  LEGACY_BLENDS,
  type LegacyBlendId,
} from '@/src/engine/routes/v0.2/arc-quality/arc-quality-config.v0.2'

export type LegacyBlendWinner = {
  experimentId: typeof LEGACY_BLEND_EXPERIMENT_ID
  blendId: LegacyBlendId
  label: string
  canonicalSelection: false
  winnerLane: ComposerLane | null
  winnerRouteId: string | null
  scores: Array<{
    lane: ComposerLane
    composerScore: number
    arcQuality: number
    blended: number
  }>
}

export function runLegacyBlendExperiment(
  candidates: LaneCandidateV02[],
  arcByRouteId: Map<string, ArcQualityResultV02>,
): Record<LegacyBlendId, LegacyBlendWinner> {
  const out = {} as Record<LegacyBlendId, LegacyBlendWinner>
  for (const blendId of Object.keys(LEGACY_BLENDS) as LegacyBlendId[]) {
    const mix = LEGACY_BLENDS[blendId]
    const scores = candidates
      .filter((c): c is LaneCandidateV02 & { originatingLane: ComposerLane } => c.originatingLane !== 'H1')
      .map((c) => {
        const arc = arcByRouteId.get(c.candidate.routeId)?.normalizedScore ?? 0
        return {
          lane: c.originatingLane,
          composerScore: c.composerScore,
          arcQuality: arc,
          blended: round1(mix.composer * c.composerScore + mix.arcQuality * arc),
        }
      })
      .sort(
        (a, b) =>
          b.blended - a.blended || a.lane.localeCompare(b.lane),
      )
    const top = scores[0]
    out[blendId] = {
      experimentId: LEGACY_BLEND_EXPERIMENT_ID,
      blendId,
      label: mix.label,
      canonicalSelection: false,
      winnerLane: top?.lane ?? null,
      winnerRouteId:
        top == null
          ? null
          : candidates.find((c) => c.originatingLane === top.lane)?.candidate.routeId ?? null,
      scores,
    }
  }
  return out
}
