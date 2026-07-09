import { useState } from 'react'
import ChronoWalkLogo from '../redesign/ui/ChronoWalkLogo.jsx'
import { tourHero } from '../redesign/images.js'
import { LANDING_CONTENT } from './landingData.js'

function PlayIcon() {
  return (
    <svg
      className="cw-landing-hero__play-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden
    >
      <path d="M8 5.5v13l11-6.5L8 5.5z" fill="currentColor" />
    </svg>
  )
}

export default function LandingHero({ onBegin, onPreview }) {
  const hero = LANDING_CONTENT.hero
  const [imageOk, setImageOk] = useState(true)

  const heroClassName = [
    'cw-landing-hero',
    imageOk ? 'cw-landing-hero--photo' : 'cw-landing-hero--fallback',
  ].join(' ')

  const heroStyle = imageOk
    ? {
        backgroundImage: `linear-gradient(
            180deg,
            color-mix(in srgb, var(--obsidian, #16130f) 72%, transparent) 0%,
            color-mix(in srgb, var(--obsidian, #16130f) 88%, transparent) 42%,
            color-mix(in srgb, var(--obsidian, #16130f) 96%, transparent) 100%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--obsidian, #16130f) 94%, transparent) 0%,
            color-mix(in srgb, var(--ember, #e8a13c) 8%, var(--obsidian, #16130f)) 55%,
            color-mix(in srgb, var(--obsidian, #16130f) 98%, transparent) 100%
          ),
          url(${tourHero})`,
      }
    : undefined

  return (
    <section
      id="hero"
      className={heroClassName}
      style={heroStyle}
      aria-labelledby="hero-heading"
    >
      {imageOk ? (
        <img
          src={tourHero}
          alt=""
          className="cw-landing-hero__probe"
          onError={() => setImageOk(false)}
        />
      ) : null}

      <div className="cw-landing-wrap cw-landing-hero__inner">
        <header className="cw-landing-hero__mark">
          <ChronoWalkLogo size={22} />
          <span>ChronoWalk · Rome</span>
        </header>

        <div className="cw-landing-hero__stage">
          <h1 id="hero-heading" className="cw-landing-hero__headline">
            {hero.headline}
          </h1>
          <p className="cw-landing-hero__sub">{hero.subheadline}</p>

          <button
            type="button"
            className="cw-landing-hero__audio"
            onClick={onPreview}
          >
            <span className="cw-landing-hero__play" aria-hidden>
              <PlayIcon />
            </span>
            <span className="cw-landing-hero__audio-label">
              {hero.audioPreview.label}
              <span className="cw-landing-hero__audio-meta"> · {hero.audioPreview.meta}</span>
            </span>
          </button>

          <div className="cw-landing-hero__actions">
            <button type="button" className="cw-landing-btn cw-landing-btn--coral cw-landing-btn--glow" onClick={onBegin}>
              {hero.primaryCta}
            </button>
            <button type="button" className="cw-landing-hero__secondary" onClick={onPreview}>
              {hero.secondaryCta} →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
