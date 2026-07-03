import { JOURNEY_STATE } from '../hooks/useGeoLocation'

export const V1_JOURNEY_PHASE = {
  BEFORE_START: 'beforeStart',
  WALKING: 'walking',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  STORY: 'story',
  THRESHOLD: 'threshold',
  COMPLETE: 'complete',
}

export const APPROACHING_DISTANCE_M = 80

export function resolveV1JourneyPhase({
  isTourComplete = false,
  isAwaitingFirstStop = false,
  journeyBegun = false,
  geoState,
  distance = null,
  activeWaypoint = null,
  thresholdActive = false,
  discoveredWaypoint = null,
  cardDismissed = false,
}) {
  if (isTourComplete) return V1_JOURNEY_PHASE.COMPLETE

  if (isAwaitingFirstStop && !journeyBegun) {
    return V1_JOURNEY_PHASE.BEFORE_START
  }

  if (thresholdActive && activeWaypoint) {
    return V1_JOURNEY_PHASE.THRESHOLD
  }

  if (activeWaypoint) {
    return V1_JOURNEY_PHASE.STORY
  }

  if (geoState === JOURNEY_STATE.ARRIVAL) {
    return V1_JOURNEY_PHASE.ARRIVED
  }

  if (
    geoState === JOURNEY_STATE.TRANSIT &&
    distance != null &&
    distance <= APPROACHING_DISTANCE_M
  ) {
    return V1_JOURNEY_PHASE.APPROACHING
  }

  if (discoveredWaypoint && !cardDismissed && !activeWaypoint) {
    return V1_JOURNEY_PHASE.ARRIVED
  }

  return V1_JOURNEY_PHASE.WALKING
}
