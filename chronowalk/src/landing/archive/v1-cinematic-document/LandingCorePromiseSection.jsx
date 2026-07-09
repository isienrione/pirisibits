import { LANDING_CONTENT, ROME_JOURNEY_SECTION_ID } from './landingData.js'

function formatCardIndex(index) {
  return String(index + 1).padStart(2, '0')
}

export default function LandingPromiseSection() {
  const { id, headline, cards, scrollCta } = LANDING_CONTENT.promise

  const handleScrollToProduct = () => {
    document.getElementById(ROME_JOURNEY_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <section id={id} className="cw-doc-section cw-doc-section--obsidian cw-doc-promise" aria-labelledby={`${id}-heading`}>
      <div className="cw-landing-wrap cw-doc-section__inner cw-doc-section__inner--theater">
        <h2 id={`${id}-heading`} className="cw-doc-promise__headline">
          {headline}
        </h2>

        <ul className="cw-doc-promise-grid">
          {cards.map((card, index) => (
            <li key={card.title} className="cw-doc-promise-card">
              <span className="cw-doc-promise-card__num" aria-hidden>
                {formatCardIndex(index)}
              </span>
              <h3 className="cw-doc-promise-card__title">{card.title}</h3>
              <p className="cw-doc-promise-card__body">{card.copy}</p>
            </li>
          ))}
        </ul>

        <div className="cw-doc-promise__cta">
          <button type="button" className="cw-doc-promise__link" onClick={handleScrollToProduct}>
            {scrollCta}
          </button>
        </div>
      </div>
    </section>
  )
}
