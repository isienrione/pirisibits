/**
 * Gate 2E.4 — on-path / pass-through geometry contract.
 * Do not fabricate route geometry. Insufficient evidence ⇒ onPath = UNKNOWN (null).
 */

export type OnPathEvidence = {
  /** Canonical walk edge / corridor geometry available between neighbors? */
  hasCanonicalCorridorGeometry: boolean | null
  /** Explicit evidence that the place lies on that corridor. */
  placeOnCorridorEvidence: boolean | null
  /** Geometry quality flag from physical graph (optional). */
  geometryQuality?: 'SUFFICIENT' | 'INSUFFICIENT' | 'UNKNOWN' | null
}

/**
 * Determine on-path status.
 * Returns:
 * - true when sufficient evidence places the experience on the corridor
 * - false when sufficient evidence places it off the corridor
 * - null (UNKNOWN) when geometry/evidence is insufficient
 */
export function resolveOnPath(evidence: OnPathEvidence): boolean | null {
  if (
    evidence.hasCanonicalCorridorGeometry !== true ||
    evidence.geometryQuality === 'INSUFFICIENT' ||
    evidence.geometryQuality === 'UNKNOWN' ||
    evidence.geometryQuality == null
  ) {
    // Missing or insufficient geometry ⇒ UNKNOWN, never false-as-evidence.
    if (evidence.hasCanonicalCorridorGeometry !== true) return null
    if (evidence.geometryQuality !== 'SUFFICIENT') return null
  }

  if (evidence.placeOnCorridorEvidence === true) return true
  if (evidence.placeOnCorridorEvidence === false) return false
  return null
}

/**
 * PASS_THROUGH semantics:
 * - Does NOT mean zero dwell automatically.
 * - Means the place can be experienced with low marginal *movement* when on-path.
 */
export function passThroughImpliesZeroDwell(): false {
  return false
}
