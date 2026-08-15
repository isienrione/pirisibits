import {
  getJourneySnapshot,
  jumpToSequenceIndex,
  JOURNEY_STATES,
  openJourneyAtSequence,
  promoteOptionalWaypoint,
  transitionJourney,
} from '../state/journey.js'
import { findSequenceIndexForWaypoint } from '../content/myTourPlan.js'
import { getPromotionInsertSteps } from '../content/optionalPromotion.js'
import { normalizeRedesignJourneyState } from '../redesign/lib/redesignJourneyState.js'

const STORY_VIEW_KEY = 'cw_story_view'
const STORY_CHAPTER_KEY = 'cw_story_chapter'

const IDLE_LIKE = new Set([
  JOURNEY_STATES.IDLE,
  JOURNEY_STATES.COMPLETE,
  JOURNEY_STATES.DAY_COMPLETE,
])

/** Jump the linear journey to a manifest waypoint id and optional target state. */
export function jumpToWaypointInJourney(manifest, waypointId, context, state, options = {}) {
  if (!manifest || !waypointId) return false

  const { targetState = null, storyView = null, chapterIndex = null } = options
  const path = context.path || manifest.journey?.default_path || 'a'
  let promoted = context.promotedOptionalIds ?? []
  let index = findSequenceIndexForWaypoint(manifest, waypointId, path, promoted)

  // Route / Tour jumps onto path-A optionals (e.g. Palatine) should promote first
  // so the stop exists in the effective sequence without wiping progress.
  if (index < 0 && getPromotionInsertSteps(manifest, waypointId, path).length > 0) {
    promoteOptionalWaypoint(waypointId, manifest)
    promoted = getJourneySnapshot().context.promotedOptionalIds ?? [...promoted, waypointId]
    index = findSequenceIndexForWaypoint(manifest, waypointId, path, promoted)
  }

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

  if (typeof window !== 'undefined') {
    if (storyView) {
      window.sessionStorage.setItem(STORY_VIEW_KEY, storyView)
    }
    if (chapterIndex != null && Number.isFinite(Number(chapterIndex))) {
      window.sessionStorage.setItem(STORY_CHAPTER_KEY, String(Math.max(0, Math.floor(chapterIndex))))
    } else {
      window.sessionStorage.removeItem(STORY_CHAPTER_KEY)
    }
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

/** Optional chapter index set by route-poster / listen jumps. */
export function consumeStoryChapterIntent() {
  if (typeof window === 'undefined') return null
  const value = window.sessionStorage.getItem(STORY_CHAPTER_KEY)
  if (value == null) return null
  window.sessionStorage.removeItem(STORY_CHAPTER_KEY)
  const index = Number(value)
  return Number.isFinite(index) && index >= 0 ? Math.floor(index) : null
}
