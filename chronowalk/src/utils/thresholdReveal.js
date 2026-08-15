/**
 * Reveal progress 0 (all Now) → 1 (all Then). Seam follows the clip edge from right to left.
 */
export function revealToClipRight(reveal) {
  const clamped = Math.min(1, Math.max(0, reveal))
  const rightInset = `${clamped * 100}%`
  return `inset(0 ${rightInset} 0 0)`
}

export function revealToSeamPercent(reveal) {
  const clamped = Math.min(1, Math.max(0, reveal))
  return (1 - clamped) * 100
}

export function reducedMotionReveal(holding) {
  return holding ? 1 : 0
}

/** Hold wipe stays linear so the seam reads like a gradual horizontal slider. */
export function easeThresholdProgress(t, ease = 'linear') {
  const x = Math.min(1, Math.max(0, t))
  if (ease === 'easeOut') return 1 - (1 - x) ** 3
  if (ease === 'easeInOut') {
    return x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2
  }
  return x
}
