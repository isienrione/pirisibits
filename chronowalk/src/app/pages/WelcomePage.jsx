import { Navigate } from 'react-router-dom'
import WelcomeFlow from '../../components/welcome/WelcomeFlow'
import { hasAccess } from '../../lib/config'
import { getJourneySnapshot } from '../../state/journey'
import { JOURNEY_STATES } from '../../state/journey'

export function WelcomePage() {
  if (hasAccess()) {
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE

    if (inProgress) {
      return <Navigate to="/journey" replace />
    }

    return <Navigate to="/begin" replace />
  }

  return <WelcomeFlow />
}
