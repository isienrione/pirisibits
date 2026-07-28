import { useEffect, useMemo, useRef, useState } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { observeLandingSectionOnce, trackLandingRouteView } from '../landingAnalytics.js'
import LandingProductPhoneStage from './LandingProductPhoneStage.jsx'
import {
  buildChapterRanges,
  chapterPhase,
  chapterScrollWeight,
  phoneLayerStyle,
  textCenterOpacity,
} from './productDemoTimeline.js'

/**
 * One continuous cinematic timeline:
 * - phone mounts once, sticks once, unmounts once
 * - screen layers crossfade with overlap
 * - copy scrolls and fades 0→1→0 through viewport center
 * - no section snap / no per-chapter sticky containers
 */
export default function LandingProductDemo() {
  const section = LANDING_CONTENT['product-demo']
  const chapters = section.chapters ?? []
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const copyRefs = useRef([])
  const [progress, setProgress] = useState(0)
  const [scrollablePx, setScrollablePx] = useState(0)
  const [textOpacities, setTextOpacities] = useState(() => chapters.map(() => 0))

  const ranges = useMemo(() => buildChapterRanges(chapters, 0.18), [chapters])
  const pinHeightVh = useMemo(
    () => Math.round(chapters.reduce((sum, chapter) => sum + chapterScrollWeight(chapter), 0) * 100),
    [chapters],
  )

  const layers = useMemo(
    () =>
      ranges.map((range) => ({
        id: range.id,
        phase: chapterPhase(
          progress,
          range.start,
          range.end,
          range.chapter.beats?.length ?? 1,
        ),
        style: phoneLayerStyle(progress, range.start, range.end, scrollablePx),
      })),
    [progress, ranges, scrollablePx],
  )

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    let frame = 0
    const update = () => {
      const rect = track.getBoundingClientRect()
      const scrollable = Math.max(1, rect.height - window.innerHeight)
      const nextProgress = Math.min(1, Math.max(0, -rect.top / scrollable))
      setScrollablePx(scrollable)
      setProgress(nextProgress)

      const vh = window.innerHeight || 1
      const nextText = copyRefs.current.map((node) =>
        node ? textCenterOpacity(node.getBoundingClientRect(), vh) : 0,
      )
      setTextOpacities(nextText)
    }

    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [chapters.length])

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
        {/* Single sticky phone host — mounts with the track, never remounts per chapter. */}
        <div className="cw-v4-demo__phone-slot">
          <div className="cw-v4-demo__phone-sticky">
            <div className="cw-v4-demo__phone">
              <LandingProductPhoneStage layers={layers} />
            </div>
          </div>
        </div>

        <div className="cw-v4-demo__copy-rail">
          {chapters.map((chapter, index) => {
            const opacity = textOpacities[index] ?? 0
            const y = (1 - opacity) * 20
            return (
              <article
                key={chapter.id}
                ref={(el) => {
                  copyRefs.current[index] = el
                }}
                className="cw-v4-demo__copy-beat"
                data-chapter={chapter.id}
                style={{
                  '--beat-weight': chapterScrollWeight(chapter),
                  opacity,
                  transform: `translateY(${y}px)`,
                  filter: opacity >= 0.98 ? 'none' : `blur(${(1 - opacity) * 6}px)`,
                }}
              >
                <div className="cw-v4-demo__copy-inner">
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
                          className={beatIndex <= (layers[index]?.phase ?? 0) ? 'is-on' : undefined}
                        >
                          {beat}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
