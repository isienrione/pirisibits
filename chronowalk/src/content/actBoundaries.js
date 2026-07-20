import { JOURNEY_PACE, ROME_ACTS } from '../data/romePacing.js'

export function getClassicDayBreakWaypointId() {
  const act4 = ROME_ACTS.find((act) => act.id === 'act4')
  return act4?.waypoints.at(-1) ?? 'w14'
}

export function shouldClassicDayBreak(pace, waypointId) {
  return pace === JOURNEY_PACE.CLASSIC && waypointId === getClassicDayBreakWaypointId()
}
