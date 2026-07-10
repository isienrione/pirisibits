import { LANDING_CONTENT } from './landingData.js'

export default function LandingRomeTiersSection({ onBeginTier }) {
  const section = LANDING_CONTENT['rome-tiers']
  const tiers = section.tiers ?? []

  return (
    <section
      id={section.id}
      className="cw-doc-section cw-doc-section--obsidian cw-landing-pricing"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-landing-wrap cw-doc-section__inner cw-landing-pricing__inner">
        <header className="cw-landing-pricing__header">
          <h2 id={`${section.id}-heading`} className="cw-landing-pricing__headline">
            {section.headline}
          </h2>
          <p className="cw-landing-pricing__subtitle">{section.subheadline}</p>
        </header>

        <div className="cw-landing-pricing__grid">
          {tiers.map((tier) => {
            const isFeatured = tier.id === 'rome-complete'

            return (
              <article
                key={tier.id}
                className={`cw-landing-pricing-card${isFeatured ? ' cw-landing-pricing-card--featured' : ''}`}
                aria-labelledby={`${tier.id}-title`}
              >
                {tier.badge ? (
                  <span
                    className={`cw-landing-pricing-card__badge${isFeatured ? ' cw-landing-pricing-card__badge--ribbon' : ''}`}
                  >
                    {tier.badge}
                  </span>
                ) : null}

                <div className="cw-landing-pricing-card__body">
                  <header className="cw-landing-pricing-card__header">
                    <h3 id={`${tier.id}-title`} className="cw-landing-pricing-card__title">
                      {tier.title}
                    </h3>
                    <p className="cw-landing-pricing-card__price">{tier.price}</p>
                  </header>

                  <p className="cw-landing-pricing-card__description">{tier.description}</p>

                  {tier.landmarkLine ? (
                    <p className="cw-landing-pricing-card__landmarks">{tier.landmarkLine}</p>
                  ) : tier.landmarks?.length ? (
                    <p className="cw-landing-pricing-card__landmarks">
                      {tier.landmarks.join(' · ')}
                    </p>
                  ) : null}

                  <ul className="cw-landing-pricing-card__bullets">
                    {tier.featuredBullet ? (
                      <li className="cw-landing-pricing-card__bullet cw-landing-pricing-card__bullet--featured">
                        {tier.featuredBullet}
                      </li>
                    ) : null}
                    {tier.bullets.map((item) => (
                      <li key={item} className="cw-landing-pricing-card__bullet">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={
                      isFeatured
                        ? 'cw-landing-btn cw-landing-btn--coral cw-landing-btn--glow cw-landing-pricing-card__cta'
                        : 'cw-landing-btn cw-landing-btn--ghost cw-landing-pricing-card__cta cw-landing-pricing-card__cta--essential'
                    }
                    onClick={() => onBeginTier(tier.id)}
                  >
                    {tier.primaryCta}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
