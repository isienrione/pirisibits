const HINT_KEY = 'cw_threshold_hint_done'

export function hasSeenThresholdHint() {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(HINT_KEY) === 'true'
}

export function markThresholdHintSeen() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(HINT_KEY, 'true')
}
