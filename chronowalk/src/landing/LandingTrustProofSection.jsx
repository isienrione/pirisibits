import { LANDING_CONTENT, LANDING_VERIFIED_REVIEWS } from './landingData.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

/**
 * Act III — How we build trust (Phase 13).
 * Product evidence only: no invented testimonials, ratings, counts, or press.
 * Verified reviews render solely from LANDING_VERIFIED_REVIEWS when approved.
 */
export default function LandingTrustProofSection() {
  const section = LANDING_CONTENT.trust
  const reviews = LANDING_VERIFIED_REVIEWS
  const hasReviews = Array.isArray(reviews) && reviews.length > 0

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-trust"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <div className="cw-v2-trust__layout">
          <div className="cw-v2-trust__copy">
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

            <div
              className="cw-v2-trust__reviews"
              data-landing-verified-reviews={hasReviews ? 'ready' : 'pending'}
            >
              {hasReviews ? (
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
              ) : (
                <p className="cw-v2-trust__reviews-pending">{section.verifiedReviewsEmptyNote}</p>
              )}
            </div>
          </div>

          <figure
            className="cw-v2-trust__visual"
            aria-label="ChronoWalk phone showing a stop on the Rome route"
          >
            <LandingLivePhoneMockup variant="threshold" />
            <figcaption className="cw-v2-trust__caption">Threshold · product screen</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
