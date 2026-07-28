import { useEffect, useId, useMemo, useRef } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import TourRouteIllustration from '../redesign/ui/TourRouteIllustration.jsx'
import { loadRomeManifest } from '../content/manifest.js'
import { JOURNEY_PACE } from '../data/romePacing.js'
import { observeLandingSectionOnce, trackLandingPricingView } from './landingAnalytics.js'

const TIER_PACE = {
  'rome-complete': JOURNEY_PACE.HEROIC,
  'rome-central': JOURNEY_PACE.CENTRAL,
  'rome-essential': JOURNEY_PACE.CLASSIC,
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7v5.2l3.2 1.8" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 21s6-5.2 6-10.2A6 6 0 0 0 6 10.8C6 15.8 12 21 12 21Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="10.5" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function WalkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="13.2" cy="4.4" r="1.7" fill="currentColor" />
      <path
        d="M10.2 21.2 12 13.4l2.2 2.1 2.6 5.7M12 13.4 9.1 10.6 7 13.8M12 13.4l3.1-3.5 2.2.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4v10" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="m8.5 11.5 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 18.5h14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M7 4.5h10v15l-5-3.2-5 3.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="m12 6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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

const FOOT_ICONS = {
  pin: PinIcon,
  download: DownloadIcon,
  bookmark: BookmarkIcon,
}

function PackageCard({ tier, index, onBeginTier, romeManifest }) {
  const mapTitleId = useId()
  const theme = tier.theme ?? 'eterna'
  const footFeatures = tier.footFeatures ?? [
    { icon: 'pin', title: 'Start anywhere', body: 'Begin at any stop' },
    { icon: 'download', title: 'Download & go', body: 'Use offline' },
    { icon: 'bookmark', title: 'Pick up anytime', body: 'Your progress is saved' },
  ]

  return (
    <article
      id={tier.id}
      className={`cw-v4-pkg cw-v4-pkg--${theme}`}
      aria-labelledby={`pricing-name-${tier.id}`}
    >
      <div className="cw-v4-pkg__inner">
        <div className="cw-v4-pkg__copy">
          {tier.tag || tier.badge ? <p className="cw-v4-pkg__tag">{tier.tag || tier.badge}</p> : null}
          <h3 id={`pricing-name-${tier.id}`} className="cw-v4-pkg__title">
            {tier.name}
          </h3>
          {tier.tagline ? <p className="cw-v4-pkg__tagline">{tier.tagline}</p> : null}
          <p className="cw-v4-pkg__desc">{tier.description}</p>

          <ul className="cw-v4-pkg__stats" aria-label={`${tier.name} route facts`}>
            <li>
              <span className="cw-v4-pkg__stat-icon" aria-hidden="true">
                <ClockIcon />
              </span>
              <span className="cw-v4-pkg__stat-label">Est. duration</span>
              <span className="cw-v4-pkg__stat-value">{tier.durationLabel}</span>
            </li>
            <li>
              <span className="cw-v4-pkg__stat-icon" aria-hidden="true">
                <PinIcon />
              </span>
              <span className="cw-v4-pkg__stat-label">Stops</span>
              <span className="cw-v4-pkg__stat-value">{tier.stopsLabel}</span>
            </li>
            <li>
              <span className="cw-v4-pkg__stat-icon" aria-hidden="true">
                <WalkIcon />
              </span>
              <span className="cw-v4-pkg__stat-label">Distance</span>
              <span className="cw-v4-pkg__stat-value">{tier.distanceLabel}</span>
            </li>
          </ul>

          {tier.legend?.length ? (
            <div className="cw-v4-pkg__legend" aria-label="Route options">
              {tier.legend.map((row) => (
                <div
                  key={row.label}
                  className={`cw-v4-pkg__legend-row cw-v4-pkg__legend-row--${row.tone || 'full'}`}
                >
                  <span className="cw-v4-pkg__legend-swatch" aria-hidden="true" />
                  <div>
                    <p className="cw-v4-pkg__legend-label">{row.label}</p>
                    <p className="cw-v4-pkg__legend-detail">{row.detail}</p>
                  </div>
                </div>
              ))}
              {tier.includesLabel ? (
                <p className="cw-v4-pkg__includes">{tier.includesLabel}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="cw-v4-pkg__map" aria-labelledby={mapTitleId}>
          <p id={mapTitleId} className="cw-v4-visually-hidden">
            {tier.name} route map
          </p>
          {romeManifest ? (
            <div className="cw-v4-pkg__route" aria-hidden="true">
              <TourRouteIllustration
                manifest={romeManifest}
                context={{ path: 'a', pace: TIER_PACE[tier.id] ?? JOURNEY_PACE.HEROIC }}
              />
            </div>
          ) : tier.mapImage ? (
            <img
              className="cw-v4-pkg__map-art"
              src={tier.mapImage}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ) : null}
        </div>
      </div>

      <div className="cw-v4-pkg__buy">
        <div className="cw-v4-pkg__price-block">
          <p className="cw-v4-pkg__price">{tier.price}</p>
          <p className="cw-v4-pkg__price-note">
            {tier.priceNote}
            <span>Taxes included where applicable.</span>
          </p>
        </div>
        {tier.outcome ? <p className="cw-v4-pkg__pitch">{tier.outcome}</p> : null}
        <button
          type="button"
          className="cw-v4-pkg__cta"
          onClick={() => onBeginTier(tier.id)}
        >
          <span>{tier.primaryCta}</span>
          <span className="cw-v4-pkg__cta-arrow" aria-hidden="true">
            <ArrowIcon />
          </span>
        </button>
      </div>

      <ul className="cw-v4-pkg__foot" aria-label="Included with every walk">
        {footFeatures.map((feature) => {
          const Icon = FOOT_ICONS[feature.icon] || PinIcon
          return (
            <li key={feature.title}>
              <span className="cw-v4-pkg__foot-icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{feature.title}</strong>
                <em>{feature.body || feature.detail}</em>
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}

/**
 * Act III: Choose your walk. Themed package cards + Couple/Family.
 * Checkout stays in `onBeginTier` (purchase path, not access-code).
 */
export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []
  const shared = section.sharedExperience
  const bundles = shared?.bundles ?? []
  const sectionRef = useRef(null)
  const romeManifest = useMemo(() => loadRomeManifest(), [])

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
          {section.intro ? (
            <p className="cw-v2-pricing__intro">{section.intro}</p>
          ) : null}
        </header>

        <div className="cw-v4-pkg-stack">
          {tiers.map((tier, index) => (
            <PackageCard
              key={tier.id}
              tier={tier}
              index={index}
              onBeginTier={onBeginTier}
              romeManifest={romeManifest}
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
