import { useEffect, useState } from 'react'
import ChronoWalkLogo from '../../components/ui/ChronoWalkLogo.jsx'
import { LANDING_CONTENT } from '../landingData.js'

const INTRO_MS = 2000
const COMPRESS_MS = 900

/**
 * Keynote-style open: ChronoWalk mark plays once, then compresses into the nav bar.
 * No controls. Muted. Autoplay once.
 * Free sneak peek CTA lives in the hero (not top-right).
 */
export default function LandingIntroNav({ onComplete }) {
  const { nav } = LANDING_CONTENT.header
  const [phase, setPhase] = useState('intro') // intro | compress | nav
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

  useEffect(() => {
    if (reduceMotion) {
      setPhase('nav')
      onComplete?.()
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const t1 = window.setTimeout(() => setPhase('compress'), INTRO_MS)
    const t2 = window.setTimeout(() => {
      setPhase('nav')
      document.body.style.overflow = previousOverflow
      onComplete?.()
    }, INTRO_MS + COMPRESS_MS)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      document.body.style.overflow = previousOverflow
    }
  }, [onComplete, reduceMotion])

  const isNav = phase === 'nav'
  const isCompress = phase === 'compress'

  return (
    <>
      <div
        className={`cw-v4-intro${isCompress ? ' cw-v4-intro--compress' : ''}${isNav ? ' cw-v4-intro--done' : ''}`}
        aria-hidden={isNav}
      >
        <div className="cw-v4-intro__mark">
          <svg className="cw-v4-intro__prism" viewBox="0 0 120 120" aria-hidden>
            <defs>
              <linearGradient id="cw-v4-intro-spec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E4552E" />
                <stop offset="17%" stopColor="#E8A13C" />
                <stop offset="34%" stopColor="#7C9A5C" />
                <stop offset="50%" stopColor="#4E9B8F" />
                <stop offset="67%" stopColor="#4E7D9B" />
                <stop offset="83%" stopColor="#8A6FB5" />
                <stop offset="100%" stopColor="#B14A6E" />
              </linearGradient>
            </defs>
            <circle className="cw-v4-intro__circle" cx="60" cy="60" r="52" />
            <line className="cw-v4-intro__spectrum" x1="60" y1="8" x2="60" y2="112" />
            <line className="cw-v4-intro__ember" x1="60" y1="8" x2="60" y2="112" />
          </svg>
          <p className="cw-v4-intro__word">ChronoWalk</p>
        </div>
      </div>

      <header
        className={`cw-v4-nav${isNav || isCompress ? ' cw-v4-nav--visible' : ''}`}
        data-phase={phase}
      >
        <div className="cw-v4-nav__inner">
          <a href="#top" className="cw-v4-nav__brand" aria-label="ChronoWalk home">
            <ChronoWalkLogo size={32} variant="dark" className="cw-v4-nav__emblem" />
            <span className="cw-v4-nav__name">ChronoWalk</span>
          </a>

          <nav className="cw-v4-nav__links" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="cw-v4-nav__link">
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}
