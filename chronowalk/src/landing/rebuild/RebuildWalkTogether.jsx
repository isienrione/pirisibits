import { REBUILD_WALK_TOGETHER } from '../rebuildCopy.js'

/**
 * Couple / Family pass CTAs.
 * @param {{ onBeginTier?: (tierId: string) => void }} props
 */
export default function RebuildWalkTogether({ onBeginTier }) {
  const copy = REBUILD_WALK_TOGETHER

  return (
    <section
      id="walk-together"
      className="cw-rb-section cw-rb-together cw-rb-surface--dark"
      aria-labelledby="walk-together-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <p className="cw-rb-eyebrow">{copy.eyebrow}</p>
          <h2 id="walk-together-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.body}</p>
        </header>

        <ol className="cw-rb-together__steps">
          {copy.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="cw-rb-together__offers">
          <div className="cw-rb-together__offer">
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--primary"
              onClick={() => onBeginTier?.(copy.couple.id)}
            >
              {copy.couple.label}
            </button>
            <p className="cw-rb-together__detail">{copy.couple.detail}</p>
          </div>

          <div className="cw-rb-together__offer">
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--secondary"
              onClick={() => onBeginTier?.(copy.family.id)}
            >
              {copy.family.label}
            </button>
            <p className="cw-rb-together__detail">{copy.family.detail}</p>
          </div>
        </div>

        <ul className="cw-rb-together__changes">
          {copy.changes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="cw-rb-together__sync">{copy.syncNote}</p>
      </div>
    </section>
  )
}
