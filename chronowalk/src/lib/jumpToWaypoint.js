import {
  jumpToSequenceIndex,
  JOURNEY_STATES,
  openJourneyAtSequence,
  transitionJourney,
} from '../state/journey.js'
import { findSequenceIndexForWaypoint } from '../content/myTourPlan.js'
import { normalizeRedesignJourneyState } from '../redesign/lib/redesignJourneyState.js'

const STORY_VIEW_KEY = 'cw_story_view'

const IDLE_LIKE = new Set([
  JOURNEY_STATES.IDLE,
  JOURNEY_STATES.COMPLETE,
  JOURNEY_STATES.DAY_COMPLETE,
])

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

  // Never wipe completed stops when opening a stop from Tour/Map/Home.
  // Fresh progress clears only via Start Over / Restore purchase (explicit reset).
  if (IDLE_LIKE.has(state)) {
    openJourneyAtSequence({
      pace: context.pace || 'classic',
      path,
      sequenceIndex: index,
      customWaypointIds: context.customWaypointIds,
    })
  } else {
    jumpToSequenceIndex(index)
  }

  if (storyView && typeof window !== 'undefined') {
    window.sessionStorage.setItem(STORY_VIEW_KEY, storyView)
  }

  // When an explicit targetState is provided (e.g. STORY for "Listen here" or
  // THRESHOLD for the dev panel), honour it. THRESHOLD is special and must not
  // be normalised away. When the caller passes null (the "Walk here" button),
  // always resolve to WALKING - never let the old debug-geo "arrived" placement
  // silently redirect a walk-intent jump into STORY, which locked the UI.
  const resolvedState =
    targetState === JOURNEY_STATES.THRESHOLD
      ? JOURNEY_STATES.THRESHOLD
      : targetState != null
        ? normalizeRedesignJourneyState(targetState)
        : JOURNEY_STATES.WALKING

  transitionJourney(resolvedState)

  return true
}

export function consumeStoryViewIntent() {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(STORY_VIEW_KEY)
  if (value) window.sessionStorage.removeItem(STORY_VIEW_KEY)
  return value
}
