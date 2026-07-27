import { useEffect, useRef } from 'react'
import { REBUILD_PRICING } from '../rebuildCopy.js'
import { LANDING_PRODUCT } from '../landingProduct.js'
import { getLandingMonuments } from '../landingMonuments.js'
import { observeLandingSectionOnce, trackLandingPricingView } from '../landingAnalytics.js'

/**
 * Pricing — Roma Eterna dominant; short routes secondary.
 * Couple / Family live in RebuildWalkTogether.
 * @param {{ onBeginTier?: (tierId: string, section?: string) => void }} props
 */
export default function RebuildPricing({ onBeginTier }) {
  const copy = REBUILD_PRICING
  const eterna = LANDING_PRODUCT.eterna
  const sectionRef = useRef(null)
  const monuments = getLandingMonuments()

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
      data-rb-compete-cta="true"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header className="cw-rb-pricing__header">
          <h2 id="pricing-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          {copy.subhead ? <p className="cw-rb-lead">{copy.subhead}</p> : null}
        </header>

        <article className="cw-rb-pricing__featured" aria-labelledby="pricing-eterna-name">
          <p className="cw-rb-pricing__label">{copy.eternaLabel}</p>
          <h3 id="pricing-eterna-name" className="cw-rb-pricing__name">
            {copy.eternaName}
          </h3>
          <p className="cw-rb-pricing__meta">
            {eterna?.stopCount} stops · {eterna?.priceLabel} once
          </p>
          {copy.eternaBlurb ? <p className="cw-rb-pricing__blurb">{copy.eternaBlurb}</p> : null}
          {copy.eternaBullets?.length ? (
            <ul className="cw-rb-check-list">
              {copy.eternaBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
            onClick={() => onBeginTier?.(eterna?.id ?? 'rome-complete')}
          >
            {copy.eternaCta}
          </button>
          {copy.valueCompare ? <p className="cw-rb-pricing__value">{copy.valueCompare}</p> : null}
        </article>

        <p className="cw-rb-pricing__short-heading">{copy.shortHeading}</p>
        <div className="cw-rb-pricing__short-grid">
          {copy.shortRoutes.map((route) => {
            const thumb = monuments.find((m) => m.id === route.thumbStopId)?.photo
            return (
              <article key={route.id} className="cw-rb-pricing__short-card">
                <div className="cw-rb-pricing__short-thumb">
                  {thumb ? (
                    <img src={thumb} alt="" width={96} height={96} loading="lazy" decoding="async" />
                  ) : null}
                </div>
                <h3 className="cw-rb-pricing__short-name">{route.name}</h3>
                <p className="cw-rb-pricing__short-meta">
                  {route.stops} stops · {route.price}
                </p>
                <button
                  type="button"
                  className="cw-rb-btn cw-rb-btn--ghost cw-rb-btn--block"
                  onClick={() => onBeginTier?.(route.id)}
                >
                  {route.cta}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
