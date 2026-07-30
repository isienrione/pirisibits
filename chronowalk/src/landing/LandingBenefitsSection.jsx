import { LANDING_CONTENT } from './landingData.js'

/**
 * Act II - benefits once (“What stays with you”).
 * Editorial list (not cards); product advantages appear only here.
 */
export default function LandingBenefitsSection() {
  const section = LANDING_CONTENT.benefits

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-benefits"
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>

        <ul className="cw-v2-benefits__list" aria-label="What stays with you">
          {section.items.map((item, index) => (
            <li key={item.title} className="cw-v2-benefits__item">
              {index > 0 ? <span className="cw-v2-benefits__seam" aria-hidden="true" /> : null}
              <h3 className="cw-v2-benefits__title">{item.title}</h3>
              <p className="cw-v2-benefits__body">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
