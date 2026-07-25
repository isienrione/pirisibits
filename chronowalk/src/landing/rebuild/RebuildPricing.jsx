import { useEffect, useId, useRef, useState } from 'react'
import { REBUILD_PRICING, REBUILD_WALK_TOGETHER } from '../rebuildCopy.js'
import { LANDING_PRODUCT } from '../landingProduct.js'
import { getLandingMonuments } from '../landingMonuments.js'
import { observeLandingSectionOnce, trackLandingPricingView } from '../landingAnalytics.js'

/**
 * Compact purchase decision — Eterna featured, shorter routes + Walk Together disclosures.
 * @param {{ onBeginTier?: (tierId: string, section?: string) => void, showWalkTogether?: boolean }} props
 */
export default function RebuildPricing({ onBeginTier, showWalkTogether = true }) {
  const copy = REBUILD_PRICING
  const together = REBUILD_WALK_TOGETHER
  const eterna = LANDING_PRODUCT.eterna
  const sectionRef = useRef(null)
  const [shortOpen, setShortOpen] = useState(false)
  const [togetherOpen, setTogetherOpen] = useState(false)
  const [group, setGroup] = useState('couple')
  const shortId = useId()
  const togetherId = useId()
  const monuments = getLandingMonuments()

  useEffect(
    () => observeLandingSectionOnce(sectionRef.current, () => trackLandingPricingView()),
    [],
  )

  const selectedGroup = group === 'family' ? together.family : together.couple

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="cw-rb-section cw-rb-pricing cw-rb-surface--light"
      aria-labelledby="pricing-heading"
      data-rb-compete-cta="true"
    >
      <div id="walk-together" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
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
          <p className="cw-rb-pricing__meta">
            {eterna?.stopCount} stops · {eterna?.priceLabel} once
          </p>
          <p className="cw-rb-pricing__blurb">{copy.eternaBlurb}</p>

          <ul className="cw-rb-pricing__bullets">
            {copy.eternaBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>

          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
            onClick={() => onBeginTier?.(eterna?.id ?? 'rome-complete')}
          >
            {copy.eternaCta}
          </button>
          <p className="cw-rb-pricing__notes">{copy.checkoutNote}</p>
        </article>

        <details
          className="cw-rb-pricing__disclosure"
          open={shortOpen}
          onToggle={(e) => setShortOpen(e.currentTarget.open)}
        >
          <summary>
            <span>{copy.shortHeading}</span>
            {!shortOpen ? (
              <span className="cw-rb-pricing__summary-meta">
                {copy.shortRoutes
                  .map((r) => `${r.name.replace('Roma ', '')} · ${r.stops} · ${r.price}`)
                  .join(' · ')}
              </span>
            ) : null}
          </summary>
          <div id={shortId} className="cw-rb-pricing__short-list">
            {copy.shortRoutes.map((route) => {
              const thumb = monuments.find((m) => m.id === route.thumbStopId)?.photo
              return (
                <div key={route.id} className="cw-rb-pricing__short-row">
                  <div className="cw-rb-pricing__short-thumb">
                    {thumb ? (
                      <img src={thumb} alt="" width={72} height={72} loading="lazy" decoding="async" />
                    ) : null}
                  </div>
                  <div className="cw-rb-pricing__short-copy">
                    <h4 className="cw-rb-pricing__short-name">{route.name}</h4>
                    <p className="cw-rb-pricing__short-meta">
                      {route.stops} stops · {route.price}
                    </p>
                    <p className="cw-rb-pricing__short-blurb">{route.blurb}</p>
                    <button
                      type="button"
                      className="cw-rb-btn cw-rb-btn--secondary cw-rb-btn--compact"
                      onClick={() => onBeginTier?.(route.id)}
                    >
                      {route.cta}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </details>

        {showWalkTogether ? (
          <details
            className="cw-rb-pricing__disclosure"
            open={togetherOpen}
            onToggle={(e) => setTogetherOpen(e.currentTarget.open)}
          >
            <summary>
              <span>{copy.togetherHeading}</span>
              {!togetherOpen ? (
                <span className="cw-rb-pricing__summary-meta">
                  Couple · {together.couple.price} · Family · {together.family.price}
                </span>
              ) : null}
            </summary>
            <div id={togetherId} className="cw-rb-pricing__together">
              <p className="cw-rb-pricing__together-body">{copy.togetherBody}</p>
              <div className="cw-rb-pricing__segment" role="group" aria-label="Group pass">
                <button
                  type="button"
                  className={`cw-rb-pricing__seg${group === 'couple' ? ' is-active' : ''}`}
                  aria-pressed={group === 'couple'}
                  onClick={() => setGroup('couple')}
                >
                  Couple
                </button>
                <button
                  type="button"
                  className={`cw-rb-pricing__seg${group === 'family' ? ' is-active' : ''}`}
                  aria-pressed={group === 'family'}
                  onClick={() => setGroup('family')}
                >
                  Family
                </button>
              </div>
              <p className="cw-rb-pricing__together-offer">
                {selectedGroup.detail} · {selectedGroup.price}
              </p>
              <ul className="cw-rb-pricing__together-benefits">
                {copy.togetherBenefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                className="cw-rb-btn cw-rb-btn--secondary cw-rb-btn--block"
                onClick={() => onBeginTier?.(selectedGroup.id, 'walk-together')}
              >
                {selectedGroup.label}
              </button>
              <p className="cw-rb-pricing__together-sync">{together.syncNote}</p>
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}
