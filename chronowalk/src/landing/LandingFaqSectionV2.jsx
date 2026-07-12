import { useCallback, useRef, useState } from 'react'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingFaqSectionV2() {
  const { id, headline, items } = LANDING_CONTENT.faq
  const [openIndex, setOpenIndex] = useState(0)
  const buttonRefs = useRef([])

  const toggle = useCallback((index) => {
    setOpenIndex((current) => (current === index ? -1 : index))
  }, [])

  const focusButton = (index) => {
    buttonRefs.current[index]?.focus()
  }

  const handleKeyDown = (event, index) => {
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
    <section id={id} className="cw-v2-section cw-v2-faq" aria-labelledby={`${id}-heading`}>
      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <h2 id={`${id}-heading`} className="cw-v2-section__title">
            {headline}
          </h2>
        </header>

        <div className="cw-v2-faq__list">
          {items.map((item, index) => {
            const open = openIndex === index
            const panelId = `faq-v2-panel-${index}`
            const buttonId = `faq-v2-button-${index}`

            return (
              <article key={item.q} className="cw-v2-faq__item">
                <h3 className="cw-v2-faq__question-wrap">
                  <button
                    type="button"
                    id={buttonId}
                    ref={(el) => {
                      buttonRefs.current[index] = el
                    }}
                    className="cw-v2-faq__question"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  >
                    <span>{item.q}</span>
                    <span className="cw-v2-faq__icon" aria-hidden>
                      {open ? '−' : '+'}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`cw-v2-faq__answer${open ? ' cw-v2-faq__answer--open' : ''}`}
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
