/** Convert decibels to linear gain for Web Audio nodes. */
export function dbToGain(db) {
  return 10 ** (db / 20)
}
