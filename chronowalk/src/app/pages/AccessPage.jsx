import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey'

const useFigmaRedesign = true

function getAccessDestination() {
  const { state } = getJourneySnapshot()
  const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
  if (inProgress) return '/journey'
  if (useFigmaRedesign) return '/tour'
  return '/begin'
}

export function AccessPage() {
  const navigate = useNavigate()

  const handleValidated = useCallback(() => {
    navigate(getAccessDestination(), { replace: true })
  }, [navigate])

  if (hasAccess()) {
    return <Navigate to={getAccessDestination()} replace />
  }

  return <AccessScreen onValidated={handleValidated} />
}
