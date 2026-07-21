import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { parseAccessToken, readDeviceCredential } from '../../lib/access.js'
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
  const [searchParams] = useSearchParams()
  const urlToken = parseAccessToken(`?${searchParams.toString()}`)
  const [restoring, setRestoring] = useState(false)

  const handleValidated = useCallback(async () => {
    setRestoring(true)
    try {
      const credential = readDeviceCredential()
      if (credential) {
        const remote = await pullJourneyProgress(credential)
        if (remote) hydrateJourney(remote)
      }
    } finally {
      navigate(getAccessDestination({ afterUnlock: true }), { replace: true })
    }
  }, [navigate])

  // A token URL must ALWAYS be validated — never skip because cw_access was set.
  if (urlToken) {
    return <AccessScreen onValidated={handleValidated} forceValidateToken={urlToken} />
  }

  if (hasAccess() && !restoring) {
    return <Navigate to={getAccessDestination()} replace />
  }

  return <AccessScreen onValidated={handleValidated} />
}
