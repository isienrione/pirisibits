import { useEffect, useMemo, useRef, useState } from 'react'
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

function chapterWeight(chapter) {
  return chapter?.emotional ? 1.75 : 1
}

/**
 * Apple-style pin scrub:
 * - One tall scroll track
 * - Sticky viewport with phone + one copy panel
 * - Scroll progress maps cleanly to chapter + beat
 */
export default function LandingProductDemo() {
  const section = LANDING_CONTENT['product-demo']
  const chapters = section.chapters ?? []
  const sectionRef = useRef(null)
  const pinRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const reducedMotion = useReducedMotion()

  const weights = useMemo(() => chapters.map(chapterWeight), [chapters])
  const totalWeight = useMemo(
    () => weights.reduce((sum, weight) => sum + weight, 0) || 1,
    [weights],
  )

  const { active, subPhase, chapter } = useMemo(() => {
    const clamped = Math.min(0.999, Math.max(0, progress))
    let cursor = clamped * totalWeight
    let index = 0

    for (let i = 0; i < weights.length; i += 1) {
      if (cursor <= weights[i] || i === weights.length - 1) {
        index = i
        const local = Math.min(1, Math.max(0, cursor / (weights[i] || 1)))
        const beats = Math.max(1, chapters[i]?.beats?.length ?? 1)
        const phase = reducedMotion
          ? beats - 1
          : Math.min(beats - 1, Math.floor(local * beats))
        return { active: index, subPhase: phase, chapter: chapters[i] }
      }
      cursor -= weights[i]
    }

    return { active: 0, subPhase: 0, chapter: chapters[0] }
  }, [chapters, progress, reducedMotion, totalWeight, weights])

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const pin = pinRef.current
    if (!pin) return undefined

    const update = () => {
      const rect = pin.getBoundingClientRect()
      const scrollable = Math.max(1, rect.height - window.innerHeight)
      const raw = (-rect.top) / scrollable
      setProgress(Math.min(1, Math.max(0, raw)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const pinHeightVh = Math.round(totalWeight * 100)

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

      <div
        ref={pinRef}
        className="cw-v4-demo__pin"
        style={{ '--v4-pin-h': `${pinHeightVh}vh` }}
      >
        <div className="cw-v4-demo__sticky">
          <div className="cw-v4-demo__layout">
            <div className="cw-v4-demo__phone-col">
              <div className={`cw-v4-demo__phone cw-v4-demo__phone--${chapter?.id ?? 'choose'}`}>
                <LandingProductPhoneHost
                  chapterId={chapter?.id ?? 'choose'}
                  phase={subPhase}
                />
              </div>
            </div>

            <div className="cw-v4-demo__copy-col" aria-live="polite">
              <p className="cw-v4-demo__chapter-index">
                {String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
              </p>
              <h3 className="cw-v4-demo__chapter-title">{chapter?.title}</h3>
              <p className="cw-v4-demo__chapter-body">{chapter?.body}</p>
              {chapter?.beats?.length ? (
                <ul className="cw-v4-demo__beats">
                  {chapter.beats.map((beat, beatIndex) => (
                    <li key={beat} className={beatIndex <= subPhase ? 'is-on' : undefined}>
                      {beat}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
