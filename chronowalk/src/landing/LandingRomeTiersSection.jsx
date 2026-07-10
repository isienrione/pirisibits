import { LANDING_CONTENT } from './landingData.js'
import LandingTierRouteMap, { PinIcon } from './LandingTierRouteMap.jsx'
import { getLandingTierRouteStops } from './landingTierRoutes.js'

function CheckIcon({ featured }) {
  return (
    <svg
      className={`cw-v2-pricing__check${featured ? ' cw-v2-pricing__check--coral' : ''}`}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
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

export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-pricing"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--pricing">
        <header className="cw-v2-section__header">
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
          <p className="cw-v2-section__lead">{section.subheadline}</p>
        </header>

        <div className="cw-v2-pricing__grid">
          {tiers.map((tier) => {
            const isFeatured = tier.id === 'rome-complete'

            return (
              <article
                key={tier.id}
                className={`cw-v2-pricing-card${isFeatured ? ' cw-v2-pricing-card--featured' : ''}`}
              >
                {tier.badge ? (
                  <span className="cw-v2-pricing-card__ribbon">{tier.badge}</span>
                ) : null}

                <p className={`cw-v2-pricing-card__eyebrow${isFeatured ? ' cw-v2-pricing-card__eyebrow--gold' : ''}`}>
                  {tier.eyebrow}
                  {tier.tierLabel ? (
                    <span className="cw-v2-pricing-card__tier-label"> · {tier.tierLabel}</span>
                  ) : null}
                </p>

                <div className="cw-v2-pricing-card__price-row">
                  <span className="cw-v2-pricing-card__price">{tier.price}</span>
                  <span className="cw-v2-pricing-card__note">{tier.priceNote}</span>
                </div>

                <p className="cw-v2-pricing-card__description">{tier.description}</p>

                {tier.landmarkLine ? (
                  <p className="cw-v2-pricing-card__landmarks">{tier.landmarkLine}</p>
                ) : null}

                <LandingTierRouteMap tierId={tier.id} featured={isFeatured} />

                <ul className="cw-v2-pricing-card__list cw-v2-pricing-card__list--monuments">
                  {getLandingTierRouteStops(tier.id).map((stop) => (
                    <li key={stop.id} className="cw-v2-pricing-card__item">
                      <PinIcon featured={isFeatured} />
                      <span>{stop.title}</span>
                    </li>
                  ))}
                </ul>

                <ul className="cw-v2-pricing-card__list">
                  {!isFeatured
                    ? tier.bullets.map((item) => (
                        <li key={item} className="cw-v2-pricing-card__item">
                          <CheckIcon />
                          <span>{item}</span>
                        </li>
                      ))
                    : null}
                  {isFeatured && tier.includesLabel ? (
                    <li className="cw-v2-pricing-card__item">
                      <CheckIcon featured />
                      <span>{tier.includesLabel}</span>
                    </li>
                  ) : null}
                  {tier.featuredBullet ? (
                    <li className="cw-v2-pricing-card__item cw-v2-pricing-card__item--bold">
                      <CheckIcon featured />
                      <span>{tier.featuredBullet}</span>
                    </li>
                  ) : null}
                  {isFeatured
                    ? tier.bullets.map((item) => (
                        <li key={item} className="cw-v2-pricing-card__item">
                          <CheckIcon featured />
                          <span>{item}</span>
                        </li>
                      ))
                    : null}
                </ul>

                <button
                  type="button"
                  className={
                    isFeatured
                      ? 'cw-v2-btn cw-v2-btn--coral cw-v2-btn--block'
                      : 'cw-v2-btn cw-v2-btn--outline cw-v2-btn--block'
                  }
                  onClick={() => onBeginTier(tier.id)}
                >
                  {tier.primaryCta}
                </button>
              </article>
            )
          })}
        </div>

        {section.footnote ? <p className="cw-v2-pricing__footnote">{section.footnote}</p> : null}
      </div>
    </section>
  )
}
