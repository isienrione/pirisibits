import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { readAccessToken } from '../../lib/access.js'
import { pullJourneyProgress } from '../../lib/journeyCloud.js'
import { hydrateJourney, isResumableJourney } from '../../state/journey'

/**
 * After a fresh unlock → confirmation (family invite) then setup.
 * Returning owners with progress → resume at /begin.
 * Returning owners without progress → /setup (or /begin if they prefer).
 */
export function getAccessDestination({ afterUnlock = false } = {}) {
  if (isResumableJourney()) return '/begin'
  if (afterUnlock) return '/access/confirmed'
  return '/setup'
}

export function AccessPage() {
  const navigate = useNavigate()
  const [restoring, setRestoring] = useState(false)

  const handleValidated = useCallback(async () => {
    setRestoring(true)
    try {
      const token = readAccessToken()
      if (token) {
        const remote = await pullJourneyProgress(token)
        if (remote) hydrateJourney(remote)
      }
    } finally {
      navigate(getAccessDestination({ afterUnlock: true }), { replace: true })
    }
  }, [navigate])

  if (hasAccess() && !restoring) {
    return <Navigate to={getAccessDestination()} replace />
  }

  return <AccessScreen onValidated={handleValidated} />
}
