import { LANDING_EDITORIAL } from '../landingVisualAssets.js'
import { REBUILD_WALK_TOGETHER } from '../rebuildCopy.js'

/**
 * Couple & Family — premium dark section after pricing.
 * @param {{ onBeginTier?: (tierId: string, section?: string) => void }} props
 */
export default function RebuildWalkTogether({ onBeginTier }) {
  const copy = REBUILD_WALK_TOGETHER
  const plans = [
    { ...copy.couple, name: 'Couple' },
    { ...copy.family, name: 'Family' },
  ]

  return (
    <section
      id="walk-together"
      className="cw-rb-section cw-rb-together cw-rb-surface--dark"
      aria-labelledby="walk-together-heading"
      data-rb-compete-cta="true"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <figure className="cw-rb-photo cw-rb-photo--travellers cw-rb-together__media">
          <img
            src={LANDING_EDITORIAL.travellers}
            alt=""
            width={1080}
            height={1620}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <p className="cw-rb-eyebrow">{copy.eyebrow}</p>
        <h2 id="walk-together-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        {copy.body ? <p className="cw-rb-lead">{copy.body}</p> : null}

        <div className="cw-rb-together__grid">
          {plans.map((plan) => (
            <article key={plan.id} className="cw-rb-together__card">
              <p className="cw-rb-together__name">{plan.name}</p>
              <p className="cw-rb-together__price">{plan.price}</p>
              <p className="cw-rb-together__detail">{plan.detail}</p>
              {copy.changes?.length ? (
                <ul className="cw-rb-check-list cw-rb-check-list--on-dark">
                  {copy.changes.map((item) => (
                    <li key={`${plan.id}-${item}`}>{item}</li>
                  ))}
                </ul>
              ) : null}
              <button
                type="button"
                className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
                onClick={() => onBeginTier?.(plan.id, 'walk-together')}
              >
                {plan.label}
              </button>
            </article>
          ))}
        </div>

        {copy.syncNote ? <p className="cw-rb-together__sync">{copy.syncNote}</p> : null}
      </div>
    </section>
  )
}
