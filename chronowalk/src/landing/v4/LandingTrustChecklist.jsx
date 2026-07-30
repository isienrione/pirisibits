import { useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'

/**
 * Compact expandable trust checklist - replaces the long feature list.
 * When `embedded`, renders without its own section title (FAQ continuation).
 */
export default function LandingTrustChecklist({ embedded = false }) {
  const section = LANDING_CONTENT.trust
  const rows = section.checklist ?? []
  const [openId, setOpenId] = useState(null)

  const list = (
    <>
      <ul className="cw-v4-trust__list">
        {rows.map((row) => {
          const open = openId === row.id
          return (
            <li key={row.id} className={`cw-v4-trust__row${open ? ' is-open' : ''}`}>
              <button
                type="button"
                className="cw-v4-trust__toggle"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : row.id)}
              >
                <span className="cw-v4-trust__check" aria-hidden />
                <span className="cw-v4-trust__label">{row.title}</span>
                <span className="cw-v4-trust__chevron" aria-hidden />
              </button>
              <div className="cw-v4-trust__panel" hidden={!open}>
                <p>{row.body}</p>
              </div>
            </li>
          )
        })}
      </ul>

      {section.imageryHref ? (
        <p className="cw-v4-trust__credits">
          <a href={section.imageryHref}>{section.imageryCta ?? 'Imagery credits'}</a>
        </p>
      ) : null}
    </>
  )

  if (embedded) {
    return (
      <div id={section.id} className="cw-v4-trust cw-v4-trust--embedded">
        {list}
      </div>
    )
  }

  return (
    <section
      id={section.id}
      className="cw-v4-trust"
      aria-labelledby="cw-v4-trust-heading"
    >
      <div className="cw-v4-wrap cw-v4-wrap--narrow">
        <header className="cw-v4-section-head">
          {section.eyebrow ? <p className="cw-v4-eyebrow">{section.eyebrow}</p> : null}
          <h2 id="cw-v4-trust-heading" className="cw-v4-section-title">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v4-section-lead">{section.subheadline}</p>
          ) : null}
        </header>
        {list}
      </div>
    </section>
  )
}
