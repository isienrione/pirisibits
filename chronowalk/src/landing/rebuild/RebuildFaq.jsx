import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { REBUILD_FAQ } from '../rebuildCopy.js'
import { trackLandingFaqOpen } from '../landingAnalytics.js'

/**
 * Compact 8-question FAQ + legal links.
 */
export default function RebuildFaq() {
  const copy = REBUILD_FAQ
  const baseId = useId()
  const [openId, setOpenId] = useState(null)

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-faq cw-rb-surface--light"
      aria-labelledby="faq-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <h2 id="faq-heading" className="cw-rb-title">
          {copy.headline}
        </h2>

        <div className="cw-rb-faq__list">
          {copy.items.map((item, index) => {
            const panelId = `${baseId}-a-${index}`
            const buttonId = `${baseId}-q-${index}`
            const open = openId === index
            return (
              <div key={item.q} className="cw-rb-faq__item">
                <button
                  id={buttonId}
                  type="button"
                  className="cw-rb-faq__question"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => {
                    const next = open ? null : index
                    setOpenId(next)
                    if (next != null) trackLandingFaqOpen({ questionId: `q${index}` })
                  }}
                >
                  <span>{item.q}</span>
                  <span className="cw-rb-faq__icon" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open}>
                  <p className="cw-rb-faq__answer">{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>

        <nav className="cw-rb-faq__legal" aria-label="Policies and support">
          {copy.legalLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
