import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Expand } from 'lucide-react'
import { LANDING_CONTENT } from './landingData.js'
import { observeLandingSectionOnce, trackLandingPricingView } from './landingAnalytics.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { LandingPackagePosterViewer } from './v4/LandingPackagePosterViewer.jsx'
import LandingAccessCta from './v4/LandingAccessCta.jsx'
import LandingPricingGuarantee from './v4/LandingPricingGuarantee.jsx'
import { preloadLandingImages, retryImageOnError } from './v4/preloadLandingImages.js'

const DESKTOP_MQ = '(min-width: 768px)'

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

function resolveTierFromHash(tiers) {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash.replace(/^#/, '')
  return tiers.find((tier) => tier.id === hash)?.id ?? null
}

function PacingNote({ text, className }) {
  if (!text) return null
  const match = text.match(/^(.*?)(1 or 2 days)(.*)$/i)
  if (!match) {
    return <p className={className}>{text}</p>
  }
  return (
    <p className={className}>
      {match[1]}
      <strong>{match[2]}</strong>
      {match[3]}
    </p>
  )
}

function DesktopPackageCard({ tier, index, onBeginTier }) {
  const theme = tier.theme ?? 'eterna'
  const alt = [
    tier.name,
    tier.tagline,
    tier.pacingNote,
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
          src={tier.cardImage}
          alt={alt}
          width={tier.cardWidth}
          height={tier.cardHeight}
          loading="eager"
          fetchPriority={index === 0 ? 'high' : 'auto'}
          onError={retryImageOnError}
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
      <PacingNote text={tier.pacingNote} className="cw-v4-pkg__pacing" />
    </article>
  )
}

function MobileRouteChooser({ tiers, onBeginTier }) {
  const reducedMotion = useReducedMotion()
  const tablistId = useId()
  const cardRef = useRef(null)
  const mapTriggerRef = useRef(null)
  const tabRefs = useRef([])

  const [activeId, setActiveId] = useState(
    () => resolveTierFromHash(tiers) ?? tiers[0]?.id ?? 'rome-complete',
  )
  const [viewerOpen, setViewerOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const activeTier = tiers.find((tier) => tier.id === activeId) ?? tiers[0]

  useEffect(() => {
    const applyHash = () => {
      const fromHash = resolveTierFromHash(tiers)
      if (fromHash) setActiveId(fromHash)
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [tiers])

  const selectTier = useCallback(
    (tierId, { syncHash = true } = {}) => {
      setActiveId(tierId)
      if (syncHash && typeof window !== 'undefined') {
        const next = `#${tierId}`
        if (window.location.hash !== next) {
          window.history.replaceState(null, '', next)
        }
      }
    },
    [],
  )

  const onTabKeyDown = (event, index) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'Home' && event.key !== 'End') {
      return
    }
    event.preventDefault()
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tiers.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tiers.length) % tiers.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tiers.length - 1
    const next = tiers[nextIndex]
    if (!next) return
    selectTier(next.id)
    tabRefs.current[nextIndex]?.focus()
  }

  const openViewer = () => setViewerOpen(true)

  const viewRouteFromCompare = (tierId) => {
    selectTier(tierId)
    setCompareOpen(false)
    const node = cardRef.current
    if (!node) return
    node.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  if (!activeTier) return null

  const theme = activeTier.theme ?? 'eterna'
  const badge = activeTier.tag || activeTier.badge
  const panelId = 'cw-mobile-route-panel'

  return (
    <div className="cw-v4-pkg-mobile" data-testid="cw-mobile-route-chooser">
      <div
        className="cw-v4-pkg-tabs"
        role="tablist"
        aria-label="Rome walking routes"
        id={tablistId}
      >
        {tiers.map((tier, index) => {
          const selected = tier.id === activeTier.id
          return (
            <button
              key={tier.id}
              ref={(node) => {
                tabRefs.current[index] = node
              }}
              type="button"
              role="tab"
              id={`cw-mobile-tab-${tier.id}`}
              className={`cw-v4-pkg-tab cw-v4-pkg-tab--${tier.theme}${selected ? ' is-active' : ''}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTier(tier.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {tier.name}
            </button>
          )
        })}
      </div>

      <article
        ref={cardRef}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`cw-mobile-tab-${activeTier.id}`}
        className={`cw-v4-pkg-mobile-card cw-v4-pkg-mobile-card--${theme}${reducedMotion ? '' : ' cw-v4-pkg-mobile-card--fade'}`}
        key={activeTier.id}
      >
        <span id={activeTier.id} className="cw-v4-visually-hidden" tabIndex={-1}>
          {activeTier.name}
        </span>
        {badge ? <p className="cw-v4-pkg-mobile-card__badge">{badge}</p> : null}
        <h3 id={`pricing-name-${activeTier.id}`} className="cw-v4-pkg-mobile-card__title">
          {activeTier.name}
        </h3>
        {activeTier.tagline ? (
          <p className="cw-v4-pkg-mobile-card__tagline">{activeTier.tagline}</p>
        ) : null}

        <ul className="cw-v4-pkg-mobile-card__facts" aria-label={`${activeTier.name} route facts`}>
          <li>
            <span className="cw-v4-pkg-mobile-card__fact-label">Duration</span>
            <span className="cw-v4-pkg-mobile-card__fact-value">{activeTier.durationLabel}</span>
          </li>
          <li>
            <span className="cw-v4-pkg-mobile-card__fact-label">Stops</span>
            <span className="cw-v4-pkg-mobile-card__fact-value">{activeTier.stopsLabel}</span>
          </li>
          <li>
            <span className="cw-v4-pkg-mobile-card__fact-label">Distance</span>
            <span className="cw-v4-pkg-mobile-card__fact-value">{activeTier.distanceLabel}</span>
          </li>
        </ul>

        <PacingNote text={activeTier.pacingNote} className="cw-v4-pkg-mobile-card__pacing" />

        <p className="cw-v4-pkg-mobile-card__desc">{activeTier.description}</p>

        <div className="cw-v4-pkg-mobile-card__price-row">
          <p className="cw-v4-pkg-mobile-card__price">{activeTier.price}</p>
          <p className="cw-v4-pkg-mobile-card__price-note">{activeTier.priceNote}</p>
        </div>

        <button
          type="button"
          className="cw-v4-pkg-mobile-card__cta"
          onClick={() => onBeginTier(activeTier.id)}
        >
          {activeTier.primaryCta}
        </button>

        <div className="cw-v4-pkg-mobile-card__map">
          <button
            type="button"
            className="cw-v4-pkg-mobile-card__map-frame"
            onClick={openViewer}
            aria-label={`View full illustrated route map for ${activeTier.name}`}
          >
            <img
              className="cw-v4-pkg-mobile-card__map-art"
              src={activeTier.cardImage}
              alt={`Illustrated route map for ${activeTier.name}`}
              width={activeTier.cardWidth}
              height={activeTier.cardHeight}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={retryImageOnError}
            />
            <div className="cw-v4-pkg-mobile-card__map-fade" aria-hidden="true" />
          </button>
          <button
            ref={mapTriggerRef}
            type="button"
            className="cw-v4-pkg-mobile-card__map-open"
            onClick={openViewer}
          >
            <Expand size={18} aria-hidden="true" />
            <span>View full illustrated route map</span>
          </button>
        </div>
      </article>

      <LandingPricingGuarantee />

      <details
        className="cw-v4-pkg-compare"
        open={compareOpen}
        onToggle={(event) => setCompareOpen(event.currentTarget.open)}
      >
        <summary className="cw-v4-pkg-compare__summary">Compare all routes</summary>
        <ul className="cw-v4-pkg-compare__list">
          {tiers.map((tier) => (
            <li key={tier.id} className={`cw-v4-pkg-compare__row cw-v4-pkg-compare__row--${tier.theme}`}>
              <div className="cw-v4-pkg-compare__copy">
                <p className="cw-v4-pkg-compare__name">{tier.name}</p>
                <p className="cw-v4-pkg-compare__meta">
                  {tier.durationLabel}
                  <span aria-hidden="true"> · </span>
                  {tier.stopsLabel}
                  <span aria-hidden="true"> · </span>
                  {tier.distanceLabel}
                </p>
                {tier.pacingNote ? (
                  <p className="cw-v4-pkg-compare__pacing">{tier.pacingNote}</p>
                ) : null}
                <p className="cw-v4-pkg-compare__price">{tier.price}</p>
              </div>
              <button
                type="button"
                className="cw-v4-pkg-compare__view"
                onClick={() => viewRouteFromCompare(tier.id)}
              >
                View route
              </button>
            </li>
          ))}
        </ul>
      </details>

      {viewerOpen ? (
        <LandingPackagePosterViewer
          key={activeTier.id}
          open
          tier={activeTier}
          onClose={() => setViewerOpen(false)}
          onBeginTier={onBeginTier}
          returnFocusRef={mapTriggerRef}
        />
      ) : null}    </div>
  )
}

/**
 * Act III: Choose your walk. Desktop poster stack + mobile route chooser.
 * Checkout stays in `onBeginTier` (purchase path, not access-code).
 */
export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT.pricing
  const tiers = section.tiers ?? []
  const shared = section.sharedExperience
  const bundles = shared?.bundles ?? []
  const sectionRef = useRef(null)
  const isDesktop = useMediaQuery(DESKTOP_MQ, true)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingPricingView()), [])

  useEffect(() => {
    preloadLandingImages((section.tiers ?? []).map((tier) => tier.cardImage))
  }, [section.tiers])

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

        {isDesktop ? (
          <>
            <div className="cw-v4-pkg-stack" data-testid="cw-desktop-pkg-stack">
              {tiers.map((tier, index) => (
                <DesktopPackageCard
                  key={tier.id}
                  tier={tier}
                  index={index}
                  onBeginTier={onBeginTier}
                />
              ))}
            </div>
            <LandingPricingGuarantee />
          </>
        ) : (
          <MobileRouteChooser tiers={tiers} onBeginTier={onBeginTier} />
        )}

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

        <LandingAccessCta className="cw-v4-access-cta--pricing" />
      </div>
    </section>
  )
}
