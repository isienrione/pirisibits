import { useEffect, useRef } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import { observeLandingSectionOnce, trackLandingPricingView } from './landingAnalytics.js'

function CheckIcon() {
  return (
    <svg className="cw-v2-pricing__check" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M4 10.5 8 14.5 16 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PackageCard({ tier, index, onBeginTier }) {
  const theme = tier.theme ?? 'eterna'
  const cardImage = tier.cardImage
  const alt = [
    tier.name,
    tier.tagline,
    tier.price,
    `${tier.stopsLabel}, ${tier.durationLabel}, ${tier.distanceLabel}.`,
    tier.description,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      id={tier.id}
      className={`cw-v4-pkg cw-v4-pkg--image cw-v4-pkg--${theme}`}
      aria-labelledby={`pricing-name-${tier.id}`}
    >
      <h3 id={`pricing-name-${tier.id}`} className="cw-v4-visually-hidden">
        {tier.name}
      </h3>
      <p className="cw-v4-visually-hidden">
        {tier.price}. {tier.priceNote}. {tier.description}
      </p>

      <div className="cw-v4-pkg__frame">
        <img
          className="cw-v4-pkg__card-art"
          src={cardImage}
          alt={alt}
          width={tier.cardWidth}
          height={tier.cardHeight}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
        />
        <button
          type="button"
          className="cw-v4-pkg__hotspot"
          onClick={() => onBeginTier(tier.id)}
          aria-label={tier.primaryCta}
        >
          <span className="cw-v4-visually-hidden">{tier.primaryCta}</span>
        </button>
      </div>
    </article>
  )
}

/**
 * Act III: Choose your walk. Full package-card artwork + Couple/Family.
 * Checkout stays in `onBeginTier` (purchase path, not access-code).
 */
export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []
  const shared = section.sharedExperience
  const bundles = shared?.bundles ?? []
  const sectionRef = useRef(null)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingPricingView()), [])

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="cw-v2-section cw-v2-pricing cw-v4-pricing"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--pricing cw-v4-wrap">
        <header className="cw-v2-section__header cw-v4-section-head cw-v4-pricing__head">
          {section.eyebrow ? <p className="cw-v4-eyebrow">{section.eyebrow}</p> : null}
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title cw-v4-section-title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v2-section__lead cw-v4-section-lead">{section.subheadline}</p>
          ) : null}
          {section.intro ? <p className="cw-v2-pricing__intro">{section.intro}</p> : null}
        </header>

        <div className="cw-v4-pkg-stack">
          {tiers.map((tier, index) => (
            <PackageCard
              key={tier.id}
              tier={tier}
              index={index}
              onBeginTier={onBeginTier}
            />
          ))}
        </div>

        {shared && bundles.length > 0 ? (
          <div
            className="cw-v2-pricing__shared"
            id={shared.id}
            aria-labelledby={`${shared.id}-heading`}
          >
            <header className="cw-v2-pricing__shared-header">
              <h3 id={`${shared.id}-heading`} className="cw-v2-pricing__shared-title">
                {shared.headline}
              </h3>
              <p className="cw-v2-pricing__shared-lead">{shared.lead}</p>
            </header>

            <div className="cw-v2-pricing__shared-grid">
              {bundles.map((bundle) => (
                <article
                  key={bundle.id}
                  id={bundle.id}
                  className={`cw-v2-pricing-card cw-v2-pricing-card--bundle cw-v2-pricing-card--${bundle.id}`}
                  aria-labelledby={`pricing-name-${bundle.id}`}
                >
                  {bundle.badge ? (
                    <span className="cw-v2-pricing-card__ribbon cw-v2-pricing-card__ribbon--savings">
                      {bundle.badge}
                    </span>
                  ) : null}

                  <h4 id={`pricing-name-${bundle.id}`} className="cw-v2-pricing-card__name">
                    {bundle.name}
                  </h4>
                  <p className="cw-v2-pricing-card__best-for">{bundle.bestFor}</p>

                  <div className="cw-v2-pricing-card__price-row">
                    <span className="cw-v2-pricing-card__price">{bundle.price}</span>
                    <span className="cw-v2-pricing-card__note">{bundle.priceNote}</span>
                  </div>

                  <dl
                    className="cw-v2-pricing-card__meta cw-v2-pricing-card__meta--bundle"
                    aria-label={`${bundle.name} allowance`}
                  >
                    <div className="cw-v2-pricing-card__meta-item">
                      <dt>People / devices</dt>
                      <dd>{bundle.seatLabel}</dd>
                    </div>
                    <div className="cw-v2-pricing-card__meta-item">
                      <dt>Included tour</dt>
                      <dd>{bundle.contentLine}</dd>
                    </div>
                  </dl>

                  <div
                    className="cw-v2-pricing-card__content-callout"
                    aria-label={`${bundle.name} content entitlement`}
                  >
                    <p className="cw-v2-pricing-card__content-title">{bundle.contentTitle}</p>
                    <p className="cw-v2-pricing-card__content-stops">{bundle.contentStops}</p>
                    <p className="cw-v2-pricing-card__content-loop">{bundle.contentLoop}</p>
                  </div>

                  <p className="cw-v2-pricing-card__per-person">{bundle.perPerson}</p>
                  <p className="cw-v2-pricing-card__savings-line">{bundle.savingsLine}</p>
                  <p className="cw-v2-pricing-card__outcome">{bundle.outcome}</p>

                  <ul className="cw-v2-pricing-card__list cw-v2-pricing-card__list--inclusions">
                    {bundle.bullets.map((item) => (
                      <li key={item} className="cw-v2-pricing-card__item">
                        <CheckIcon />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className="cw-v2-btn cw-v2-btn--tier cw-v2-btn--block cw-v2-pricing-card__cta"
                    onClick={() => onBeginTier(bundle.id)}
                  >
                    {bundle.primaryCta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        ) : null}

        {section.footnote ? <p className="cw-v2-pricing__footnote">{section.footnote}</p> : null}

        {section.accessHref ? (
          <p className="cw-v2-pricing__access">
            <a href={section.accessHref} className="cw-v2-pricing__access-link">
              {section.accessLinkLabel ?? 'Already purchased? Enter your access link'}
            </a>
          </p>
        ) : null}
      </div>
    </section>
  )
}
