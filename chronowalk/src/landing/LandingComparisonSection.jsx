import { LANDING_CONTENT } from './landingData.js'

export default function LandingComparisonSection() {
  const { id, headline, problemColumn, solutionColumn, rows } = LANDING_CONTENT.comparison

  return (
    <section
      id={id}
      className="cw-doc-section cw-doc-section--bone cw-landing-compare"
      aria-labelledby={`${id}-heading`}
    >
      <div className="cw-landing-wrap cw-doc-section__inner">
        <h2 id={`${id}-heading`} className="cw-landing-compare__headline">
          {headline}
        </h2>

        <div className="cw-landing-compare__table" role="table" aria-label={headline}>
          <div className="cw-landing-compare__header" role="row">
            <div className="cw-landing-compare__header-cell cw-landing-compare__header-cell--problem" role="columnheader">
              {problemColumn}
            </div>
            <div className="cw-landing-compare__header-cell cw-landing-compare__header-cell--solution" role="columnheader">
              {solutionColumn}
            </div>
          </div>

          <div className="cw-landing-compare__body">
            {rows.map((row) => (
              <article key={row.problem} className="cw-landing-compare__row" role="row">
                <div className="cw-landing-compare__cell cw-landing-compare__cell--problem" role="cell">
                  <span className="cw-landing-compare__mobile-label">{problemColumn}</span>
                  <p>{row.problem}</p>
                </div>
                <div className="cw-landing-compare__cell cw-landing-compare__cell--solution" role="cell">
                  <span className="cw-landing-compare__mobile-label">{solutionColumn}</span>
                  <p>{row.solution}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
