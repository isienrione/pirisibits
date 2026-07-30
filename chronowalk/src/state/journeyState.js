/** Launch-core journey flow states (not GPS transit/arrival · see useGeoLocation). */
export const JOURNEY_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  APPROACHING: 'approaching',
  ARRIVED: 'arrived',
  STORY: 'story',
  THRESHOLD: 'threshold',
  COMPLETE: 'complete',
}

export const JOURNEY_STATE_LIST = Object.values(JOURNEY_STATES)

const STORAGE_KEY = 'chronowalk:journey-launch'

export const defaultJourneyContext = () => ({
  currentStopId: null,
  currentStopIndex: 0,
  completedStopIds: [],
  audioProgress: 0,
  hasAccess: true,
  lastUpdatedAt: new Date().toISOString(),
})

export const defaultJourneySnapshot = () => ({
  state: JOURNEY_STATES.IDLE,
  context: defaultJourneyContext(),
})

function normalizeContext(raw = {}) {
  return {
    ...defaultJourneyContext(),
    ...raw,
    completedStopIds: Array.isArray(raw.completedStopIds) ? raw.completedStopIds : [],
    audioProgress:
      typeof raw.audioProgress === 'number' && Number.isFinite(raw.audioProgress)
        ? Math.min(1, Math.max(0, raw.audioProgress))
        : 0,
    hasAccess: raw.hasAccess !== false,
    lastUpdatedAt:
      typeof raw.lastUpdatedAt === 'string' ? raw.lastUpdatedAt : new Date().toISOString(),
  }
}

function normalizeSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return defaultJourneySnapshot()

  const state = JOURNEY_STATE_LIST.includes(raw.state) ? raw.state : JOURNEY_STATES.IDLE

  return {
    state,
    context: normalizeContext(raw.context),
  }
}

export function readJourneyFromStorage() {
  if (typeof window === 'undefined') return defaultJourneySnapshot()

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultJourneySnapshot()
    return normalizeSnapshot(JSON.parse(raw))
  } catch {
    return defaultJourneySnapshot()
  }
}

function writeJourneyToStorage(snapshot) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (error) {
    console.warn('journeyState: failed to persist journey snapshot.', error)
  }
}

let snapshot = readJourneyFromStorage()
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function commit(nextSnapshot) {
  snapshot = normalizeSnapshot(nextSnapshot)
  writeJourneyToStorage(snapshot)
  emit()
}

export function getJourneySnapshot() {
  return snapshot
}

export function subscribeJourney(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setJourneyState(nextState) {
  if (!JOURNEY_STATE_LIST.includes(nextState)) return snapshot

  commit({
    state: nextState,
    context: {
      ...snapshot.context,
      lastUpdatedAt: new Date().toISOString(),
    },
  })

  return snapshot
}

export function updateJourneyContext(patch) {
  if (!patch || typeof patch !== 'object') return snapshot

  commit({
    state: snapshot.state,
    context: {
      ...snapshot.context,
      ...patch,
      lastUpdatedAt: new Date().toISOString(),
    },
  })

  return snapshot
}

export function resetJourney() {
  commit(defaultJourneySnapshot())
  return snapshot
}

/** Dev / test helper · replace entire snapshot. */
export function hydrateJourney(nextSnapshot) {
  commit(nextSnapshot)
  return snapshot
}

export function getJourneyStorageKey() {
  return STORAGE_KEY
}
