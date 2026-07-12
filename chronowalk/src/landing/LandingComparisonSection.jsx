import { LANDING_CONTENT } from './landingData.js'

function CompareCell({ value, featured }) {
  if (value === false) {
    return (
      <span className="cw-v2-compare__muted">
        <span className="cw-v2-compare__x" aria-hidden>
          ×
        </span>
        Not offered
      </span>
    )
  }

  return (
    <span className={featured ? 'cw-v2-compare__text' : 'cw-v2-compare__text cw-v2-compare__text--alt'}>
      {value}
    </span>
  )
}

export default function LandingComparisonSection() {
  const { id, eyebrow, headline, columns, rows } = LANDING_CONTENT.comparison

  return (
    <section
      id={id}
      className="cw-v2-section cw-v2-section--raised cw-v2-compare"
      aria-labelledby={`${id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{eyebrow}</p>
          <h2 id={`${id}-heading`} className="cw-v2-section__title">
            {headline}
          </h2>
        </header>

        <div className="cw-v2-compare__table" role="table" aria-label={headline}>
          <div className="cw-v2-compare__head" role="row">
            <div className="cw-v2-compare__corner" aria-hidden />
            {columns.map((col) => (
              <div
                key={col.id}
                className={`cw-v2-compare__col-head${col.featured ? ' cw-v2-compare__col-head--featured' : ''}`}
                role="columnheader"
              >
                <div className="cw-v2-compare__col-brand">
                  {col.featured ? <span className="cw-v2-header__mark" aria-hidden /> : null}
                  <span className="cw-v2-compare__col-label">{col.label}</span>
                </div>
                <p className="cw-v2-compare__col-tag">{col.tag}</p>
              </div>
            ))}
          </div>

          {rows.map((row) => (
            <div key={row.feature} className="cw-v2-compare__row" role="row">
              <div className="cw-v2-compare__feature" role="rowheader">
                {row.feature}
              </div>
              {columns.map((col) => (
                <div
                  key={col.id}
                  className={`cw-v2-compare__cell${col.featured ? ' cw-v2-compare__cell--featured' : ''}`}
                  role="cell"
                >
                  <p className="cw-v2-compare__cell-label">{col.label}</p>
                  <div className="cw-v2-compare__cell-body">
                    {col.featured ? (
                      <span className="cw-v2-compare__check" aria-hidden>
                        ✓
                      </span>
                    ) : null}
                    <CompareCell value={row[col.id]} featured={col.featured} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
