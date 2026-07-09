import { useState } from 'react'
import LandingSection from './LandingSection.jsx'
import { LANDING_CONTENT } from './landingData.js'

export default function LandingFaqSection() {
  const { id, items } = LANDING_CONTENT.faq
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <LandingSection id={id} title="Questions" variant="dark">
      <div className="cw-landing-faq">
        {items.map((item, index) => {
          const open = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`

          return (
            <div key={item.q} className="cw-landing-faq__item">
              <button
                type="button"
                id={buttonId}
                className="cw-landing-faq__question"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                {item.q}
              </button>
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
