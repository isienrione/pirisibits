import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import APurchasePending from '../../redesign/screens/APurchasePending.jsx'
import RedesignRouteShell from '../../redesign/RedesignRouteShell.jsx'
import {
  getTierById,
  openCheckout,
  resolveCheckoutReady,
} from '../../lib/checkout.js'
import {
  completeStagingPurchase,
  isStagingCheckoutAllowed,
} from '../../lib/stagingCheckout.js'
import { rememberPendingPurchaseTier } from '../../lib/pendingPurchase.js'
import { hasAccess } from '../../lib/config.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { LANDING_PREVIEW_AUDIO_FILE } from '../../landing/landingData.js'
import { primePreviewAudioForNavigation } from '../../landing/previewAudioHandoff.js'

/**
 * /purchase · paywall. Paddle when configured; otherwise blocked until credentials exist.
 * Staging unlock only with ?devUnlock=1 (never the default pack → walk path).
 */
export function PurchaseFlowPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tierId = params.get('tier')
  const tier = useMemo(() => getTierById(tierId), [tierId])
  const allowDevUnlock =
    isStagingCheckoutAllowed() && (params.get('devUnlock') === '1' || params.get('devUnlock') === 'true')

  const [checkoutReady, setCheckoutReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (hasAccess()) {
      navigate('/setup', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (tierId) rememberPendingPurchaseTier(tierId)
  }, [tierId])

  useEffect(() => {
    track(TRACK_EVENTS.LANDING_CTA_BEGIN, {
      source: 'purchase_flow',
      tier: tierId ?? null,
    })
  }, [tierId])

  useEffect(() => {
    let cancelled = false
    resolveCheckoutReady().then((ready) => {
      if (!cancelled) setCheckoutReady(ready)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCheckout = useCallback(async () => {
    setBusy(true)
    const result = await openCheckout({ tierId, source: 'purchase_flow' })
    if (!result.ok) {
      setCheckoutReady(false)
    }
    if (!result.ok || result.mode === 'overlay') {
      setBusy(false)
    }
  }, [tierId])

  const handleStagingCheckout = useCallback(() => {
    setBusy(true)
    const result = completeStagingPurchase({ tierId, source: 'purchase_flow_staging' })
    if (!result.ok) {
      setBusy(false)
      return
    }
    navigate(result.redirectTo, { replace: true })
  }, [navigate, tierId])

  const handlePreview = useCallback(() => {
    track(TRACK_EVENTS.LANDING_CTA_PREVIEW, { source: 'purchase_flow', preview: 'pantheon' })
    const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
    if (url) primePreviewAudioForNavigation(url)
    navigate('/preview')
  }, [navigate])

  return (
    <RedesignRouteShell>
      <div className="redesign-app-shell">
        <APurchasePending
          tier={tier}
          checkoutReady={checkoutReady}
          stagingAllowed={allowDevUnlock}
          busy={busy}
          onContinueCheckout={handleCheckout}
          onStagingCheckout={allowDevUnlock ? handleStagingCheckout : undefined}
          onPreview={handlePreview}
        />
      </div>
    </RedesignRouteShell>
  )
}

export default PurchaseFlowPage
