import { REBUILD_HERO } from '../rebuildCopy.js'
import { LANDING_COLOSSEUM_NOW, LANDING_COLOSSEUM_THEN } from '../landingVisualAssets.js'

/**
 * Full-bleed product hero — Colosseum Today/Then plane + brand + one CTA path.
 * @param {{ mode: { id: string }, host?: { label?: string } | null, onPrimary?: () => void, onSecondary?: () => void, supportLine?: string }} props
 */
export default function RebuildHero({ mode, host, onPrimary, onSecondary, supportLine }) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const copy = REBUILD_HERO[modeId] ?? REBUILD_HERO.organic
  const support = supportLine || copy.support

  return (
    <section id="hero" className="cw-rb-hero" aria-labelledby="rebuild-hero-heading">
      <div className="cw-rb-hero__plane" aria-hidden="true">
        <img
          className="cw-rb-hero__plane-img cw-rb-hero__plane-img--then"
          src={LANDING_COLOSSEUM_THEN}
          alt=""
          width={960}
          height={1280}
          loading="eager"
          decoding="async"
        />
        <img
          className="cw-rb-hero__plane-img cw-rb-hero__plane-img--now"
          src={LANDING_COLOSSEUM_NOW}
          alt=""
          width={960}
          height={1280}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <span className="cw-rb-hero__seam" />
        <span className="cw-rb-hero__scrim" />
      </div>

      <div className="cw-rb-wrap cw-rb-hero__content">
        <p className="cw-rb-hero__brand">ChronoWalk</p>

        {host?.label ? (
          <p className="cw-rb-hero__host">Recommended by {host.label}</p>
        ) : null}

        <h1 id="rebuild-hero-heading" className="cw-rb-hero__headline">
          {copy.headline}
        </h1>

        <p className="cw-rb-hero__support">{support}</p>

        <div className="cw-rb-hero__cta">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--primary cw-rb-btn--block"
            onClick={onPrimary}
          >
            {copy.primaryCta}
          </button>
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--ghost cw-rb-hero__secondary"
            onClick={onSecondary}
          >
            {copy.secondaryCta}
          </button>
        </div>

        <p className="cw-rb-hero__reassurance">{copy.reassurance}</p>
      </div>
    </section>
  )
}
