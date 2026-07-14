import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import APurchasePending from '../../redesign/screens/APurchasePending.jsx'
import RedesignRouteShell from '../../redesign/RedesignRouteShell.jsx'
import {
  getTierById,
  isCheckoutConfigured,
  openCheckout,
  resolveCheckoutBaseUrl,
} from '../../lib/checkout.js'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import { LANDING_PREVIEW_AUDIO_FILE } from '../../landing/landingData.js'
import { primePreviewAudioForNavigation } from '../../landing/previewAudioHandoff.js'

/**
 * /purchase — bridge into Lemon Squeezy when configured; calm placeholder otherwise.
 * Query: ?tier=rome-complete (optional)
 */
export function PurchaseFlowPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tierId = params.get('tier')
  const tier = useMemo(() => getTierById(tierId), [tierId])

  const [checkoutReady, setCheckoutReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    track(TRACK_EVENTS.LANDING_CTA_BEGIN, {
      source: 'purchase_flow',
      tier: tierId ?? null,
    })
  }, [tierId])

  useEffect(() => {
    let cancelled = false
    resolveCheckoutBaseUrl().then((url) => {
      if (!cancelled) setCheckoutReady(isCheckoutConfigured(url))
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
      setBusy(false)
    }
  }, [tierId])

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
          busy={busy}
          onContinueCheckout={handleCheckout}
          onPreview={handlePreview}
        />
      </div>
    </RedesignRouteShell>
  )
}

export default PurchaseFlowPage
