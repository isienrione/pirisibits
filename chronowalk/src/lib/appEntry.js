import { getJourneySnapshot, JOURNEY_STATES } from '../state/journey.js'
import { readPurchasedTier } from './pendingPurchase.js'

const APP_ENTRY_DONE_KEY = 'cw_app_entry_done_v1'

/** True once the traveler has crossed from marketing into the app shell. */
export function isAppEntryComplete() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(APP_ENTRY_DONE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markAppEntryComplete() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(APP_ENTRY_DONE_KEY, 'true')
  } catch {
    /* ignore */
  }
}

export function clearAppEntryComplete() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(APP_ENTRY_DONE_KEY)
  } catch {
    /* ignore */
  }
}

/** Human pack name for the unlocked product. */
export function packTitleForPurchasedTier(tierId = readPurchasedTier()) {
  switch (tierId) {
    case 'rome-central':
      return 'Roma Historica'
    case 'rome-essential':
      return 'Roma Antica'
    case 'rome-complete':
      return 'Roma Eterna'
    case 'rome-couple':
      return 'Couple Bundle'
    case 'rome-family':
      return 'Family Bundle'
    default:
      return 'ChronoWalk Rome'
  }
}

export function packBlurbForPurchasedTier(tierId = readPurchasedTier()) {
  switch (tierId) {
    case 'rome-central':
      return "Trajan's Market and the living city around the Pantheon."
    case 'rome-essential':
      return 'Colosseum, Forum, hills, and Circus Maximus.'
    case 'rome-complete':
      return 'The full Rome walk — archaeological core to the Appian Way.'
    case 'rome-couple':
      return 'Complete Roma Eterna for two devices, with shared tour progress.'
    case 'rome-family':
      return 'Complete Roma Eterna for up to four devices, with shared tour progress.'
    default:
      return 'Your self-guided Rome walk is unlocked on this phone.'
  }
}

/**
 * Where an unlocked traveler should land when opening the site.
 * @param {{ resumable?: boolean, entryComplete?: boolean }} opts
 */
export function getAppHomePath({
  resumable = false,
  entryComplete = isAppEntryComplete(),
} = {}) {
  if (resumable) return '/begin'
  if (!entryComplete) return '/setup'
  return '/begin'
}

/**
 * Return path into the traveler's current walk without resetting stop, pace, or path.
 * Active journeys resume from persisted journey state on `/journey`.
 *
 * @param {{ journeySnapshot?: { state?: string } | null, entryComplete?: boolean }} [opts]
 */
export function getActiveWalkPath({
  journeySnapshot = typeof window === 'undefined' ? null : getJourneySnapshot(),
  entryComplete = isAppEntryComplete(),
} = {}) {
  const state = journeySnapshot?.state
  if (
    state &&
    state !== JOURNEY_STATES.IDLE &&
    state !== JOURNEY_STATES.COMPLETE
  ) {
    return '/journey'
  }
  return getAppHomePath({ resumable: false, entryComplete })
}
