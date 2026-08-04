import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import CheckoutConsentDialog from '../../components/legal/CheckoutConsentDialog.jsx'
import LandingThenNowProof from '../v4/LandingThenNowProof.jsx'
import { ROME_TIERS } from '../landingData.js'
import { getLandingTierRouteStops } from '../landingTierRoutes.js'
import { getLandingTierStats } from '../landingTierStats.js'
import AcquisitionFaq from './AcquisitionFaq.jsx'
import AcquisitionPageShell from './AcquisitionPageShell.jsx'
import {
  ANCIENT_ROME_COPY,
  ANCIENT_ROME_FEATURED_STOP_LABELS,
} from './acquisitionCopy.js'
import {
  trackAncientRomeCheckoutStarted,
  trackAncientRomeFullTourClicked,
  trackAncientRomeRouteClicked,
  trackAncientRomeThenNowStarted,
} from './acquisitionAnalytics.js'
import { useAcquisitionCheckout } from './useAcquisitionCheckout.js'

/** Avoid em/en dashes in acquisition-facing stats copy. */
function withoutDashes(label) {
  return String(label ?? '').replace(/[—–]/g, '-')
}

export default function AncientRomePage() {
  const copy = ANCIENT_ROME_COPY
  const antica = useMemo(
    () => ROME_TIERS.find((tier) => tier.id === 'rome-essential'),
    [],
  )
  const eterna = useMemo(
    () => ROME_TIERS.find((tier) => tier.id === 'rome-complete'),
    [],
  )
  const historica = useMemo(
    () => ROME_TIERS.find((tier) => tier.id === 'rome-central'),
    [],
  )
  const anticaStats = useMemo(() => getLandingTierStats('rome-essential'), [])
  const historicaStats = useMemo(() => getLandingTierStats('rome-central'), [])
  const anticaStops = useMemo(() => getLandingTierRouteStops('rome-essential'), [])

  const checkout = useAcquisitionCheckout({
    source: 'ancient_rome',
    onCheckoutStarted: (tierId) => trackAncientRomeCheckoutStarted(tierId),
  })

  const chooseAntica = useCallback(() => {
    trackAncientRomeRouteClicked('rome-essential', 'choice')
    checkout.beginTier('rome-essential')
  }, [checkout])

  const chooseEterna = useCallback((section = 'choice') => {
    trackAncientRomeFullTourClicked(section)
    trackAncientRomeRouteClicked('rome-complete', section)
    checkout.beginTier('rome-complete')
  }, [checkout])

  const chooseHistorica = useCallback(() => {
    trackAncientRomeRouteClicked('rome-central', 'choice')
    checkout.beginTier('rome-central')
  }, [checkout])

  const primaryCta = `${copy.primaryCtaPrefix} · ${antica?.price ?? '€9.99'}`

  return (
    <AcquisitionPageShell
      landingPageType={copy.landingPageType}
      headerPrimaryCta="Get the full Rome tour"
      onHeaderPrimaryClick={() => chooseEterna('header')}
    >
      <section className="cw-acq-hero" aria-labelledby="ancient-rome-h1">
        <div className="cw-v4-wrap cw-acq-hero__grid">
          <div>
            <p className="cw-v4-eyebrow">{copy.eyebrow}</p>
            <h1 id="ancient-rome-h1" className="cw-acq-hero__title">
              {copy.h1}
            </h1>
            <p className="cw-acq-hero__lead">{copy.lead}</p>
            <div className="cw-acq-hero__actions">
              <button
                type="button"
                className="cw-acq-btn cw-acq-btn--primary"
                onClick={chooseAntica}
              >
                {primaryCta}
              </button>
              <button
                type="button"
                className="cw-acq-btn cw-acq-btn--secondary"
                onClick={() => chooseEterna('hero')}
              >
                {copy.secondaryCta}
              </button>
            </div>
            <p className="cw-acq-hero__trust">{copy.trustLine}</p>
            <p className="cw-acq-hero__note cw-acq-hero__note--disclaimer">
              {copy.admissionNotePrefix}
              <strong>{copy.admissionNoteEmphasis}</strong>
              {' '}
              {copy.admissionNote}
            </p>
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

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="ancient-exp">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <h2 id="ancient-exp" className="cw-v4-section-title">
            {copy.experienceHeading}
          </h2>
          <ol className="cw-acq-experience">
            {copy.experienceSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="ancient-stops">
        <div className="cw-v4-wrap">
          <h2 id="ancient-stops" className="cw-v4-section-title">
            {copy.stopsHeading}
          </h2>
          <p className="cw-v4-section-lead">
            {copy.stopsLead}{' '}
            <strong>
              {anticaStats.stopCount} stops
              {anticaStats.routeTimeLabel
                ? ` · ${withoutDashes(anticaStats.routeTimeLabel)}`
                : ''}
              {anticaStats.distanceLabel ? ` · ${anticaStats.distanceLabel}` : ''}
            </strong>
            .
          </p>
          <ul className="cw-acq-stops">
            {ANCIENT_ROME_FEATURED_STOP_LABELS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
          <p style={{ marginTop: '1.25rem' }}>
            <Link
              to="/#rome-essential"
              className="cw-acq-text-link"
              onClick={() => trackAncientRomeRouteClicked('rome-essential', 'stops_link')}
            >
              {copy.seeCompleteRoute}
            </Link>
            <span className="cw-acq-hero__note" style={{ display: 'block', marginTop: '0.5rem' }}>
              Route includes {anticaStops.length} verified stops from the current Roma Antica
              product data.
            </span>
          </p>
        </div>
      </section>

      <section className="cw-acq-section cw-acq-section--paper" aria-labelledby="ancient-then-now">
        <div className="cw-v4-wrap cw-v4-wrap--narrow">
          <p className="cw-v4-eyebrow">{copy.thenNowEyebrow}</p>
          <h2 id="ancient-then-now" className="cw-v4-section-title">
            {copy.thenNowHeading}
          </h2>
          <p className="cw-v4-section-lead">{copy.thenNowLead}</p>
        </div>
        <div
          className="cw-acq-demo-slot"
          onPointerDownCapture={() => trackAncientRomeThenNowStarted('hold')}
        >
          <LandingThenNowProof />
        </div>
      </section>

      <section className="cw-acq-section" aria-labelledby="ancient-choice">
        <div className="cw-v4-wrap">
          <h2 id="ancient-choice" className="cw-v4-section-title">
            {copy.choiceHeading}
          </h2>
          <div className="cw-acq-choice">
            <article
              className="cw-acq-choice__card cw-acq-choice__card--antica"
              aria-labelledby="choice-antica"
            >
              <p className="cw-acq-choice__theme">{antica?.tierLabel ?? 'ANCIENT ROME'}</p>
              <h3 id="choice-antica" className="cw-acq-choice__name">
                {antica?.name ?? 'Roma Antica'}
              </h3>
              <p className="cw-acq-choice__meta">
                {anticaStats.stopCount} stops · Focused Ancient Rome route
              </p>
              <p className="cw-acq-choice__price">{antica?.price ?? '€9.99'}</p>
              <div className="cw-acq-choice__actions">
                <button
                  type="button"
                  className="cw-acq-btn cw-acq-btn--antica"
                  onClick={chooseAntica}
                >
                  {copy.anticaCta}
                </button>
              </div>
            </article>

            <div className="cw-acq-choice__stack">
              <article
                className="cw-acq-choice__card cw-acq-choice__card--eterna"
                aria-labelledby="choice-eterna"
              >
                <p className="cw-acq-choice__theme">{eterna?.tierLabel ?? 'THE COMPLETE ROME WALK'}</p>
                <h3 id="choice-eterna" className="cw-acq-choice__name">
                  {eterna?.name ?? 'Roma Eterna'}
                </h3>
                <p className="cw-acq-choice__meta">
                  21 stops · Includes Ancient Rome plus the wider city story
                </p>
                <p className="cw-acq-choice__price">{eterna?.price ?? '€14.99'}</p>
                <p className="cw-acq-choice__value">{copy.eternaValueLine}</p>
                <div className="cw-acq-choice__actions">
                  <button
                    type="button"
                    className="cw-acq-btn cw-acq-btn--eterna"
                    onClick={() => chooseEterna('choice')}
                  >
                    {copy.eternaCta}
                  </button>
                </div>
              </article>

              <article
                className="cw-acq-choice__card cw-acq-choice__card--historica"
                aria-labelledby="choice-historica"
              >
                <p className="cw-acq-choice__theme">{historica?.tierLabel ?? 'CENTRAL ROME'}</p>
                <h3 id="choice-historica" className="cw-acq-choice__name">
                  {historica?.name ?? 'Roma Historica'}
                </h3>
                <p className="cw-acq-choice__meta">
                  {historicaStats.stopCount} stops · Centro Storico and Pantheon deep dive
                </p>
                <p className="cw-acq-choice__price">{historica?.price ?? '€9.99'}</p>
                <div className="cw-acq-choice__actions">
                  <button
                    type="button"
                    className="cw-acq-btn cw-acq-btn--historica"
                    onClick={chooseHistorica}
                  >
                    {copy.historicaCta}
                  </button>
                </div>
              </article>
            </div>
          </div>

          <p className="cw-acq-choice__pricing-link">
            <Link
              to="/#pricing"
              className="cw-acq-text-link cw-acq-text-link--block"
              onClick={() => trackAncientRomeRouteClicked('rome-complete', 'choice_details')}
            >
              {copy.pricingDetailsCta}
            </Link>
          </p>

          <p className="cw-acq-hero__trust" style={{ marginTop: '1.5rem' }}>
            <Link to="/free-pantheon" className="cw-acq-link">
              Try the Pantheon free
            </Link>
            {' · '}
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
