/**
 * Gate 2E.5-QA — PhysicalEfficiency Vnext (PARALLEL ONLY).
 * Bounded [0,100], monotonic with worsening movement burden.
 * Not cut into arbitration.
 */

export const PHYSICAL_EFFICIENCY_VNEXT_VERSION = '0.2.pe.vnext.1' as const
export const PHYSICAL_EFFICIENCY_VNEXT_STATUS = 'PARALLEL_ONLY_NOT_IN_ARBITRATION' as const

export type PhysicalEfficiencyVnextInput = {
  dwellMin: number
  totalEstimatedMin: number
  transitionTimesMin: number[]
  maxWalkChunkMin: number
  backtrackingPenalty01: number | null
  geographicProgression01Mean: number | null
  metroTransferCount: number
}

export type PhysicalEfficiencyVnextResult = {
  score: number
  components: {
    dwellShare: number
    transitionBurden: number
    longestTransition: number
    backtracking: number | null
    geographicProgression: number | null
    metroBurden: number
  }
  bounded: true
  range: [0, 100]
  version: typeof PHYSICAL_EFFICIENCY_VNEXT_VERSION
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Parallel bounded PE.
 * All component outputs are in [0,100] after construction; blend stays in [0,100].
 * Worsening transitions (higher mean/max vs maxWalkChunk) strictly lower those components.
 */
export function computePhysicalEfficiencyVnext(
  input: PhysicalEfficiencyVnextInput,
): PhysicalEfficiencyVnextResult {
  const dwellShare =
    input.totalEstimatedMin > 0
      ? clamp01(input.dwellMin / input.totalEstimatedMin) * 100
      : 0
  const transitions = input.transitionTimesMin.filter((t) => t > 0)
  const meanT = transitions.length
    ? transitions.reduce((a, b) => a + b, 0) / transitions.length
    : 0
  const longest = transitions.length ? Math.max(...transitions) : 0
  const chunk = Math.max(1, input.maxWalkChunkMin)
  const transitionBurden = clamp01(1 - meanT / chunk) * 100
  const longestTransition = clamp01(1 - longest / chunk) * 100
  const backtracking =
    input.backtrackingPenalty01 == null
      ? null
      : clamp01(1 - clamp01(input.backtrackingPenalty01)) * 100
  const geographicProgression =
    input.geographicProgression01Mean == null
      ? null
      : clamp01(input.geographicProgression01Mean) * 100
  const metroBurden = clamp01(1 - Math.max(0, input.metroTransferCount) * 0.15) * 100

  const terms: Array<{ v: number; w: number }> = [
    { v: dwellShare, w: 0.25 },
    { v: transitionBurden, w: 0.2 },
    { v: longestTransition, w: 0.15 },
    { v: metroBurden, w: 0.1 },
  ]
  if (backtracking != null) terms.push({ v: backtracking, w: 0.15 })
  if (geographicProgression != null) terms.push({ v: geographicProgression, w: 0.15 })

  const wSum = terms.reduce((a, t) => a + t.w, 0)
  const score = round1(terms.reduce((a, t) => a + t.v * t.w, 0) / wSum)

  return {
    score: Math.max(0, Math.min(100, score)),
    components: {
      dwellShare: round1(dwellShare),
      transitionBurden: round1(transitionBurden),
      longestTransition: round1(longestTransition),
      backtracking: backtracking == null ? null : round1(backtracking),
      geographicProgression:
        geographicProgression == null ? null : round1(geographicProgression),
      metroBurden: round1(metroBurden),
    },
    bounded: true,
    range: [0, 100],
    version: PHYSICAL_EFFICIENCY_VNEXT_VERSION,
  }
}
