import { JOURNEY_PACE, JOURNEY_PATH } from '../data/romePacing'
import { shouldClassicDayBreak } from '../content/actBoundaries.js'
import { buildEffectiveSequence, getPromotionInsertSteps } from '../content/optionalPromotion.js'
import { resolveResumeCue, wasAwayLongEnough } from '../content/journeyResume.js'
import { migratePersistedJourneyState } from '../redesign/lib/redesignJourneyState.js'

const STORAGE_KEY = 'cw_journey_v1'

export const JOURNEY_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  STORY: 'story',
  THRESHOLD: 'threshold',
  PAUSED: 'paused',
  DAY_COMPLETE: 'dayComplete',
  COMPLETE: 'complete',
}

/**
 * The sacred, cinematic moments of the walk. During these the global bottom
 * navigation and app chrome are hidden so the screen feels immersive rather
 * than like a normal app view. Single source of truth for both the tab bar and
 * the chrome context so the two systems can never disagree.
 */
export const IMMERSIVE_JOURNEY_STATES = new Set([
  JOURNEY_STATES.ARRIVED,
  JOURNEY_STATES.STORY,
  JOURNEY_STATES.THRESHOLD,
  JOURNEY_STATES.PAUSED,
  JOURNEY_STATES.DAY_COMPLETE,
  JOURNEY_STATES.COMPLETE,
])

const IMMERSIVE_JOURNEY_STATES_LOWER = new Set(
  [...IMMERSIVE_JOURNEY_STATES].map((value) => value.toLowerCase()),
)

/** True when the journey state should render chrome-free (case-tolerant). */
export function isImmersiveJourneyState(state) {
  if (typeof state !== 'string') return false
  if (IMMERSIVE_JOURNEY_STATES.has(state)) return true
  return IMMERSIVE_JOURNEY_STATES_LOWER.has(state.toLowerCase())
}

const defaultContext = () => ({
  pace: JOURNEY_PACE.CLASSIC,
  path: JOURNEY_PATH.A,
  currentWaypointIndex: 0,
  currentSequenceIndex: 0,
  completedWaypointIds: [],
  completedTransitIds: [],
  promotedOptionalIds: [],
  pathLocked: false,
  pausedAt: null,
  lastActiveAt: null,
  pendingResumeCue: null,
  customWaypointIds: null,
})

const defaultState = () => ({
  state: JOURNEY_STATES.IDLE,
  context: defaultContext(),
})

function readStorage() {
  if (typeof window === 'undefined') return defaultState()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    const mergedContext = {
      ...defaultContext(),
      ...parsed.context,
    }

    if (mergedContext.dayNumber != null && mergedContext.pace == null) {
      mergedContext.pace = JOURNEY_PACE.CLASSIC
    }

    delete mergedContext.dayNumber

    if (mergedContext.currentSequenceIndex == null) {
      mergedContext.currentSequenceIndex = mergedContext.currentWaypointIndex ?? 0
    }

    if (mergedContext.completedTransitIds == null) {
      mergedContext.completedTransitIds = []
    }

    if (mergedContext.pathLocked == null) {
      mergedContext.pathLocked = false
    }

    if (mergedContext.promotedOptionalIds == null) {
      mergedContext.promotedOptionalIds = []
    }

    if (mergedContext.lastActiveAt == null && mergedContext.pausedAt != null) {
      mergedContext.lastActiveAt = mergedContext.pausedAt
    }

    if (mergedContext.pendingResumeCue == null) {
      mergedContext.pendingResumeCue = null
    }

    if (mergedContext.customWaypointIds == null) {
      mergedContext.customWaypointIds = null
    }

    return {
      state: migratePersistedJourneyState(parsed.state ?? JOURNEY_STATES.IDLE),
      context: mergedContext,
    }
  } catch {
    return defaultState()
  }
}

function writeStorage(next) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

let snapshot = readStorage()
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener(snapshot))
}

export function getJourneySnapshot() {
  return snapshot
}

export function subscribeJourney(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function transitionJourney(nextState, contextPatch = {}) {
  snapshot = {
    state: nextState,
    context: {
      ...snapshot.context,
      ...contextPatch,
      lastActiveAt: contextPatch.lastActiveAt ?? Date.now(),
      pausedAt: nextState === JOURNEY_STATES.PAUSED ? Date.now() : null,
    },
  }
  writeStorage(snapshot)
  emit()
  return snapshot
}

export function isResumableJourney(journeySnapshot = snapshot) {
  if (
    journeySnapshot.state === JOURNEY_STATES.COMPLETE ||
    journeySnapshot.state === JOURNEY_STATES.IDLE
  ) {
    return false
  }

  const { currentSequenceIndex = 0, completedWaypointIds = [] } = journeySnapshot.context
  return currentSequenceIndex > 0 || completedWaypointIds.length > 0
}

export function resumeJourney(now = Date.now()) {
  if (!isResumableJourney()) return snapshot

  const cue = resolveResumeCue(snapshot.context.lastActiveAt, now)
  const nextState =
    snapshot.state === JOURNEY_STATES.IDLE ? JOURNEY_STATES.WALKING : snapshot.state

  return transitionJourney(nextState, { pendingResumeCue: cue })
}

export function prepareResumeCueIfNeeded(now = Date.now()) {
  if (!isResumableJourney()) return snapshot
  if (snapshot.context.pendingResumeCue) return snapshot
  if (!wasAwayLongEnough(snapshot.context.lastActiveAt, now)) return snapshot

  const cue = resolveResumeCue(snapshot.context.lastActiveAt, now)
  return transitionJourney(snapshot.state, { pendingResumeCue: cue })
}

export function clearPendingResumeCue() {
  if (!snapshot.context.pendingResumeCue) return snapshot
  return transitionJourney(snapshot.state, { pendingResumeCue: null })
}

export function resetJourney() {
  snapshot = defaultState()
  writeStorage(snapshot)
  emit()
  return snapshot
}

export function beginJourney({
  pace = JOURNEY_PACE.CLASSIC,
  path = JOURNEY_PATH.A,
  waypointIndex = 0,
  sequenceIndex = 0,
  customWaypointIds = null,
} = {}) {
  return transitionJourney(JOURNEY_STATES.WALKING, {
    pace,
    path,
    currentWaypointIndex: waypointIndex,
    currentSequenceIndex: sequenceIndex,
    completedWaypointIds: [],
    completedTransitIds: [],
    promotedOptionalIds: [],
    pathLocked: false,
    pendingResumeCue: null,
    customWaypointIds,
  })
}

export function setCustomWaypointIds(customWaypointIds) {
  return transitionJourney(snapshot.state, {
    customWaypointIds: customWaypointIds?.length ? [...customWaypointIds] : null,
  })
}

export function setJourneyPace(pace) {
  return transitionJourney(snapshot.state, { pace })
}

export function markWaypointComplete(waypointId) {
  const completed = snapshot.context.completedWaypointIds.includes(waypointId)
    ? snapshot.context.completedWaypointIds
    : [...snapshot.context.completedWaypointIds, waypointId]

  return transitionJourney(snapshot.state, {
    completedWaypointIds: completed,
  })
}

export function advanceWaypointIndex(nextIndex) {
  return transitionJourney(snapshot.state, {
    currentWaypointIndex: nextIndex,
  })
}

export function advanceSequenceIndex(manifest = null) {
  const next = transitionJourney(JOURNEY_STATES.WALKING, {
    currentSequenceIndex: snapshot.context.currentSequenceIndex + 1,
  })
  return markJourneyCompleteIfPastEnd(manifest, next)
}

function markJourneyCompleteIfPastEnd(manifest, journeySnapshot = snapshot) {
  if (!manifest) return journeySnapshot
  const { path, currentSequenceIndex, promotedOptionalIds } = journeySnapshot.context
  const sequence = buildEffectiveSequence(manifest, path, promotedOptionalIds)
  if (currentSequenceIndex >= sequence.length && journeySnapshot.state !== JOURNEY_STATES.COMPLETE) {
    return transitionJourney(JOURNEY_STATES.COMPLETE, { currentSequenceIndex })
  }
  return journeySnapshot
}

export function setJourneyPath(path) {
  return transitionJourney(snapshot.state, {
    path,
    pathLocked: true,
  })
}

export function markTransitComplete(transitId) {
  const completed = snapshot.context.completedTransitIds.includes(transitId)
    ? snapshot.context.completedTransitIds
    : [...snapshot.context.completedTransitIds, transitId]

  return transitionJourney(snapshot.state, {
    completedTransitIds: completed,
  })
}

export function setActiveWaypointIndex(waypointId, manifest) {
  const index = manifest?.waypoints?.findIndex((waypoint) => waypoint.id === waypointId) ?? -1
  return transitionJourney(snapshot.state, {
    currentWaypointIndex: index >= 0 ? index : snapshot.context.currentWaypointIndex,
  })
}

export function completeWaypointAndAdvance(waypointId, manifest = null) {
  const alreadyComplete = snapshot.context.completedWaypointIds.includes(waypointId)
  markWaypointComplete(waypointId)

  if (shouldClassicDayBreak(snapshot.context.pace, waypointId)) {
    return transitionJourney(JOURNEY_STATES.DAY_COMPLETE)
  }

  // Threshold or story completion can fire twice (e.g. back → arrived → threshold
  // again). Never skip the next transit/waypoint by advancing the index twice.
  if (alreadyComplete) {
    return markJourneyCompleteIfPastEnd(manifest, transitionJourney(JOURNEY_STATES.WALKING))
  }

  return advanceSequenceIndex(manifest)
}

export function continueFromDayComplete(manifest = null) {
  return advanceSequenceIndex(manifest)
}

export function jumpToSequenceIndex(index) {
  const nextIndex = Math.max(0, Math.floor(index))
  return transitionJourney(JOURNEY_STATES.WALKING, {
    currentSequenceIndex: nextIndex,
  })
}

export function completeStoryAfterThreshold(waypointId, manifest = null) {
  return completeWaypointAndAdvance(waypointId, manifest)
}

export function promoteOptionalWaypoint(waypointId, manifest) {
  const { path, promotedOptionalIds = [], currentSequenceIndex } = snapshot.context
  if (promotedOptionalIds.includes(waypointId)) return snapshot

  const newPromoted = [...promotedOptionalIds, waypointId]
  const inserts = getPromotionInsertSteps(manifest, waypointId, path)
  const newEffective = buildEffectiveSequence(manifest, path, newPromoted)
  const firstInsertId = inserts[0]
  const newIndex = firstInsertId ? newEffective.indexOf(firstInsertId) : currentSequenceIndex

  return transitionJourney(JOURNEY_STATES.WALKING, {
    promotedOptionalIds: newPromoted,
    currentSequenceIndex: newIndex >= 0 ? newIndex : currentSequenceIndex,
  })
}
