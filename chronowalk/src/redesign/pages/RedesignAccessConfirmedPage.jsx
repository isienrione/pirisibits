import { Navigate } from 'react-router-dom'
import { getJourneySnapshot, JOURNEY_STATES, isResumableJourney } from '../../state/journey.js'
import { getAppHomePath, isAppEntryComplete } from '../../lib/appEntry.js'

/**
 * Legacy /access/confirmed · send travelers into App Entry or resume.
 * The cinematic threshold now lives on /setup.
 */
export default function RedesignAccessConfirmedPage() {
  const { state } = getJourneySnapshot()
  const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
  const path = getAppHomePath({
    resumable: inProgress || isResumableJourney(),
    entryComplete: isAppEntryComplete(),
  })

  return <Navigate to={path} replace />
}
