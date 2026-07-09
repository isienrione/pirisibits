const INVITE_PREFIX = 'cw_waypoint_reveal_invite_'

function storageKey(waypointId) {
  return `${INVITE_PREFIX}${waypointId}`
}

export function hasSeenWaypointRevealInvite(waypointId) {
  if (!waypointId || typeof window === 'undefined') return true
  return window.localStorage.getItem(storageKey(waypointId)) === 'true'
}

export function markWaypointRevealInviteSeen(waypointId) {
  if (!waypointId || typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(waypointId), 'true')
}
