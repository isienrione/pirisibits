import { REBUILD_FINAL } from '../rebuildCopy.js'

/**
 * Dark compact final CTA.
 * @param {{ onPrimary?: () => void, onSecondary?: () => void }} props
 */
export default function RebuildFinalCta({ onPrimary, onSecondary }) {
  const copy = REBUILD_FINAL

  return (
    <section
      id={copy.id}
      className="cw-rb-final cw-rb-surface--dark"
      aria-labelledby="final-cta-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <h2 id="final-cta-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        <p className="cw-rb-lead">{copy.support}</p>

        <div className="cw-rb-actions">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary"
            onClick={onPrimary}
          >
            {copy.primaryCta}
          </button>
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--secondary"
            onClick={onSecondary}
          >
            {copy.secondaryCta}
          </button>
        </div>

        <p className="cw-rb-final__reassurance">{copy.reassurance}</p>
      </div>
    </section>
  )
}
