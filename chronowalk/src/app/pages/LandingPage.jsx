import { Navigate } from 'react-router-dom'
import LandingScreen from '../../components/landing/LandingScreen'
import { hasAccess } from '../../lib/config'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey'

export function LandingPage() {
  if (hasAccess()) {
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE

    if (inProgress) {
      return <Navigate to="/journey" replace />
    }

    return <Navigate to="/begin" replace />
  }

  return <LandingScreen />
}
