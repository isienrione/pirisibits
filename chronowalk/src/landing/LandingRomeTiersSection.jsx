import { useEffect, useMemo, useRef } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import LandingTierRouteMap, { PinIcon } from './LandingTierRouteMap.jsx'
import TourRouteIllustration from '../redesign/ui/TourRouteIllustration.jsx'
import { loadRomeManifest } from '../content/manifest.js'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { getLandingTierRouteStops } from './landingTierRoutes.js'
import { getLandingTierStats } from './landingTierStats.js'
import { observeLandingSectionOnce, trackLandingPricingView } from './landingAnalytics.js'

const TIER_PACE = {
  'rome-complete': JOURNEY_PACE.HEROIC,
  'rome-central': JOURNEY_PACE.CENTRAL,
  'rome-essential': JOURNEY_PACE.CLASSIC,
}

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
 * Couple/Family bundles follow the route cards as a shared-experience block.
 * Checkout stays in `onBeginTier` (purchase path, not access-code).
 */
export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []
  const shared = section.sharedExperience
  const bundles = shared?.bundles ?? []
  const sectionRef = useRef(null)
  const timeLabel = section.metaTimeLabel ?? 'Est. duration'
  const stopsLabel = section.metaStopsLabel ?? 'Key stops'
  const romeManifest = useMemo(() => loadRomeManifest(), [])

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

                {isFeatured && romeManifest ? (
                  <div className="cw-v2-pricing-card__route-illustration" aria-hidden="true">
                    <TourRouteIllustration
                      manifest={romeManifest}
                      context={{ path: 'a', pace: TIER_PACE[tier.id] ?? JOURNEY_PACE.HEROIC }}
                    />
                  </div>
                ) : (
                  <LandingTierRouteMap tierId={tier.id} featured={isFeatured} />
                )}

                <button
                  type="button"
                  className="cw-v2-btn cw-v2-btn--tier cw-v2-btn--block cw-v2-pricing-card__cta"
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
