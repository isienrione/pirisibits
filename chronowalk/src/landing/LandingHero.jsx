import { useState } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import { LANDING_HERO } from './landingVisualAssets.js'
import { ensureLandingExpHero, getHeroCopyForExp } from './landingExperiments.js'
import { LandingResponsivePicture } from './LandingResponsivePicture.jsx'
import LandingLivePhoneMockup from './LandingLivePhoneMockup.jsx'

/**
 * Act I hero · transformation first, function second.
 * Full-bleed cinematic Rome plate (distinct from interludes / ending).
 * Headline: Test 1 A/B via `landingExperiments` (`landing_exp_hero`).
 */
export default function LandingHero({ onPreview, onRoutes }) {
  const hero = LANDING_CONTENT.hero
  const [imageOk, setImageOk] = useState(true)
  const [expHero] = useState(() => ensureLandingExpHero())
  const headline = getHeroCopyForExp(expHero).headline

  return (
    <section id={hero.id} className="cw-v2-hero" aria-labelledby="hero-heading">
      {imageOk ? (
        <div className="cw-v2-hero__photo-wrap" onErrorCapture={() => setImageOk(false)}>
          <LandingResponsivePicture
            image={LANDING_HERO}
            className="cw-v2-hero__photo"
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
        </div>
      ) : null}
      <div className="cw-v2-hero__veil" aria-hidden="true" />

      <div className="cw-v2-hero__layout">
        <div className="cw-v2-hero__content">
          <p className="cw-v2-eyebrow cw-v2-eyebrow--hero">
            <span className="cw-v2-eyebrow__rule" aria-hidden="true" />
            {hero.eyebrow}
          </p>

          <h1 id="hero-heading" className="cw-v2-hero__headline">
            {headline}
          </h1>

          <span className="cw-v2-hero__seam" aria-hidden="true" />

          {hero.accentLine ? (
            <p className="cw-v2-hero__support">{hero.accentLine}</p>
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
            <a
              href="#pricing"
              className="cw-v2-btn cw-v2-btn--outline cw-v2-btn--block"
              onClick={() => onRoutes?.()}
            >
              {hero.secondaryCta}
            </a>
          </div>

          {hero.trustLine ? <p className="cw-v2-hero__trust">{hero.trustLine}</p> : null}
        </div>

        <div className="cw-v2-hero__device" aria-hidden="true">
          {/* Live HTML so the Pantheon plate matches the free-preview exterior still. */}
          <LandingLivePhoneMockup variant="listening" size="xl" mode="live" />
        </div>
      </div>
    </section>
  )
}
