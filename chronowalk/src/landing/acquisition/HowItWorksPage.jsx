import { useCallback, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resolvePreviewUrl } from '../../audio/audioUrl.js'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import LandingProductDemo from '../v4/LandingProductDemo.jsx'
import { LANDING_PREVIEW_AUDIO_FILE } from '../landingData.js'
import { primePreviewAudioForNavigation } from '../previewAudioHandoff.js'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import { HOW_IT_WORKS_COPY } from './acquisitionCopy.js'
import {
  trackHowItWorksDemoStarted,
  trackHowItWorksFreeClicked,
  trackHowItWorksPaidClicked,
} from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'

export default function HowItWorksPage() {
  const navigate = useNavigate()
  const copy = HOW_IT_WORKS_COPY
  const demoTracked = useRef(false)
  const demoRef = useRef(null)
  const checkout = useAcquisitionCheckout({ source: 'how_it_works' })

  const startFree = useCallback(
    (section = 'hero') => {
      trackHowItWorksFreeClicked(section)
      const url = resolvePreviewUrl(LANDING_PREVIEW_AUDIO_FILE)
      if (url) primePreviewAudioForNavigation(url)
      navigate('/preview')
    },
    [navigate],
  )

  const startPaid = useCallback(
    (section = 'final') => {
      trackHowItWorksPaidClicked(section)
      checkout.beginTier('rome-complete')
    },
    [checkout],
  )

  useEffect(() => {
    const node = demoRef.current
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || demoTracked.current) return
        demoTracked.current = true
        trackHowItWorksDemoStarted()
        observer.disconnect()
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta="Get the full Rome tour"
      onHeaderPrimaryClick={() => startPaid('header')}
      showHowItWorksLink={false}
    >
      <section className="cw-acq-hero" aria-labelledby="how-it-works-h1">
        <div className="cw-v4-wrap cw-acq-hero__grid">
          <div>
            <p className="cw-v4-eyebrow">{copy.eyebrow}</p>
            <h1 id="how-it-works-h1" className="cw-acq-hero__title">
              {copy.h1}
            </h1>
            <p className="cw-acq-hero__lead">{copy.lead}</p>
            <div className="cw-acq-hero__actions">
              <button
                type="button"
                className="cw-acq-btn cw-acq-btn--primary"
                onClick={() => startFree('hero')}
              >
                {copy.primaryCta}
              </button>
              <Link
                to="/#pricing"
                className="cw-acq-btn cw-acq-btn--secondary"
                onClick={() => trackHowItWorksPaidClicked('hero_secondary')}
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
              width={1024}
              height={1024}
              fetchPriority="high"
              decoding="async"
            />
          </figure>
        </div>
      </section>

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="how-steps">
        <div className="cw-v4-wrap">
          <h2 id="how-steps" className="cw-v4-section-title">
            {copy.stepsHeading}
          </h2>
          <ol className="cw-acq-steps">
            {copy.steps.map((step, index) => (
              <li key={step.title} className="cw-acq-step">
                <h3 className="cw-acq-step__title">
                  <span aria-hidden="true">{index + 1}. </span>
                  {step.title}
                </h3>
                <p className="cw-acq-step__body">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="how-demo" ref={demoRef}>
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <h2 id="how-demo" className="cw-v4-section-title">
            {copy.demoHeading}
          </h2>
        </div>
        <div className="cw-acq-demo-slot">
          <LandingProductDemo />
        </div>
      </section>

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="how-reassure">
        <div className="cw-v4-wrap">
          <h2 id="how-reassure" className="cw-v4-section-title">
            {copy.reassureHeading}
          </h2>
          <ul className="cw-acq-reassure">
            {copy.reassure.map((item) => (
              <li key={item.title} className="cw-acq-reassure__item">
                <h3 className="cw-acq-reassure__title">{item.title}</h3>
                <p className="cw-acq-reassure__body">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="how-final">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <h2 id="how-final" className="cw-v4-section-title">
            {copy.finalHeading}
          </h2>
          <div className="cw-acq-hero__actions">
            <button
              type="button"
              className="cw-acq-btn cw-acq-btn--primary"
              onClick={() => startFree('final')}
            >
              {copy.finalPrimaryCta}
            </button>
            <button
              type="button"
              className="cw-acq-btn cw-acq-btn--secondary"
              onClick={() => startPaid('final')}
            >
              {copy.finalSecondaryCta}
            </button>
          </div>
          <p className="cw-acq-hero__trust" style={{ marginTop: '1.25rem' }}>
            <Link to="/free-pantheon" className="cw-acq-link">
              Free Pantheon experience
            </Link>
            {' · '}
            <Link to="/ancient-rome" className="cw-acq-link">
              Ancient Rome route
            </Link>
            {' · '}
            <Link to="/" className="cw-acq-link">
              Full tour
            </Link>
          </p>
        </div>
      </section>

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
