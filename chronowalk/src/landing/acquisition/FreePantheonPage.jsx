import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import LandingThenNowProof from '../v4/LandingThenNowProof.jsx'
import { LANDING_PREVIEW_AUDIO_FILE } from '../landingData.js'
import { primePreviewAudioForNavigation } from '../previewAudioHandoff.js'
import AcquisitionFaq from './AcquisitionFaq.jsx'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import { FREE_PANTHEON_COPY } from './acquisitionCopy.js'
import {
  trackFreePantheonDemoInteracted,
  trackFreePantheonFullTourClicked,
  trackFreePantheonStartClicked,
} from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'

export default function FreePantheonPage() {
  const navigate = useNavigate()
  const copy = FREE_PANTHEON_COPY
  const checkout = useAcquisitionCheckout({ source: 'free_pantheon' })

  const startPreview = useCallback(
    (section = 'hero') => {
      trackFreePantheonStartClicked(section)
      const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
      if (url) primePreviewAudioForNavigation(url)
      navigate('/preview')
    },
    [navigate],
  )

  const goFullTour = useCallback((section = 'upgrade') => {
    trackFreePantheonFullTourClicked(section)
    checkout.beginTier('rome-complete')
  }, [checkout])

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta="Get the full Rome tour"
      onHeaderPrimaryClick={() => goFullTour('header')}
    >
      <section className="cw-acq-hero" aria-labelledby="free-pantheon-h1">
        <div className="cw-v4-wrap cw-acq-hero__grid">
          <div>
            <p className="cw-v4-eyebrow">{copy.eyebrow}</p>
            <h1 id="free-pantheon-h1" className="cw-acq-hero__title">
              {copy.h1}
            </h1>
            <p className="cw-acq-hero__lead">{copy.lead}</p>
            <div className="cw-acq-hero__actions">
              <button
                type="button"
                className="cw-acq-btn cw-acq-btn--primary"
                onClick={() => startPreview('hero')}
              >
                {copy.primaryCta}
              </button>
              <Link
                to="/#pricing"
                className="cw-acq-link"
                onClick={() => trackFreePantheonFullTourClicked('hero_secondary')}
              >
                {copy.secondaryCta}
              </Link>
            </div>
            <p className="cw-acq-hero__trust">{copy.trustLine}</p>
          </div>
          <figure className="cw-acq-hero__media">
            <img
              src={copy.heroImage}
              alt={copy.heroImageAlt}
              width={1200}
              height={900}
              fetchPriority="high"
              decoding="async"
            />
          </figure>
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
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="free-proof">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <p className="cw-v4-eyebrow">{copy.proofEyebrow}</p>
          <h2 id="free-proof" className="cw-v4-section-title">
            {copy.proofHeading}
          </h2>
          <p className="cw-v4-section-lead">{copy.proofLead}</p>
        </div>
        <div
          className="cw-acq-demo-slot"
          onPointerDownCapture={() => trackFreePantheonDemoInteracted('then_now')}
        >
          <LandingThenNowProof />
        </div>
      </section>

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
            <Link to="/#pricing" className="cw-acq-link">
              {copy.compareCta}
            </Link>
          </div>
          <p className="cw-acq-hero__trust" style={{ marginTop: '1.25rem' }}>
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
