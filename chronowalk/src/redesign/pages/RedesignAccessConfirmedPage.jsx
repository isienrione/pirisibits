import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseAccessToken, validateAccessToken } from '../../lib/access.js'
import { grantAccess, hasAccess } from '../../lib/config.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { clearPendingPurchaseTier } from '../../lib/pendingPurchase.js'
import { getJourneySnapshot, JOURNEY_STATES } from '../../state/journey.js'
import RedesignRouteShell from '../RedesignRouteShell.jsx'
import A3AccessConfirmed from '../screens/A3AccessConfirmed.jsx'

/**
 * Post-purchase ceremony. Accepts ?token= from Lemon email / staging checkout,
 * grants device access, then Continue → setup (or journey if already walking).
 */
export default function RedesignAccessConfirmedPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [ready, setReady] = useState(() => hasAccess())

  useEffect(() => {
    const token = parseAccessToken(`?${params.toString()}`)
    if (!token) {
      setReady(hasAccess())
      return undefined
    }

    let cancelled = false
    validateAccessToken(token).then((result) => {
      if (cancelled) return
      if (result.ok) {
        grantAccess()
        clearPendingPurchaseTier()
        track(TRACK_EVENTS.PURCHASE, { source: result.source ?? 'confirmed' })
        setReady(true)
        return
      }
      setReady(hasAccess())
    })

    return () => {
      cancelled = true
    }
  }, [params])

  const handleContinue = () => {
    if (!hasAccess() && !ready) {
      navigate('/access', { replace: true })
      return
    }
    const { state } = getJourneySnapshot()
    const inProgress = state !== JOURNEY_STATES.IDLE && state !== JOURNEY_STATES.COMPLETE
    navigate(inProgress ? '/journey' : '/setup', { replace: true })
  }

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <A3AccessConfirmed onContinue={handleContinue} />
      </div>
    </RedesignRouteShell>
  )
}
