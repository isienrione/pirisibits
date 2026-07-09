import { useState } from 'react'
import { Play } from 'lucide-react'
import ChronoWalkLogo from '../redesign/ui/ChronoWalkLogo.jsx'
import { Vignette, BottomScrim } from '../redesign/ui/index.js'
import { tourHero, pantheonNow } from '../redesign/images.js'
import { LANDING_CONTENT, formatLandingCopy, formatLandingLines } from './landingData.js'

export default function LandingHero({ priceLabel, onBegin, onPreview }) {
  const hero = LANDING_CONTENT.hero
  const [bgFailed, setBgFailed] = useState(false)
  const supportLines = formatLandingLines(hero.supportLines, { price: priceLabel })

  return (
    <section id="hero" className="cw-landing-hero">
      <div
        className={`cw-landing-hero__bg${bgFailed ? ' cw-landing-hero__bg--fallback' : ''}`}
        style={bgFailed ? undefined : { backgroundImage: `url(${tourHero})` }}
      >
        {!bgFailed ? (
          <img
            src={tourHero}
            alt=""
            className="cw-landing-hero__bg-img"
            onError={() => setBgFailed(true)}
          />
        ) : null}
      </div>
      <Vignette />
      <BottomScrim strength={0.96} />

      <div className="cw-landing-hero__content">
        <header className="cw-landing-hero__mark">
          <ChronoWalkLogo size={22} />
          <span>ChronoWalk · Rome</span>
        </header>

        <div className="cw-landing-hero__lower">
          <h1 className="cw-landing-hero__headline">{hero.headline}</h1>
          <p className="cw-landing-hero__sub">{hero.subheadline}</p>

          <div className="cw-landing-actions">
            <button type="button" className="cw-landing-btn cw-landing-btn--coral" onClick={onBegin}>
              {hero.primaryCta}
            </button>
            <button type="button" className="cw-landing-btn cw-landing-btn--ghost" onClick={onPreview}>
              {hero.secondaryCta}
            </button>
          </div>

          <div className="cw-landing-hero__support">
            {supportLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <button type="button" className="cw-landing-preview-card" onClick={onPreview}>
            <div className="cw-landing-preview-card__copy">
              <p className="cw-landing-preview-card__title">{hero.audioPreview.title}</p>
              <p className="cw-landing-preview-card__meta">{hero.audioPreview.meta}</p>
            </div>
            <div className="cw-landing-preview-card__thumb">
              <img src={pantheonNow} alt="" onError={(e) => { e.currentTarget.style.display = 'none' }} />
              <span className="cw-landing-preview-card__play" aria-hidden>
                <Play size={14} fill="currentColor" />
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  )
}
