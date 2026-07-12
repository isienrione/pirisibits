import { LANDING_CONTENT } from './landingData.js'
import { LANDING_LIFESTYLE_THUMBS } from './landingVisualAssets.js'
import { mediaUrl } from '../lib/mediaUrl.js'

const LIFESTYLE_IMAGES = {
  forum: LANDING_LIFESTYLE_THUMBS.forum,
  pantheon: LANDING_LIFESTYLE_THUMBS.pantheon,
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
                src={mediaUrl(LIFESTYLE_IMAGES[banner.imageKey])}
                alt=""
                className="cw-landing-lifestyle__image"
                loading="lazy"
                decoding="async"
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
