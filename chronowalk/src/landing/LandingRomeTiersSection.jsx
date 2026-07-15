import { useEffect, useRef } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import LandingTierRouteMap, { PinIcon } from './LandingTierRouteMap.jsx'
import { getLandingTierRouteStops } from './landingTierRoutes.js'
import { getLandingTierStats } from './landingTierStats.js'
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

/**
 * Act III — pricing. Map stays visible; stop list + inclusions fold open.
 * Checkout stays in `onBeginTier` (purchase path, not access-code).
 */
export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []
  const sectionRef = useRef(null)
  const timeLabel = section.metaTimeLabel ?? 'Est. duration'
  const stopsLabel = section.metaStopsLabel ?? 'Key stops'

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingPricingView()), [])

  return (
    <section
      ref={sectionRef}
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
          {section.intro ? <p className="cw-v2-pricing__intro">{section.intro}</p> : null}
        </header>

        <div className="cw-v2-pricing__grid">
          {tiers.map((tier) => {
            const isFeatured = tier.id === 'rome-complete'
            const stats = getLandingTierStats(tier.id)
            const stops = getLandingTierRouteStops(tier.id)
            const routeName = tier.name ?? tier.eyebrow
            const detailsId = `pricing-details-${tier.id}`

            return (
              <article
                key={tier.id}
                className={`cw-v2-pricing-card cw-v2-pricing-card--${tier.id}${isFeatured ? ' cw-v2-pricing-card--featured' : ''}`}
                aria-labelledby={`pricing-name-${tier.id}`}
              >
                {tier.badge ? (
                  <span className="cw-v2-pricing-card__ribbon">{tier.badge}</span>
                ) : null}

                <h3 id={`pricing-name-${tier.id}`} className="cw-v2-pricing-card__name">
                  {routeName}
                </h3>
                <p className="cw-v2-pricing-card__best-for">{tier.bestFor}</p>

                <div className="cw-v2-pricing-card__price-row">
                  <span className="cw-v2-pricing-card__price">{tier.price}</span>
                  <span className="cw-v2-pricing-card__note">{tier.priceNote}</span>
                </div>

                <dl className="cw-v2-pricing-card__meta" aria-label={`${routeName} coverage`}>
                  <div className="cw-v2-pricing-card__meta-item">
                    <dt>{timeLabel}</dt>
                    <dd>{stats.routeTimeLabel}</dd>
                  </div>
                  <div className="cw-v2-pricing-card__meta-item">
                    <dt>{stopsLabel}</dt>
                    <dd>{stats.stopCount}</dd>
                  </div>
                </dl>

                <p className="cw-v2-pricing-card__outcome">{tier.outcome}</p>

                <LandingTierRouteMap tierId={tier.id} featured={isFeatured} />

                <button
                  type="button"
                  className={
                    isFeatured
                      ? 'cw-v2-btn cw-v2-btn--coral cw-v2-btn--block cw-v2-pricing-card__cta'
                      : 'cw-v2-btn cw-v2-btn--tier cw-v2-btn--block cw-v2-pricing-card__cta'
                  }
                  onClick={() => onBeginTier(tier.id)}
                >
                  {tier.primaryCta}
                </button>

                <details className="cw-v2-pricing-card__details" id={detailsId}>
                  <summary className="cw-v2-pricing-card__summary">
                    {tier.expandLabel ?? 'See stop list & inclusions'}
                  </summary>

                  <div className="cw-v2-pricing-card__details-body">
                    <ul className="cw-v2-pricing-card__list cw-v2-pricing-card__list--monuments">
                      {stops.map((stop) => (
                        <li key={stop.id} className="cw-v2-pricing-card__item">
                          <PinIcon featured={isFeatured} />
                          <span>{stop.title}</span>
                        </li>
                      ))}
                    </ul>

                    <ul className="cw-v2-pricing-card__list cw-v2-pricing-card__list--inclusions">
                      {tier.includesLabel ? (
                        <li className="cw-v2-pricing-card__item">
                          <CheckIcon />
                          <span>{tier.includesLabel}</span>
                        </li>
                      ) : null}
                      {tier.featuredBullet ? (
                        <li className="cw-v2-pricing-card__item cw-v2-pricing-card__item--bold">
                          <CheckIcon />
                          <span>{tier.featuredBullet}</span>
                        </li>
                      ) : null}
                      {tier.bullets.map((item) => (
                        <li key={item} className="cw-v2-pricing-card__item">
                          <CheckIcon />
                          <span>{item}</span>
                        </li>
                      ))}
                      {tier.landmarkLine ? (
                        <li className="cw-v2-pricing-card__item">
                          <CheckIcon />
                          <span>{tier.landmarkLine}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </details>
              </article>
            )
          })}
        </div>

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
