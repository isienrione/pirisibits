import { useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'
import { track, TRACK_EVENTS } from '../../lib/track.js'
import { observeDwellOnce, trackCtaClick } from '../../lib/analytics.ts'
import { useT } from '../../i18n/I18nProvider.jsx'

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
  const t = useT()
  const ref = useRef(null)

  useEffect(
    () =>
      observeDwellOnce(
        ref.current,
        () => {
          if (guaranteeViewFired) return
          guaranteeViewFired = true
          track(TRACK_EVENTS.GUARANTEE_VIEW)
        },
        { threshold: 0.5, dwellMs: 1000 },
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
        <span>{t('landing.pricing.guaranteeSecure')}</span>
      </p>
      <p className="cw-v4-pricing-guarantee__promise">
        <span
          className="cw-v4-pricing-guarantee__accent"
          role="button"
          tabIndex={0}
          onClick={() => trackCtaClick({ ctaLocation: 'guarantee' })}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              trackCtaClick({ ctaLocation: 'guarantee' })
            }
          }}
        >
          {t('landing.pricing.guaranteeTitle')}
        </span>
        {t('landing.pricing.guaranteeBody')}
      </p>
    </div>
  )
}
