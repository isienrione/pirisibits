import { LANDING_CONTENT, LANDING_VERIFIED_REVIEWS } from './landingData.js'

const TRUST_ICONS = {
  label: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  viewpoint: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  script: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4.5h8.5A2.5 2.5 0 0 1 18 7v11.5A1.5 1.5 0 0 1 16.5 20H8A2 2 0 0 1 6 18V6.5A2 2 0 0 1 8 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M9.5 9h6M9.5 12.5h6M9.5 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  preview: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12s3.5-5.5 8-5.5S20 12 20 12s-3.5 5.5-8 5.5S4 12 4 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9.5V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  ),
}

/**
 * Act III — How we build trust with quiet verification icons.
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
              <div className="cw-v2-trust__item-head">
                <span className="cw-v2-trust__icon" aria-hidden="true">
                  {TRUST_ICONS[item.icon] ?? TRUST_ICONS.label}
                </span>
                <h3 className="cw-v2-trust__item-title">{item.title}</h3>
              </div>
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
