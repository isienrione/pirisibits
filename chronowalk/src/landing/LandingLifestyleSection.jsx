import { LANDING_CONTENT } from './landingData.js'
import {
  LANDING_COLOSSEUM_NOW,
  LANDING_FORUM_NOW,
  LANDING_PANTHEON_NOW,
} from './landingVisualAssets.js'

const LIFESTYLE_IMAGES = {
  forum: LANDING_FORUM_NOW,
  pantheon: LANDING_PANTHEON_NOW,
}

export default function LandingLifestyleSection() {
  const { banners } = LANDING_CONTENT.lifestyle

  return (
    <section className="cw-landing-lifestyle" aria-label="Life with ChronoWalk in Rome">
      {banners.map((banner) => (
        <article
          key={banner.id}
          id={banner.id}
          className={`cw-landing-lifestyle__banner cw-landing-lifestyle__banner--${banner.tone}`}
        >
          <div className="cw-landing-lifestyle__frame">
            <div className="cw-landing-lifestyle__visual">
              <div className="cw-landing-lifestyle__placeholder" aria-hidden>
                <span>{banner.placeholderLabel}</span>
              </div>
              <img
                src={LIFESTYLE_IMAGES[banner.imageKey]}
                alt=""
                className="cw-landing-lifestyle__image"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="cw-landing-lifestyle__scrim" aria-hidden />
            </div>
            <div className="cw-landing-wrap cw-landing-lifestyle__caption-wrap">
              <p className="cw-landing-lifestyle__caption">{banner.caption}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
