import { useState } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import { LANDING_V2 } from './landingVisualAssets.js'

export default function LandingHero({ onPreview }) {
  const hero = LANDING_CONTENT.hero
  const [imageOk, setImageOk] = useState(true)

  return (
    <section id={hero.id} className="cw-v2-hero" aria-labelledby="hero-heading">
      {imageOk ? (
        <img
          src={LANDING_V2.heroRome}
          alt="The Roman Forum and Colosseum bathed in golden hour light"
          className="cw-v2-hero__photo"
          onError={() => setImageOk(false)}
        />
      ) : null}
      <div className="cw-v2-hero__scrim cw-v2-hero__scrim--vertical" aria-hidden />
      <div className="cw-v2-hero__scrim cw-v2-hero__scrim--horizontal" aria-hidden />

      <div className="cw-v2-hero__content">
        <p className="cw-v2-eyebrow cw-v2-eyebrow--hero">
          <span className="cw-v2-eyebrow__rule" aria-hidden />
          {hero.eyebrow}
        </p>

        <h1 id="hero-heading" className="cw-v2-hero__headline">
          {hero.headline}
        </h1>
        <p className="cw-v2-hero__sub">{hero.subheadline}</p>

        <div className="cw-v2-hero__actions">
          <a href="#pricing" className="cw-v2-btn cw-v2-btn--coral">
            {hero.primaryCta}
          </a>
          {onPreview ? (
            <button type="button" className="cw-v2-btn cw-v2-btn--outline" onClick={onPreview}>
              {hero.secondaryCta}
            </button>
          ) : (
            <a href="#threshold" className="cw-v2-btn cw-v2-btn--outline">
              {hero.secondaryCta}
            </a>
          )}
        </div>

        <dl className="cw-v2-hero__stats">
          {hero.stats.map((stat) => (
            <div key={stat.label} className="cw-v2-hero__stat">
              <dt className="cw-v2-hero__stat-value">{stat.value}</dt>
              <dd className="cw-v2-hero__stat-label">{stat.label}</dd>
            </div>
          ))}
        </dl>

        {onPreview && hero.freeStoryMeta ? (
          <p className="cw-v2-hero__preview-meta">{hero.freeStoryMeta}</p>
        ) : null}
      </div>
    </section>
  )
}
