import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import HowItWorksSequentialDemo from './HowItWorksSequentialDemo.jsx'
import { LaunchOfferUnlockCtaLabel } from '../OfferPriceDisplay.jsx'
import {
  getLocalizedAcquisition,
  getLocalizedLanding,
  getLocalizedUnlockAllStopsCta,
} from '../getLocalizedLanding.js'
import {
  trackHowItWorksDemoStarted,
  trackHowItWorksFreeClicked,
  trackHowItWorksPaidClicked,
} from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'
import { useI18n } from '../../i18n/I18nProvider.jsx'

export default function HowItWorksPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const copy = useMemo(
    () => getLocalizedAcquisition(locale).HOW_IT_WORKS_COPY,
    [locale],
  )
  const landing = useMemo(() => getLocalizedLanding(locale), [locale])
  const unlockAllCta = getLocalizedUnlockAllStopsCta(locale)
  const demoTracked = useRef(false)
  const demoRef = useRef(null)
  const checkout = useAcquisitionCheckout({ source: 'how_it_works' })

  const startFree = useCallback(
    (section = 'hero') => {
      trackHowItWorksFreeClicked(section)
      navigate('/free-pantheon')
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
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta={copy.headerPrimaryCta}
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

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="how-demo" ref={demoRef}>
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <h2 id="how-demo" className="cw-v4-section-title">
            {copy.demoHeading}
          </h2>
          <p className="cw-v4-section-lead">{copy.demoLead}</p>
        </div>
        <div className="cw-v4-wrap">
          <HowItWorksSequentialDemo section={landing.LANDING_CONTENT['product-demo']} />
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="how-reassure">
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

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="how-final">
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
              aria-label={unlockAllCta}
              onClick={() => startPaid('final')}
            >
              <LaunchOfferUnlockCtaLabel fallback={unlockAllCta} />
            </button>
          </div>
          <p className="cw-acq-hero__trust" style={{ marginTop: '1.25rem' }}>
            <Link to="/free-pantheon" className="cw-acq-link">
              {copy.freePantheon}
            </Link>
            {' · '}
            <Link to="/ancient-rome" className="cw-acq-link">
              {copy.ancientRome}
            </Link>
            {' · '}
            <Link to="/" className="cw-acq-link">
              {copy.fullTour}
            </Link>
          </p>
        </div>
      </section>

      <CheckoutConsentDialog
        open={Boolean(checkout.pendingTierId)}
        tierLabel={checkout.pendingTier?.name ?? null}
        priceLabel={checkout.pendingTier?.price ?? null}
        basePriceLabel={
          checkout.pendingTier?.launchOffer ? checkout.pendingTier?.basePrice ?? null : null
        }
        offerLabel={
          checkout.pendingTier?.launchOffer ? checkout.pendingTier?.offerLabel ?? null : null
        }
        saveLabel={
          checkout.pendingTier?.launchOffer ? checkout.pendingTier?.saveLabel ?? null : null
        }
        launchOffer={Boolean(checkout.pendingTier?.launchOffer)}
        busy={checkout.checkoutBusy}
        onCancel={checkout.cancelConsent}
        onConfirm={checkout.confirmConsent}
      />
    </AcquisitionPageShell>
  )
}
