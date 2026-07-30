/** Center-slice clip - NOW band shrinks toward the middle as reveal increases. */
export function landingThresholdClip(reveal) {
  const inset = Math.min(1, Math.max(0, reveal)) * 50
  return `inset(0 ${inset}% 0 ${inset}%)`
}
