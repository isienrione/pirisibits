import { JOURNEY_PACE, JOURNEY_PATH } from '../data/romePacing'

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

const defaultContext = () => ({
  pace: JOURNEY_PACE.CLASSIC,
  path: JOURNEY_PATH.A,
  currentWaypointIndex: 0,
  completedWaypointIds: [],
  pausedAt: null,
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

    return {
      state: parsed.state ?? JOURNEY_STATES.IDLE,
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
      pausedAt: nextState === JOURNEY_STATES.PAUSED ? Date.now() : null,
    },
  }
  writeStorage(snapshot)
  emit()
  return snapshot
}

export function resetJourney() {
  snapshot = defaultState()
  writeStorage(snapshot)
  emit()
  return snapshot
}

export function beginJourney({ pace = JOURNEY_PACE.CLASSIC, path = JOURNEY_PATH.A, waypointIndex = 0 } = {}) {
  return transitionJourney(JOURNEY_STATES.WALKING, {
    pace,
    path,
    currentWaypointIndex: waypointIndex,
    completedWaypointIds: [],
  })
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
