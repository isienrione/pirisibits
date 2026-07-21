const CROSSED_KEY = 'chronowalk.hasCrossedThreshold'
/** Legacy keys from earlier invite / hint tutorials — honor so returning travelers aren't re-taught. */
const LEGACY_KEYS = ['cw_threshold_reveal_tutorial_seen', 'cw_threshold_hint_done']

function readFlag(key) {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    // Storage unavailable — treat as already crossed so we only show a brief ring.
    return true
  }
}

function writeFlag(key) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, 'true')
  } catch {
    /* ignore quota / private mode */
  }
}

function waypointCrossedKey(waypointId) {
  return `chronowalk.threshold_crossed.${waypointId}`
}

/** True after the traveler has successfully held to cross a threshold at least once. */
export function hasCrossedThreshold() {
  if (readFlag(CROSSED_KEY)) return true
  return LEGACY_KEYS.some((key) => readFlag(key))
}

/** True after the traveler has crossed the threshold at this specific stop. */
export function hasCrossedThresholdAtWaypoint(waypointId) {
  if (!waypointId) return hasCrossedThreshold()
  return readFlag(waypointCrossedKey(waypointId))
}

/** Persist that the hold gesture has been learned. */
export function markThresholdCrossed() {
  writeFlag(CROSSED_KEY)
  // Keep legacy keys in sync so older code paths stay coherent.
  for (const key of LEGACY_KEYS) writeFlag(key)
}

/** Persist a successful cross for this stop (and the global learned flag). */
export function markThresholdCrossedAtWaypoint(waypointId) {
  markThresholdCrossed()
  if (waypointId) writeFlag(waypointCrossedKey(waypointId))
}

/** @deprecated Use hasCrossedThreshold */
export function hasSeenThresholdRevealTutorial() {
  return hasCrossedThreshold()
}

/** @deprecated Use markThresholdCrossed */
export function markThresholdRevealTutorialSeen() {
  markThresholdCrossed()
}

/** @deprecated Use hasCrossedThreshold */
export function hasSeenWaypointRevealInvite() {
  return hasCrossedThreshold()
}

/** @deprecated Use markThresholdCrossed */
export function markWaypointRevealInviteSeen() {
  markThresholdCrossed()
}

export { CROSSED_KEY }
