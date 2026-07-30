import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion.js'
import { LandingResponsivePicture } from './LandingResponsivePicture.jsx'

/**
 * Reusable cinematic narrative break — image + minimal copy, no CTA/cards/icons.
 *
 * @param {object} props
 * @param {string} [props.id]
 * @param {string[]} props.lines — poetic lines (first is the accessible heading)
 * @param {{ mobileSrc: string, desktopSrc: string, lqipSrc?: string, alt?: string, mobileWidth?: number, mobileHeight?: number, desktopWidth?: number, desktopHeight?: number }} props.image
 * @param {'before'|'after'|'both'|'none'} [props.seam='both']
 * @param {boolean} [props.parallax=true] — subtle translate only; disabled when reduced motion
 * @param {string} [props.className]
 */
export default function CinematicInterlude({
  id,
  lines,
  image,
  seam = 'both',
  parallax = true,
  className = '',
}) {
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef(null)
  const mediaRef = useRef(null)
  const allowParallax = parallax && !reducedMotion

  useEffect(() => {
    if (!allowParallax) return undefined
    const section = sectionRef.current
    const media = mediaRef.current
    if (!section || !media) return undefined

    let frame = 0
    let active = false

    const update = () => {
      frame = 0
      if (!active) {
        media.style.transform = ''
        return
      }
      const rect = section.getBoundingClientRect()
      const view = window.innerHeight || 1
      // Progress of section mid-point through the viewport (−0.5 … 0.5)
      const progress = (rect.top + rect.height / 2 - view / 2) / view
      const offset = Math.max(-12, Math.min(12, progress * -18))
      media.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting
        if (!active) {
          media.style.transform = ''
          return
        }
        onScroll()
      },
      { rootMargin: '10% 0px' },
    )

    io.observe(section)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      media.style.transform = ''
    }
  }, [allowParallax])

  const headingId = id ? `${id}-heading` : undefined
  const [first, ...rest] = lines
  const { lqipSrc } = image

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`cw-cinematic-interlude ${className}`.trim()}
      aria-labelledby={headingId}
      data-parallax={allowParallax ? 'on' : 'off'}
    >
      {seam === 'before' || seam === 'both' ? (
        <div className="cw-cinematic-interlude__seam cw-cinematic-interlude__seam--before" aria-hidden="true" />
      ) : null}

      <div className="cw-cinematic-interlude__stage">
        <div
          ref={mediaRef}
          className="cw-cinematic-interlude__media"
          style={lqipSrc ? { backgroundImage: `url(${lqipSrc})` } : undefined}
        >
          <LandingResponsivePicture image={image} className="cw-cinematic-interlude__img" loading="lazy" />
        </div>

        <div className="cw-cinematic-interlude__veil" aria-hidden="true" />

        <div className="cw-cinematic-interlude__copy">
          <h2 id={headingId} className="cw-cinematic-interlude__verse">
            <span className="cw-cinematic-interlude__line cw-cinematic-interlude__line--loud">{first}</span>
            {rest.map((line, index) => (
              <span
                key={line}
                className={
                  index === 0
                    ? 'cw-cinematic-interlude__line cw-cinematic-interlude__line--quiet'
                    : 'cw-cinematic-interlude__line cw-cinematic-interlude__line--turn'
                }
              >
                {index === rest.length - 1 && rest.length > 1 ? (
                  <>
                    <span className="cw-cinematic-interlude__inner-seam" aria-hidden="true" />
                    {line}
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
          </h2>
        </div>
      </div>

      {seam === 'after' || seam === 'both' ? (
        <div className="cw-cinematic-interlude__seam cw-cinematic-interlude__seam--after" aria-hidden="true" />
      ) : null}
    </section>
  )
}
