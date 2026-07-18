import { Navigate } from 'react-router-dom'
import WelcomeFlow from '../../components/welcome/WelcomeFlow'
import { hasAccess } from '../../lib/config'
import { getAppHomePath, isAppEntryComplete } from '../../lib/appEntry.js'
import { getJourneySnapshot, isResumableJourney, JOURNEY_STATES } from '../../state/journey'

export function WelcomePage() {
  if (hasAccess()) {
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE

    if (inProgress) {
      return <Navigate to="/journey" replace />
    }

    return (
      <Navigate
        to={getAppHomePath({
          resumable: isResumableJourney(),
          entryComplete: isAppEntryComplete(),
        })}
        replace
      />
    )
  }

  return <WelcomeFlow />
}
