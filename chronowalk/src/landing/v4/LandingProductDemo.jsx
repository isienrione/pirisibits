import { useEffect, useRef, useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { observeLandingSectionOnce, trackLandingRouteView } from '../landingAnalytics.js'
import LandingProductPhoneHost from './LandingProductPhoneHost.jsx'

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])
  return reduced
}

/**
 * Sticky-phone product film powered by real application screens.
 * Phone stays fixed across all chapters; scroll drives chapter + phase.
 */
export default function LandingProductDemo() {
  const section = LANDING_CONTENT['product-demo']
  const chapters = section.chapters ?? []
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const chapterRefs = useRef([])
  const [active, setActive] = useState(0)
  const [subPhase, setSubPhase] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const nodes = chapterRefs.current.filter(Boolean)
    if (!nodes.length) return undefined

    const pickActive = () => {
      const viewport = window.innerHeight || 1
      const focusY = viewport * 0.62
      let bestIndex = 0
      let bestDist = Number.POSITIVE_INFINITY

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect()
        const mid = rect.top + rect.height * 0.35
        const dist = Math.abs(mid - focusY)
        const visible = rect.bottom > viewport * 0.18 && rect.top < viewport * 0.92
        if (!visible) return
        if (dist < bestDist) {
          bestDist = dist
          bestIndex = index
        }
      })

      setActive(bestIndex)
    }

    pickActive()
    window.addEventListener('scroll', pickActive, { passive: true })
    window.addEventListener('resize', pickActive)
    return () => {
      window.removeEventListener('scroll', pickActive)
      window.removeEventListener('resize', pickActive)
    }
  }, [chapters.length])

  useEffect(() => {
    const node = chapterRefs.current[active]
    if (!node) return undefined

    const onScroll = () => {
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const raw = (viewport * 0.55 - rect.top) / (rect.height || 1)
      const progress = Math.min(1, Math.max(0, raw))
      const chapter = chapters[active]
      const beatCount = Math.max(1, chapter?.beats?.length ?? 1)
      if (reducedMotion) {
        setSubPhase(beatCount - 1)
        return
      }
      setSubPhase(Math.min(beatCount - 1, Math.floor(progress * beatCount)))
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [active, chapters, reducedMotion])

  const chapter = chapters[active] ?? chapters[0]

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="cw-v4-demo"
      aria-labelledby="cw-v4-demo-heading"
    >
      <div className="cw-v4-demo__intro">
        <p className="cw-v4-eyebrow">{section.eyebrow}</p>
        <h2 id="cw-v4-demo-heading" className="cw-v4-demo__title">
          {section.headline}
        </h2>
        {section.subheadline ? <p className="cw-v4-demo__lead">{section.subheadline}</p> : null}
      </div>

      <div ref={stageRef} className="cw-v4-demo__stage">
        <div className="cw-v4-demo__phone-sticky">
          <div className={`cw-v4-demo__phone cw-v4-demo__phone--${chapter?.id ?? 'choose'}`}>
            <LandingProductPhoneHost chapterId={chapter?.id ?? 'choose'} phase={subPhase} />
          </div>
          <p className="cw-v4-demo__phone-caption" aria-live="polite">
            {String(active + 1).padStart(2, '0')} · {chapter?.beats?.[subPhase] ?? chapter?.title}
          </p>
        </div>

        <div className="cw-v4-demo__chapters">
          {chapters.map((item, index) => (
            <article
              key={item.id}
              ref={(el) => {
                chapterRefs.current[index] = el
              }}
              data-chapter-index={index}
              className={`cw-v4-demo__chapter${item.emotional ? ' cw-v4-demo__chapter--peak' : ''}${
                index === active ? ' is-active' : ''
              }`}
              aria-current={index === active ? 'true' : undefined}
            >
              <p className="cw-v4-demo__chapter-index">
                {String(index + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
              </p>
              <h3 className="cw-v4-demo__chapter-title">{item.title}</h3>
              <p className="cw-v4-demo__chapter-body">{item.body}</p>
              {item.beats?.length ? (
                <ul className="cw-v4-demo__beats">
                  {item.beats.map((beat, beatIndex) => (
                    <li
                      key={beat}
                      className={
                        index === active && beatIndex <= subPhase ? 'is-on' : undefined
                      }
                    >
                      {beat}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
