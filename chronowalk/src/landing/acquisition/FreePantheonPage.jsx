import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import AcquisitionFaq from './AcquisitionFaq.jsx'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import FreePantheonPreviewEmbed from './FreePantheonPreviewEmbed.jsx'
import { getUnlockAllStopsCta } from '../landingData.js'
import { FREE_PANTHEON_COPY } from './acquisitionCopy.js'
import { trackFreePantheonFullTourClicked } from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'

export default function FreePantheonPage() {
  const copy = FREE_PANTHEON_COPY
  const unlockAllCta = getUnlockAllStopsCta()
  const navigate = useNavigate()
  const checkout = useAcquisitionCheckout({ source: 'free_pantheon' })

  const goFullTour = useCallback(
    (section = 'upgrade') => {
      trackFreePantheonFullTourClicked(section)
      checkout.beginTier('rome-complete')
    },
    [checkout],
  )

  /** Preview map unlock → landing pricing (not /access or checkout). */
  const goPricingFromUnlock = useCallback(() => {
    trackFreePantheonFullTourClicked('preview_unlock')
    navigate({ pathname: '/', hash: 'pricing' })
  }, [navigate])

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta="Get the full Rome tour"
      onHeaderPrimaryClick={() => goFullTour('header')}
    >
      <section className="cw-acq-hero cw-acq-hero--demo-first" aria-labelledby="free-pantheon-h1">
        <div className="cw-v4-wrap cw-acq-hero--demo-first__inner">
          <p className="cw-v4-eyebrow">{copy.eyebrow}</p>
          <h1 id="free-pantheon-h1" className="cw-acq-hero__title">
            {copy.h1}
          </h1>
          <p className="cw-acq-hero__lead cw-acq-hero__lead--short">{copy.lead}</p>
          <p className="cw-acq-hero__trust">{copy.trustLine}</p>
        </div>
      </section>

      <FreePantheonPreviewEmbed
        includesCompact={copy.includesCompact}
        tipEyebrow={copy.interactTipEyebrow}
        tipPrompt={copy.interactPrompt}
        onUnlockFullTour={goPricingFromUnlock}
      />

      <section className="cw-acq-section cw-acq-section--paper cw-acq-section--tight" aria-labelledby="free-upgrade">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <h2 id="free-upgrade" className="cw-v4-section-title">
            {copy.upgradeHeading}
          </h2>
          <p className="cw-v4-section-lead">{copy.upgradeLead}</p>
          <div className="cw-acq-hero__actions">
            <button
              type="button"
              className="cw-acq-btn cw-acq-btn--primary"
              onClick={() => goFullTour('upgrade')}
            >
              {unlockAllCta}
            </button>
            <Link
              to="/"
              className="cw-acq-link"
              onClick={() => trackFreePantheonFullTourClicked('compare')}
            >
              {copy.secondaryCta}
            </Link>
          </div>
          <p className="cw-acq-hero__trust" style={{ marginTop: '0.75rem' }}>
            <Link to="/how-it-works" className="cw-acq-link">
              How it works
            </Link>
            {' · '}
            <Link to="/" className="cw-acq-link">
              Full Rome tour
            </Link>
          </p>
        </div>
      </section>

      <AcquisitionFaq items={copy.faq} heading="Quick answers" />

      <CheckoutConsentDialog
        open={Boolean(checkout.pendingTierId)}
        tierLabel={checkout.pendingTier?.name ?? null}
        priceLabel={checkout.pendingTier?.price ?? null}
        busy={checkout.checkoutBusy}
        onCancel={checkout.cancelConsent}
        onConfirm={checkout.confirmConsent}
      />
    </AcquisitionPageShell>
  )
}
