import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import AcquisitionFaq from './AcquisitionFaq.jsx'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import FreePantheonPreviewEmbed from './FreePantheonPreviewEmbed.jsx'
import { FREE_PANTHEON_COPY } from './acquisitionCopy.js'
import { trackFreePantheonFullTourClicked } from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'

export default function FreePantheonPage() {
  const copy = FREE_PANTHEON_COPY
  const checkout = useAcquisitionCheckout({ source: 'free_pantheon' })

  const goFullTour = useCallback(
    (section = 'upgrade') => {
      trackFreePantheonFullTourClicked(section)
      checkout.beginTier('rome-complete')
    },
    [checkout],
  )

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta="Get the full Rome tour"
      onHeaderPrimaryClick={() => goFullTour('header')}
    >
      <section className="cw-acq-hero cw-acq-hero--compact" aria-labelledby="free-pantheon-h1">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <p className="cw-v4-eyebrow">{copy.eyebrow}</p>
          <h1 id="free-pantheon-h1" className="cw-acq-hero__title">
            {copy.h1}
          </h1>
          <p className="cw-acq-hero__lead">{copy.lead}</p>
          <p className="cw-acq-hero__trust">{copy.trustLine}</p>
        </div>
      </section>

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="free-includes">
        <div className="cw-v4-wrap">
          <h2 id="free-includes" className="cw-v4-section-title">
            {copy.includesHeading}
          </h2>
          <ul className="cw-acq-include__list">
            {copy.includes.map((item) => (
              <li key={item.title} className="cw-acq-include__item">
                <h3 className="cw-acq-include__title">{item.title}</h3>
                <p className="cw-acq-include__body">{item.body}</p>
              </li>
            ))}
          </ul>
          {copy.includesNote ? (
            <p className="cw-acq-includes-note">{copy.includesNote}</p>
          ) : null}
        </div>
      </section>

      <FreePantheonPreviewEmbed
        startLabel={copy.primaryCta}
        onUnlockFullTour={() => goFullTour('preview_unlock')}
      />

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="free-upgrade">
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
              {copy.upgradeCta}
            </button>
            <Link
              to="/#pricing"
              className="cw-acq-link"
              onClick={() => trackFreePantheonFullTourClicked('compare')}
            >
              {copy.secondaryCta}
            </Link>
          </div>
          <p className="cw-acq-hero__trust" style={{ marginTop: '0.75rem' }}>
            <Link to="/#pricing" className="cw-acq-link">
              {copy.compareCta}
            </Link>
            {' · '}
            <Link to="/how-it-works" className="cw-acq-link">
              How ChronoWalk works
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
