import { useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { isResumableJourney } from '../../state/journey'

// Returning travelers with a real, in-progress journey are offered a resume
// (the /begin flow shows the "Rome kept your place" screen). Everyone else —
// including first-time purchasers — starts the cinematic onboarding at /welcome.
function getAccessDestination() {
  return isResumableJourney() ? '/begin' : '/welcome'
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
