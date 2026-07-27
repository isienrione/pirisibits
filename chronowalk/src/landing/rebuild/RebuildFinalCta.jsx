import { LANDING_ENDING } from '../landingVisualAssets.js'
import { REBUILD_FINAL } from '../rebuildCopy.js'

/**
 * Emotional final CTA — dramatic monument (Trevi), distinct from earlier shots.
 * @param {{ onPrimary?: () => void, onSecondary?: () => void }} props
 */
export default function RebuildFinalCta({ onPrimary, onSecondary }) {
  const copy = REBUILD_FINAL

  return (
    <section
      id={copy.id}
      className="cw-rb-final"
      aria-labelledby="final-cta-heading"
      data-rb-compete-cta="true"
    >
      <figure className="cw-rb-photo cw-rb-photo--drama cw-rb-final__media">
        <picture>
          <source
            type="image/avif"
            media="(min-width: 48rem)"
            srcSet={LANDING_ENDING.desktopAvif}
          />
          <source
            type="image/webp"
            media="(min-width: 48rem)"
            srcSet={LANDING_ENDING.desktopWebp}
          />
          <source media="(min-width: 48rem)" srcSet={LANDING_ENDING.desktopSrc} />
          <source type="image/avif" srcSet={LANDING_ENDING.mobileAvif} />
          <source type="image/webp" srcSet={LANDING_ENDING.mobileWebp} />
          <img
            src={LANDING_ENDING.mobileSrc}
            alt={LANDING_ENDING.alt}
            width={LANDING_ENDING.mobileWidth}
            height={LANDING_ENDING.mobileHeight}
            loading="lazy"
            decoding="async"
            style={{ objectPosition: LANDING_ENDING.objectPosition }}
          />
        </picture>
      </figure>
      <div className="cw-rb-wrap cw-rb-wrap--narrow cw-rb-final__copy">
        <h2 id="final-cta-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        {copy.support ? <p className="cw-rb-lead">{copy.support}</p> : null}
        <div className="cw-rb-final__actions">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--urgency cw-rb-btn--block"
            onClick={onPrimary}
          >
            {copy.primaryCta}
          </button>
          <button type="button" className="cw-rb-btn cw-rb-btn--ghost" onClick={onSecondary}>
            {copy.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  )
}
