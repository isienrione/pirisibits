import { useRef, useState } from 'react'
import { REBUILD_FAQ } from '../rebuildCopy.js'
import { trackLandingFaqOpen } from '../landingAnalytics.js'

function faqIdFromQuestion(question, index) {
  const slug = String(question || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return slug || `faq-${index}`
}

/**
 * Accordion FAQ with aria-expanded buttons.
 */
export default function RebuildFaq() {
  const copy = REBUILD_FAQ
  const [openIndex, setOpenIndex] = useState(-1)
  const buttonRefs = useRef([])

  const items = copy.items.map((item, index) => ({
    ...item,
    id: faqIdFromQuestion(item.q, index),
  }))

  function toggle(index) {
    setOpenIndex((current) => {
      const next = current === index ? -1 : index
      if (next >= 0) {
        trackLandingFaqOpen({ questionId: items[next].id })
      }
      return next
    })
  }

  function focusButton(index) {
    buttonRefs.current[index]?.focus()
  }

  function handleKeyDown(event, index) {
    const last = items.length - 1

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusButton(index < last ? index + 1 : 0)
        break
      case 'ArrowUp':
        event.preventDefault()
        focusButton(index > 0 ? index - 1 : last)
        break
      case 'Home':
        event.preventDefault()
        focusButton(0)
        break
      case 'End':
        event.preventDefault()
        focusButton(last)
        break
      default:
        break
    }
  }

  return (
    <section
      id="faq"
      className="cw-rb-section cw-rb-faq cw-rb-surface--light"
      aria-labelledby="faq-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <header>
          <h2 id="faq-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
        </header>

        <div className="cw-rb-faq__list">
          {items.map((item, index) => {
            const open = openIndex === index
            const panelId = `rb-faq-panel-${item.id}`
            const buttonId = `rb-faq-button-${item.id}`

            return (
              <article key={item.id} className="cw-rb-faq__item">
                <h3 className="cw-rb-faq__question-wrap">
                  <button
                    type="button"
                    id={buttonId}
                    ref={(el) => {
                      buttonRefs.current[index] = el
                    }}
                    className="cw-rb-faq__question"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  >
                    <span>{item.q}</span>
                    <span className="cw-rb-faq__icon" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="cw-rb-faq__answer"
                  hidden={!open}
                >
                  <p>{item.a}</p>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
