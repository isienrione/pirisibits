import { Navigate } from 'react-router-dom'
import BeginFlow from '../../components/begin/BeginFlow'
import { hasAccess } from '../../lib/config'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey'

export function BeginPage() {
  if (!hasAccess()) {
    return <Navigate to="/landing" replace />
  }

  const { state } = getJourneySnapshot()
  const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE

  if (inProgress) {
    return <Navigate to="/journey" replace />
  }

  return <BeginFlow />
}
