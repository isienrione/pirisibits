/**
 * ArcQuality V0.2 adapter.
 *
 * Gate 2E.2E does not retune ArcQuality. This module wraps the frozen V0.1
 * evaluator and tags the result as arcQualityVersion = 0.2.hypothesis.1.
 */

export const ARC_QUALITY_VERSION_V02 = '0.2.hypothesis.1' as const
export const ARC_QUALITY_V02_STATUS = 'PROVISIONAL_V0_2_ADAPTER' as const

/** Legacy cross-lane blend experiment (Gate 2E.2D). Not production arbitration. */
export const LEGACY_BLEND_EXPERIMENT_ID = 'LEGACY_CROSS_LANE_BLEND_EXPERIMENT' as const

export const LEGACY_BLENDS = {
  B0: { composer: 1.0, arcQuality: 0.0, label: 'B0 100% Composer / 0% ArcQuality' },
  B1: { composer: 0.75, arcQuality: 0.25, label: 'B1 75/25' },
  B2: { composer: 0.6, arcQuality: 0.4, label: 'B2 60/40' },
  B3: { composer: 0.5, arcQuality: 0.5, label: 'B3 50/50' },
  B4: { composer: 0.4, arcQuality: 0.6, label: 'B4 40/60' },
} as const

export type LegacyBlendId = keyof typeof LEGACY_BLENDS
