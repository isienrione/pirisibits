import { useEffect, useRef, useState } from 'react'
import { getLandingFaqItems, LANDING_CONTENT } from './landingData.js'
import { trackLandingFaqOpen } from './landingAnalytics.js'
import LandingTrustChecklist from './v4/LandingTrustChecklist.jsx'

function faqDeepLinkId(itemId) {
  return `faq-${itemId}`
}

function indexFromHash(items) {
  if (typeof window === 'undefined') return 0
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash || hash === 'faq') return 0
  const match = items.findIndex((item) => faqDeepLinkId(item.id) === hash || item.id === hash)
  return match >= 0 ? match : 0
}

/**
 * Act III · FAQ grouped by buying anxiety (Prompt 15).
 * Accordion keyboard support + FAQPage JSON-LD + `#faq-<id>` deep links.
 */
export default function LandingFaqSectionV2() {
  const { id, headline, groups } = LANDING_CONTENT.faq
  const items = getLandingFaqItems()
  const [openIndex, setOpenIndex] = useState(() => indexFromHash(getLandingFaqItems()))
  const buttonRefs = useRef([])

  useEffect(() => {
    const syncFromHash = () => {
      setOpenIndex(indexFromHash(getLandingFaqItems()))
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  function toggle(index) {
    setOpenIndex((current) => {
      const next = current === index ? -1 : index
      if (next >= 0) {
        const item = items[next]
        const group = groups.find((entry) => entry.items.some((entryItem) => entryItem.id === item.id))
        trackLandingFaqOpen({ questionId: item.id, groupId: group?.id })
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  const indexById = Object.fromEntries(items.map((item, index) => [item.id, index]))

  return (
    <section id={id} className="cw-v2-section cw-v2-faq" aria-labelledby={`${id}-heading`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="cw-v2-wrap cw-v2-wrap--narrow">
        <header className="cw-v2-section__header">
          <h2 id={`${id}-heading`} className="cw-v2-section__title">
            {headline}
          </h2>
        </header>

        <div className="cw-v2-faq__groups">
          {groups.map((group) => (
            <section
              key={group.id}
              className="cw-v2-faq__group"
              aria-labelledby={`faq-group-${group.id}`}
            >
              <h3 id={`faq-group-${group.id}`} className="cw-v2-faq__group-label">
                {group.label}
              </h3>

              <div className="cw-v2-faq__list">
                {group.items.map((item) => {
                  const index = indexById[item.id]
                  const open = openIndex === index
                  const panelId = `faq-v2-panel-${item.id}`
                  const buttonId = `faq-v2-button-${item.id}`
                  const anchorId = faqDeepLinkId(item.id)

                  return (
                    <article key={item.id} id={anchorId} className="cw-v2-faq__item">
                      <h4 className="cw-v2-faq__question-wrap">
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
                      </h4>
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
            </section>
          ))}
        </div>

        <LandingTrustChecklist embedded />
      </div>
    </section>
  )
}
