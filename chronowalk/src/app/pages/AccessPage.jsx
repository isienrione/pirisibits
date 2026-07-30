import { useCallback, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import AccessScreen from '../../components/access/AccessScreen'
import { hasAccess } from '../../lib/config'
import { parseAccessToken, readDeviceCredential } from '../../lib/access.js'
import { pullJourneyProgress } from '../../lib/journeyCloud.js'
import { hydrateJourney } from '../../state/journey'
import { syncAccessHandoff } from '../../lib/accessHandoff.js'
import { getAccessDestination } from './accessDestination.js'

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
      syncAccessHandoff({ updateUrl: true })
      navigate(getAccessDestination({ afterUnlock: true }), { replace: true })
    }
  }, [navigate])

  // A token URL must ALWAYS be validated - never skip because cw_access was set.
  if (urlToken) {
    return <AccessScreen onValidated={handleValidated} forceValidateToken={urlToken} />
  }

  if (hasAccess() && !restoring) {
    return <Navigate to={getAccessDestination()} replace />
  }

  return <AccessScreen onValidated={handleValidated} />
}
