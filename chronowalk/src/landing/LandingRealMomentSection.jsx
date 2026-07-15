import { LANDING_CONTENT } from './landingData.js'

/**
 * Act II — real-moment scenarios (replaces generic persona cards).
 * Editorial beats mapped to playbook target journeys — no audience labels, no cards.
 */
export default function LandingRealMomentSection() {
  const section = LANDING_CONTENT['real-moment']

  return (
    <section
      id={section.id}
      className="cw-v2-section cw-v2-real-moment"
      aria-labelledby={`${section.id}-heading`}
    >
      {/* Legacy deep link from former persona section */}
      <div id="who-its-for" className="cw-landing-deeplink-anchor" tabIndex={-1} aria-hidden="true" />

      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title">
            {section.headline}
          </h2>
        </header>

        <ul className="cw-v2-real-moment__list" aria-label="Real moments in Rome">
          {section.scenarios.map((scenario, index) => (
            <li key={scenario.prompt} className="cw-v2-real-moment__item">
              {index > 0 ? (
                <span className="cw-v2-real-moment__seam" aria-hidden="true" />
              ) : null}
              <p className="cw-v2-real-moment__prompt">{scenario.prompt}</p>
              <div className="cw-v2-real-moment__lines">
                {scenario.lines.map((line, lineIndex) => (
                  <p
                    key={line}
                    className={
                      lineIndex === 0
                        ? 'cw-v2-real-moment__line cw-v2-real-moment__line--lead'
                        : 'cw-v2-real-moment__line'
                    }
                  >
                    {line}
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
