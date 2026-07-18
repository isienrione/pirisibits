import { useCallback, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { readAccessToken } from '../../lib/access.js'
import { getAppHomePath, isAppEntryComplete } from '../../lib/appEntry.js'
import { pullJourneyProgress } from '../../lib/journeyCloud.js'
import { hydrateJourney, isResumableJourney } from '../../state/journey'

/**
 * Fresh unlock / returning owners without entry → App Entry (/setup).
 * Returning owners with progress → /begin resume.
 * Entry already done → /begin (choose/start walk).
 */
export function getAccessDestination({ afterUnlock = false } = {}) {
  return getAppHomePath({
    resumable: isResumableJourney(),
    entryComplete: afterUnlock ? false : isAppEntryComplete(),
  })
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
