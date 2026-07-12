import { LANDING_CONTENT } from './landingData.js'

export default function LandingBenefitsSection() {
  const section = LANDING_CONTENT.benefits

  return (
    <section id={section.id} className="cw-v2-section cw-v2-benefits" aria-labelledby={`${section.id}-heading`}>
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>

        <div className="cw-v2-benefits__grid">
          {section.items.map((item) => (
            <article key={item.title} className="cw-v2-benefits__card">
              <h3 className="cw-v2-benefits__title">{item.title}</h3>
              <p className="cw-v2-benefits__body">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
