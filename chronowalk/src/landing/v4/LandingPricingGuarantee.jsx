import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { observeLandingSectionOnce } from '../landingAnalytics.js'

/** Module-level once-flag so mobile tier remounts do not re-fire. */
let guaranteeViewFired = false

/** @internal test helper */
export function resetPricingGuaranteeAnalyticsForTests() {
  guaranteeViewFired = false
}

/**
 * Trust / money-back line under pricing CTAs.
 * Full-width of the pricing container; not repeated per tier card.
 */
export default function LandingPricingGuarantee() {
  const ref = useRef(null)

  useEffect(
    () =>
      observeLandingSectionOnce(
        ref.current,
        () => {
          if (guaranteeViewFired) return
          guaranteeViewFired = true
          track(TRACK_EVENTS.GUARANTEE_VIEW)
        },
        { threshold: 0.5 },
      ),
    [],
  )

  return (
    <div
      ref={ref}
      className="cw-v4-pricing-guarantee"
      data-testid="cw-pricing-guarantee"
    >
      <p className="cw-v4-pricing-guarantee__secure">
        <Lock className="cw-v4-pricing-guarantee__lock" size={12} strokeWidth={2} aria-hidden="true" />
        <span>Secure checkout via Paddle · VAT included · Instant email access</span>
      </p>
      <p className="cw-v4-pricing-guarantee__promise">
        <span className="cw-v4-pricing-guarantee__accent">Money-back guarantee</span>
        {" if it doesn't work on your phone or isn't what you expected, email us and we'll refund you."}
      </p>
    </div>
  )
}
