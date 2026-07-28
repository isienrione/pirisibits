import { useEffect, useMemo, useRef, useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { observeLandingSectionOnce, trackLandingRouteView } from '../landingAnalytics.js'
import LandingProductPhoneStage from './LandingProductPhoneStage.jsx'
import {
  beatFromLocal,
  buildCinematicTimeline,
  resolveTimeline,
  softLayerMotion,
  timelineHeightVh,
} from './productDemoTimeline.js'

function applyMotion(node, opacity) {
  if (!node) return
  const motion = softLayerMotion(opacity)
  node.style.opacity = String(motion.opacity)
  node.style.transform = motion.transform
  node.style.pointerEvents = motion.pointerEvents
}

/**
 * One sticky cinematic stage:
 * - phone + copy share the SAME scroll progress (always synced)
 * - copy is a stacked panel in the sticky stage — never scrolls under the phone
 * - tall track only drives progress (short distance)
 * - phone never empty: timeline guarantees a visible layer
 */
export default function LandingProductDemo() {
  const section = LANDING_CONTENT['product-demo']
  const chapters = section.chapters ?? []
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const layerRefs = useRef([])
  const copyRefs = useRef([])
  const beatKeyRef = useRef('')
  const activeKeyRef = useRef(0)
  const [beats, setBeats] = useState(() => chapters.map(() => 0))
  const [activeIndex, setActiveIndex] = useState(0)

  const timeline = useMemo(() => buildCinematicTimeline(chapters), [chapters])
  const pinHeightVh = useMemo(() => timelineHeightVh(timeline), [timeline])

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    let frame = 0

    const scrub = () => {
      const rect = track.getBoundingClientRect()
      const scrollable = Math.max(1, rect.height - window.innerHeight)
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable))
      const resolved = resolveTimeline(progress, timeline)
      const { opacities, locals } = resolved
      const nextActive = resolved.activeIndex

      for (let i = 0; i < chapters.length; i += 1) {
        const opacity = opacities[i] ?? 0
        applyMotion(layerRefs.current[i], opacity)
        applyMotion(copyRefs.current[i], opacity)

        const layer = layerRefs.current[i]
        if (layer) {
          layer.dataset.active = i === nextActive ? 'true' : 'false'
          layer.setAttribute('aria-hidden', opacity < 0.2 ? 'true' : 'false')
          if (chapters[i].id === 'walk') {
            const local = locals[i] ?? 0
            const resume = local < 0.55 ? 0 : local > 0.78 ? 1 : (local - 0.55) / 0.23
            layer.style.setProperty('--resume-blend', String(resume))
          }
        }

        const copy = copyRefs.current[i]
        if (copy) {
          copy.setAttribute('aria-hidden', opacity < 0.2 ? 'true' : 'false')
        }
      }

      const nextBeats = chapters.map((chapter, i) =>
        beatFromLocal(locals[i] ?? 0, chapter.beats?.length ?? 1),
      )
      const key = nextBeats.join(',')
      if (key !== beatKeyRef.current) {
        beatKeyRef.current = key
        setBeats(nextBeats)
      }
      if (nextActive !== activeKeyRef.current) {
        activeKeyRef.current = nextActive
        setActiveIndex(nextActive)
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(scrub)
    }

    scrub()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [chapters, timeline])

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
        ref={trackRef}
        className="cw-v4-demo__track"
        style={{ '--v4-pin-h': `${pinHeightVh}vh` }}
      >
        <div className="cw-v4-demo__stage">
          <div className="cw-v4-demo__phone">
            <LandingProductPhoneStage
              chapters={chapters}
              layerRefs={layerRefs}
              beats={beats}
              activeIndex={activeIndex}
            />
          </div>

          <div className="cw-v4-demo__copy">
            {chapters.map((chapter, index) => (
              <article
                key={chapter.id}
                ref={(el) => {
                  copyRefs.current[index] = el
                }}
                className="cw-v4-demo__copy-panel"
                data-chapter={chapter.id}
                style={{ opacity: index === 0 ? 1 : 0 }}
              >
                <p className="cw-v4-demo__chapter-index">
                  {String(index + 1).padStart(2, '0')} /{' '}
                  {String(chapters.length).padStart(2, '0')}
                </p>
                <h3 className="cw-v4-demo__chapter-title">{chapter.title}</h3>
                <p className="cw-v4-demo__chapter-body">{chapter.body}</p>
                {chapter.beats?.length ? (
                  <ul className="cw-v4-demo__beats">
                    {chapter.beats.map((beat, beatIndex) => (
                      <li
                        key={beat}
                        className={beatIndex <= (beats[index] ?? 0) ? 'is-on' : undefined}
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
      </div>
    </section>
  )
}
