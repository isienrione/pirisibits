/**
 * ArcQuality V0.2 — adapter over V0.1 computeArcQuality.
 * Does not change V0.1 implementation or weights.
 */

import { computeArcQuality, tryComputeArcQuality, type ArcQualityResult } from '@/src/engine/routes/arc-quality'
import type { RouteCandidateV01 } from '@/src/engine/routes/route-types'
import {
  ARC_QUALITY_V02_STATUS,
  ARC_QUALITY_VERSION_V02,
} from '@/src/engine/routes/v0.2/arc-quality/arc-quality-config.v0.2'

export type ArcQualityResultV02 = ArcQualityResult & {
  arcQualityVersion: typeof ARC_QUALITY_VERSION_V02
  arcQualityV02Status: typeof ARC_QUALITY_V02_STATUS
  adapterOnly: true
}

export function computeArcQualityV02(candidate: RouteCandidateV01): ArcQualityResultV02 {
  const inner = computeArcQuality(candidate)
  return {
    ...inner,
    arcQualityVersion: ARC_QUALITY_VERSION_V02,
    arcQualityV02Status: ARC_QUALITY_V02_STATUS,
    adapterOnly: true,
  }
}

export function tryComputeArcQualityV02(
  candidate: RouteCandidateV01,
): { ok: true; result: ArcQualityResultV02 } | { ok: false; reasons: string[] } {
  const inner = tryComputeArcQuality(candidate)
  if (!inner.ok) return { ok: false, reasons: inner.validation.reasons }
  return {
    ok: true,
    result: {
      ...inner.arc,
      arcQualityVersion: ARC_QUALITY_VERSION_V02,
      arcQualityV02Status: ARC_QUALITY_V02_STATUS,
      adapterOnly: true,
    },
  }
}
