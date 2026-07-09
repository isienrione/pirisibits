import { useCallback, useRef, useState } from 'react'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingFaqSection() {
  const { id, headline, items } = LANDING_CONTENT.faq
  const [openIndex, setOpenIndex] = useState(0)
  const buttonRefs = useRef([])

  const toggle = useCallback((index) => {
    setOpenIndex((current) => (current === index ? -1 : index))
  }, [])

  const focusButton = (index) => {
    const el = buttonRefs.current[index]
    el?.focus()
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
    <LandingSection id={id} title={headline} variant="bone" className="cw-landing-faq-section">
      <div className="cw-landing-faq" role="list">
        {items.map((item, index) => {
          const open = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div key={item.q} className="cw-landing-faq__item" role="listitem">
              <h3 className="cw-landing-faq__heading">
                <button
                  type="button"
                  id={buttonId}
                  ref={(el) => {
                    buttonRefs.current[index] = el
                  }}
                  className="cw-landing-faq__question"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                >
                  <span>{item.q}</span>
                  <span className="cw-landing-faq__icon" aria-hidden>
                    {open ? '−' : '+'}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`cw-landing-faq__answer${open ? ' cw-landing-faq__answer--open' : ''}`}
                hidden={!open}
              >
                <p>{item.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </LandingSection>
  )
}
