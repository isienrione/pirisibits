import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTierById, openCheckout } from '../../lib/checkout.js'
import { rememberPendingPurchaseTier } from '../../lib/pendingPurchase.js'
import { useLandingPrice } from '../useLandingPrice.js'
import { resolveLandingTierCents } from '../landingCheckout.js'
import { trackLandingCheckoutOpen } from '../landingAnalytics.js'

/**
 * Shared checkout consent + Paddle open for acquisition pages.
 * Uses existing verified tier IDs only (rome-essential / rome-complete / …).
 */
export function useAcquisitionCheckout({ source = 'acquisition', onCheckoutStarted } = {}) {
  const navigate = useNavigate()
  const { cents } = useLandingPrice()
  const [pendingTierId, setPendingTierId] = useState(null)
  const [checkoutBusy, setCheckoutBusy] = useState(false)

  const pendingTier = useMemo(
    () => (pendingTierId ? getTierById(pendingTierId) : null),
    [pendingTierId],
  )

  const beginTier = useCallback((tierId) => {
    rememberPendingPurchaseTier(tierId)
    onCheckoutStarted?.(tierId)
    setPendingTierId(tierId)
  }, [onCheckoutStarted])

  const cancelConsent = useCallback(() => {
    if (checkoutBusy) return
    setPendingTierId(null)
  }, [checkoutBusy])

  const confirmConsent = useCallback(async () => {
    if (!pendingTierId) return
    setCheckoutBusy(true)
    const tierCents = resolveLandingTierCents(pendingTierId, cents)
    trackLandingCheckoutOpen({ tierId: pendingTierId, priceCents: tierCents })

    const result = await openCheckout({ tierId: pendingTierId, source })
    if (!result.ok) {
      const tier = pendingTierId
      setPendingTierId(null)
      setCheckoutBusy(false)
      navigate(`/purchase?tier=${encodeURIComponent(tier)}`)
      return
    }

    setPendingTierId(null)
    setCheckoutBusy(false)
  }, [cents, navigate, pendingTierId, source])

  return {
    pendingTierId,
    pendingTier,
    checkoutBusy,
    beginTier,
    cancelConsent,
    confirmConsent,
  }
}
