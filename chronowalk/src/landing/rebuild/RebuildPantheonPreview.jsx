import { LANDING_EDITORIAL } from '../landingVisualAssets.js'
import { REBUILD_PANTHEON } from '../rebuildCopy.js'

/**
 * Free Pantheon stop — CTA-dominant, copy-light.
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
          <figure className="cw-rb-photo cw-rb-photo--monument cw-rb-pantheon__media">
            <img
              src={LANDING_EDITORIAL.pantheon}
              alt="The Pantheon in Rome"
              width={960}
              height={720}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <div className="cw-rb-pantheon__body">
            <div className="cw-rb-pantheon__badges">
              <p className="cw-rb-pantheon__free">{copy.label}</p>
              <p className="cw-rb-pantheon__complete">{copy.badge}</p>
            </div>
            <h2 id="pantheon-preview-heading" className="cw-rb-pantheon__title">
              {copy.headline}
            </h2>
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--soft cw-rb-btn--block cw-rb-pantheon__cta"
              onClick={onPreview}
            >
              {copy.cta}
            </button>
            {copy.reassurance ? <p className="cw-rb-pantheon__note">{copy.reassurance}</p> : null}
          </div>
        </article>
      </div>
    </section>
  )
}
