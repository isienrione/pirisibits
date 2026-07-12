const TUTORIAL_KEY = 'cw_threshold_reveal_tutorial_seen'

/** True after the traveler has seen the threshold tutorial (auto or prompted). */
export function hasSeenThresholdRevealTutorial() {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(TUTORIAL_KEY) === 'true'
}

export function markThresholdRevealTutorialSeen() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(TUTORIAL_KEY, 'true')
}

/** @deprecated Use hasSeenThresholdRevealTutorial */
export function hasSeenWaypointRevealInvite() {
  return hasSeenThresholdRevealTutorial()
}

/** @deprecated Use markThresholdRevealTutorialSeen */
export function markWaypointRevealInviteSeen() {
  markThresholdRevealTutorialSeen()
}
