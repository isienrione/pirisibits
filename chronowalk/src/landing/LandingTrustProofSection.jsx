import { LANDING_CONTENT, LANDING_VERIFIED_REVIEWS } from './landingData.js'

/**
 * Act III — How we build trust (Phase 13 / polish Phase 22).
 * Product evidence only: no invented testimonials, ratings, counts, or press.
 * Phone mockup removed so Act III stays evidence-led after Threshold already demoed.
 * Verified reviews render solely from LANDING_VERIFIED_REVIEWS when approved.
 */
export default function LandingTrustProofSection() {
  const section = LANDING_CONTENT.trust
  const reviews = LANDING_VERIFIED_REVIEWS
  const hasReviews = Array.isArray(reviews) && reviews.length > 0

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-trust cw-v2-trust--evidence"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-trust__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title cw-v2-trust__title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v2-section__lead cw-v2-trust__lead">{section.subheadline}</p>
          ) : null}
        </header>

        <ul className="cw-v2-trust__list" aria-label="How ChronoWalk builds trust">
          {section.items.map((item, index) => (
            <li key={item.title} className="cw-v2-trust__item">
              {index > 0 ? <span className="cw-v2-trust__seam" aria-hidden="true" /> : null}
              <h3 className="cw-v2-trust__item-title">{item.title}</h3>
              <p className="cw-v2-trust__item-body">{item.body}</p>
            </li>
          ))}
        </ul>

        {section.imageryHref ? (
          <p className="cw-v2-trust__imagery">
            <span>{section.imageryNote} </span>
            <a href={section.imageryHref} className="cw-v2-trust__imagery-link">
              {section.imageryCta}
            </a>
          </p>
        ) : null}

        {hasReviews ? (
          <div className="cw-v2-trust__reviews" data-landing-verified-reviews="ready">
            <ul className="cw-v2-trust__quotes" aria-label="Verified traveler quotes">
              {reviews.map((review) => (
                <li key={review.id} className="cw-v2-trust__quote">
                  <blockquote>
                    <p>{review.quote}</p>
                    <footer>
                      <cite>{review.attribution}</cite>
                      {review.context ? (
                        <span className="cw-v2-trust__quote-context">{review.context}</span>
                      ) : null}
                    </footer>
                  </blockquote>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}
