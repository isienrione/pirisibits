import { useEffect, useRef } from 'react'
import { REBUILD_PRICING } from '../rebuildCopy.js'
import { LANDING_PRODUCT } from '../landingProduct.js'
import { observeLandingSectionOnce, trackLandingPricingView } from '../landingAnalytics.js'

/**
 * Pricing — Roma Eterna featured first, short routes below.
 * @param {{ onBeginTier?: (tierId: string) => void }} props
 */
export default function RebuildPricing({ onBeginTier }) {
  const copy = REBUILD_PRICING
  const eterna = LANDING_PRODUCT.eterna
  const sectionRef = useRef(null)

  useEffect(
    () => observeLandingSectionOnce(sectionRef.current, () => trackLandingPricingView()),
    [],
  )

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="cw-rb-section cw-rb-pricing cw-rb-surface--light"
      aria-labelledby="pricing-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <h2 id="pricing-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.subhead}</p>
        </header>

        <article className="cw-rb-pricing__featured" aria-labelledby="pricing-eterna-name">
          <p className="cw-rb-pricing__label">{copy.eternaLabel}</p>
          <h3 id="pricing-eterna-name" className="cw-rb-pricing__name">
            {copy.eternaName}
          </h3>
          {eterna?.priceLabel ? (
            <p className="cw-rb-pricing__price">{eterna.priceLabel}</p>
          ) : null}

          <ul className="cw-rb-pricing__bullets">
            {copy.eternaBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <div className="cw-rb-actions">
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--primary"
              onClick={() => onBeginTier?.(eterna?.id ?? 'rome-complete')}
            >
              {copy.eternaCta}
            </button>
          </div>

          <p className="cw-rb-pricing__value">{copy.valueCompare}</p>
          <p className="cw-rb-pricing__notes">
            {copy.checkoutNote}
            <br />
            {copy.taxNote}
          </p>
        </article>

        <div className="cw-rb-pricing__short">
          <h3 className="cw-rb-pricing__short-title">{copy.shortHeading}</h3>
          <div className="cw-rb-pricing__short-grid">
            {copy.shortRoutes.map((route) => (
              <div key={route.id} className="cw-rb-pricing__short-item">
                <h4 className="cw-rb-pricing__short-name">{route.name}</h4>
                <p className="cw-rb-pricing__short-meta">
                  {route.stops} stops · {route.price}
                </p>
                <p className="cw-rb-pricing__short-blurb">{route.blurb}</p>
                <button
                  type="button"
                  className="cw-rb-btn cw-rb-btn--secondary"
                  onClick={() => onBeginTier?.(route.id)}
                >
                  {route.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
