/**
 * Gate 2A — named scoring constants.
 * No unexplained magic numbers in scorers; all weights live here.
 */

/** Bounded NodeUtility domain. */
export const NODE_UTILITY_MIN = 0
export const NODE_UTILITY_MAX = 100

/** Component caps (sum of caps = 100). Unavailable components contribute 0 with provenance. */
export const COMPONENT_CAPS = {
  editorial: 30,
  interests: 40,
  structural: 15,
  discovery: 10,
  context: 5,
} as const

/** ChronoWorth is editorial 0–100 when present; missing → 0 contribution (not a fake mid default). */
export const CHRONOWORTH_MISSING_CONTRIBUTION = 0

/** Role soft boosts inside editorial component (secondary to ChronoWorth when present). */
export const EDITORIAL_ROLE_SCORES: Record<string, number> = {
  anchor: 22,
  museum: 18,
  civic: 17,
  memory: 17,
  culture: 14,
  architecture: 14,
  plaza: 12,
  pocket: 12,
  micro: 8,
}

export const EDITORIAL_ROLE_FALLBACK = 6

/** When ChronoWorth present, blend: worth*W + role*(1-W), then scale to editorial cap. */
export const CHRONOWORTH_BLEND = 0.75
export const ROLE_BLEND = 0.25

/** Discovery posture adjustments (absolute points within discovery cap). */
export const DISCOVERY_ADJUSTMENTS = {
  D3_anchorBoost: 8,
  D3_microPenalty: -2,
  D2_microBoost: 8,
  D2_anchorSoft: 2,
  D1_balanced: 5,
} as const

/** Structural mode fit points when node.modes explicitly lists the traveler mode. */
export const STRUCTURAL_MODE_HIT = 12
export const STRUCTURAL_MODE_PARTIAL = 4
export const STRUCTURAL_MODE_MISS = 0

/** Context: already-visited soft demotion (still eligible unless hard-excluded). */
export const CONTEXT_ALREADY_VISITED_PENALTY = -5
export const CONTEXT_STAGED_NODE_NOTE = 0

/** Express/time-boxed soft preference when visit duration UNKNOWN — zero-neutral. */
export const EXPRESS_UNKNOWN_VISIT_CONTRIBUTION = 0
