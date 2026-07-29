import { getAppHomePath, isAppEntryComplete } from '../../lib/appEntry.js'
import { isResumableJourney } from '../../state/journey'

/**
 * Fresh unlock / returning owners without entry → App Entry (/setup).
 * Returning owners with progress → /begin resume.
 * Entry already done → /begin (choose/start walk).
 * Fresh unlock always re-opens setup (A2HS + offline download).
 */
export function getAccessDestination({ afterUnlock = false } = {}) {
  return getAppHomePath({
    resumable: afterUnlock ? false : isResumableJourney(),
    entryComplete: afterUnlock ? false : isAppEntryComplete(),
    afterUnlock,
  })
}
