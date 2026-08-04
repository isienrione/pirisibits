import { useId, useState } from 'react'

/**
 * Short acquisition FAQ: one open panel at a time, keyboard-friendly.
 * @param {{ items: Array<{ q: string, a: string }>, heading?: string }} props
 */
export default function AcquisitionFaq({ items, heading = 'Questions' }) {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState(0)
  if (!items?.length) return null

  return (
    <section className="cw-acq-section cw-acq-faq" aria-labelledby={`${baseId}-heading`}>
      <div className="cw-v4-wrap cw-v4-wrap--narrow">
        <h2 id={`${baseId}-heading`} className="cw-v4-section-title">
          {heading}
        </h2>
        <div className="cw-acq-faq__list">
          {items.map((item, index) => {
            const panelId = `${baseId}-panel-${index}`
            const buttonId = `${baseId}-btn-${index}`
            const open = openIndex === index
            return (
              <div key={item.q} className={`cw-acq-faq__item${open ? ' is-open' : ''}`}>
                <h3 className="cw-acq-faq__q">
                  <button
                    id={buttonId}
                    type="button"
                    className="cw-acq-faq__button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(open ? -1 : index)}
                  >
                    {item.q}
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!open}
                  className="cw-acq-faq__a"
                >
                  <p>{item.a}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
