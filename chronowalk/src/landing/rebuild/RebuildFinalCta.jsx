import { LANDING_COLOSSEUM_NOW } from '../landingVisualAssets.js'
import { REBUILD_FINAL } from '../rebuildCopy.js'

/**
 * Emotional final CTA with editorial photograph.
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
      <figure className="cw-rb-final__media">
        <img
          src={LANDING_COLOSSEUM_NOW}
          alt=""
          width={1400}
          height={900}
          loading="lazy"
          decoding="async"
        />
      </figure>
      <div className="cw-rb-wrap cw-rb-wrap--narrow cw-rb-final__copy">
        <h2 id="final-cta-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        <p className="cw-rb-lead">{copy.support}</p>
        <div className="cw-rb-final__actions">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
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
