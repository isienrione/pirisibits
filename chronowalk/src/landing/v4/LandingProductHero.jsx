import { LANDING_CONTENT } from '../landingData.js'
import { LANDING_HERO } from '../landingVisualAssets.js'
import { LandingResponsivePicture } from '../LandingResponsivePicture.jsx'
import { LANDING_ANALYTICS_SECTIONS } from '../landingAnalytics.js'

/**
 * Rome-sky hero — no phone screenshots. Three actions only.
 */
export default function LandingProductHero({ onPreview, onUnlock, onReviews }) {
  const section = LANDING_CONTENT.hero

  return (
    <section id={section.id} className="cw-v4-hero" aria-labelledby="cw-v4-hero-heading">
      <div className="cw-v4-hero__sky" aria-hidden>
        <LandingResponsivePicture
          image={LANDING_HERO}
          className="cw-v4-hero__photo"
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="cw-v4-hero__clouds" />
        <div className="cw-v4-hero__veil" />
      </div>

      <div className="cw-v4-hero__copy">
        <p className="cw-v4-hero__brand">{section.eyebrow}</p>
        <h1 id="cw-v4-hero-heading" className="cw-v4-hero__title">
          {section.headline}
        </h1>
        <p className="cw-v4-hero__lead">{section.subheadline}</p>
        {section.accentLine ? <p className="cw-v4-hero__accent">{section.accentLine}</p> : null}

        <div className="cw-v4-hero__actions">
          <a
            href={section.primaryHref ?? '#pricing'}
            className="cw-v4-btn cw-v4-btn--primary"
            onClick={() => onUnlock?.(LANDING_ANALYTICS_SECTIONS.HERO)}
          >
            {section.primaryCta}
          </a>
          <button
            type="button"
            className="cw-v4-btn cw-v4-btn--secondary"
            onClick={() => onPreview?.(LANDING_ANALYTICS_SECTIONS.HERO)}
          >
            {section.secondaryCta}
          </button>
          <a
            href={section.reviewsHref ?? '#trust'}
            className="cw-v4-btn cw-v4-btn--ghost"
            onClick={() => onReviews?.(LANDING_ANALYTICS_SECTIONS.HERO)}
          >
            {section.reviewsCta}
          </a>
        </div>

        {section.trustLine ? <p className="cw-v4-hero__trust">{section.trustLine}</p> : null}
      </div>
    </section>
  )
}
