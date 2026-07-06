import { getDebugGeoPlacement, isDebugGeo } from '../config/env.js'
import {
  beginJourney,
  jumpToSequenceIndex,
  JOURNEY_STATES,
  transitionJourney,
} from '../state/journey.js'
import { findSequenceIndexForWaypoint } from './debugWaypoint.js'

/** Jump the linear journey to a manifest waypoint id and enter walk/arrived state. */
export function jumpToWaypointInJourney(manifest, waypointId, context, state) {
  if (!manifest || !waypointId) return false

  const path = context.path || manifest.journey?.default_path || 'a'
  const index = findSequenceIndexForWaypoint(
    manifest,
    waypointId,
    path,
    context.promotedOptionalIds ?? [],
  )
  if (index < 0) return false

  if (state === JOURNEY_STATES.IDLE || state === JOURNEY_STATES.COMPLETE) {
    beginJourney({
      pace: context.pace || 'classic',
      path,
      waypointIndex: 0,
    })
  }

  jumpToSequenceIndex(index)

  const placement = getDebugGeoPlacement()
  transitionJourney(
    isDebugGeo() && placement === 'arrived'
      ? JOURNEY_STATES.ARRIVED
      : JOURNEY_STATES.WALKING,
  )

  return true
}
