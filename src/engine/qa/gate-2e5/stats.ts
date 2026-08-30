/**
 * Gate 2E.5-QA — shared distribution helpers (measurement only).
 */

export type DistSummary = {
  n: number
  min: number | null
  p10: number | null
  p25: number | null
  median: number | null
  mean: number | null
  p75: number | null
  p90: number | null
  max: number | null
  std: number | null
  negativeCount: number
  above100Count: number
}

export function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null
  if (sorted.length === 1) return sorted[0]!
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  if (lo === hi) return sorted[lo]!
  const w = pos - lo
  return sorted[lo]! * (1 - w) + sorted[hi]! * w
}

export function summarize(values: Array<number | null | undefined>): DistSummary {
  const xs = values.filter((v): v is number => v != null && Number.isFinite(v)).slice().sort((a, b) => a - b)
  if (!xs.length) {
    return {
      n: 0,
      min: null,
      p10: null,
      p25: null,
      median: null,
      mean: null,
      p75: null,
      p90: null,
      max: null,
      std: null,
      negativeCount: 0,
      above100Count: 0,
    }
  }
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length
  return {
    n: xs.length,
    min: xs[0]!,
    p10: quantile(xs, 0.1),
    p25: quantile(xs, 0.25),
    median: quantile(xs, 0.5),
    mean,
    p75: quantile(xs, 0.75),
    p90: quantile(xs, 0.9),
    max: xs[xs.length - 1]!,
    std: Math.sqrt(variance),
    negativeCount: xs.filter((v) => v < 0).length,
    above100Count: xs.filter((v) => v > 100).length,
  }
}

export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < xs.length; i++) {
    const a = xs[i]! - mx
    const b = ys[i]! - my
    num += a * b
    dx += a * a
    dy += b * b
  }
  if (dx <= 0 || dy <= 0) return null
  return num / Math.sqrt(dx * dy)
}

export function round3(n: number | null): number | null {
  if (n == null || !Number.isFinite(n)) return null
  return Math.round(n * 1000) / 1000
}
