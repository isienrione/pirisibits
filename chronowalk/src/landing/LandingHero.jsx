import { useState } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

export default function LandingHero({ onPreview }) {
  const hero = LANDING_CONTENT.hero
  const [imageOk, setImageOk] = useState(true)

  return (
    <section id={hero.id} className="cw-v2-hero" aria-labelledby="hero-heading">
      {imageOk ? (
        <img
          src={LANDING_V2.heroRome}
          alt=""
          aria-hidden="true"
          className="cw-v2-hero__photo"
          onError={() => setImageOk(false)}
        />
      ) : null}
      <div className="cw-v2-hero__layout">
        <div className="cw-v2-hero__content">
          <p className="cw-v2-eyebrow cw-v2-eyebrow--hero">
            <span className="cw-v2-eyebrow__rule" aria-hidden />
            {hero.eyebrow}
          </p>

          <h1 id="hero-heading" className="cw-v2-hero__headline">
            {hero.headline}
          </h1>
          {hero.accentLine ? (
            <p className="cw-v2-hero__accent">{hero.accentLine}</p>
          ) : null}
          <p className="cw-v2-hero__sub">{hero.subheadline}</p>

          <div className="cw-v2-hero__actions">
            {onPreview ? (
              <button type="button" className="cw-v2-btn cw-v2-btn--coral cw-v2-btn--block" onClick={onPreview}>
                {hero.primaryCta}
              </button>
            ) : (
              <a href="#try-free" className="cw-v2-btn cw-v2-btn--coral cw-v2-btn--block">
                {hero.primaryCta}
              </a>
            )}
            <a href="#pricing" className="cw-v2-btn cw-v2-btn--outline cw-v2-btn--block">
              {hero.secondaryCta}
            </a>
          </div>

          {hero.trustLine ? <p className="cw-v2-hero__trust">{hero.trustLine}</p> : null}
        </div>

        <div className="cw-v2-hero__device">
          <LandingLivePhoneMockup variant="audio" />
        </div>
      </div>
    </section>
  )
}
