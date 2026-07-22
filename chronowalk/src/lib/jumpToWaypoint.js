import { getDebugGeoPlacement, isDebugGeo } from '../config/env.js'
import {
  beginJourney,
  jumpToSequenceIndex,
  JOURNEY_STATES,
  transitionJourney,
} from '../state/journey.js'
import { findSequenceIndexForWaypoint } from '../content/myTourPlan.js'
import { normalizeRedesignJourneyState } from '../redesign/lib/redesignJourneyState.js'

const STORY_VIEW_KEY = 'cw_story_view'

/** Jump the linear journey to a manifest waypoint id and optional target state. */
export function jumpToWaypointInJourney(manifest, waypointId, context, state, options = {}) {
  if (!manifest || !waypointId) return false

  const { targetState = null, storyView = null } = options
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
      sequenceIndex: index,
      customWaypointIds: context.customWaypointIds,
    })
  } else {
    jumpToSequenceIndex(index)
  }

  if (storyView && typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORY_VIEW_KEY, storyView)
  }

  const placement = getDebugGeoPlacement()
  const fallback =
    isDebugGeo() && placement === 'arrived' ? JOURNEY_STATES.ARRIVED : JOURNEY_STATES.WALKING

  const resolvedState =
    targetState === JOURNEY_STATES.THRESHOLD
      ? JOURNEY_STATES.THRESHOLD
      : normalizeRedesignJourneyState(targetState ?? fallback)

  transitionJourney(resolvedState)

  return true
}

export function consumeStoryViewIntent() {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(STORY_VIEW_KEY)
  if (value) window.sessionStorage.removeItem(STORY_VIEW_KEY)
  return value
}
