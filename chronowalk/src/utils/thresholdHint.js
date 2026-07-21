const HINT_KEY = 'cw_threshold_hint_done'

export function hasSeenThresholdHint() {
  if (typeof window === 'undefined') return true
  try {
    if (window.localStorage.getItem(HINT_KEY) === 'true') return true
    // Prefer the unified crossed-threshold flag when present.
    if (window.localStorage.getItem('chronowalk.hasCrossedThreshold') === 'true') return true
  } catch {
    return true
  }
  return false
}

export function markThresholdHintSeen() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HINT_KEY, 'true')
    window.localStorage.setItem('chronowalk.hasCrossedThreshold', 'true')
  } catch {
    /* ignore */
  }
}
