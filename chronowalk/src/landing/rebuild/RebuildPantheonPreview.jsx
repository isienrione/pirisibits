import { LANDING_PANTHEON_NOW } from '../landingVisualAssets.js'
import { REBUILD_PANTHEON } from '../rebuildCopy.js'

/**
 * Compact free Pantheon stop card.
 * @param {{ onPreview?: () => void }} props
 */
export default function RebuildPantheonPreview({ onPreview }) {
  const copy = REBUILD_PANTHEON

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-pantheon cw-rb-surface--light"
      aria-labelledby="pantheon-preview-heading"
      data-rb-compete-cta="true"
    >
      <div id="try-free" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="cw-rb-wrap">
        <article className="cw-rb-pantheon__card">
          <figure className="cw-rb-pantheon__media">
            <img
              src={LANDING_PANTHEON_NOW}
              alt="The Pantheon in Rome"
              width={960}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="cw-rb-pantheon__body">
            <p className="cw-rb-eyebrow">{copy.label}</p>
            <h2 id="pantheon-preview-heading" className="cw-rb-pantheon__title">
              {copy.headline}
            </h2>
            <p className="cw-rb-pantheon__text">{copy.body}</p>
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
              onClick={onPreview}
            >
              {copy.cta}
            </button>
            <p className="cw-rb-pantheon__note">{copy.reassurance}</p>
          </div>
        </article>
      </div>
    </section>
  )
}
