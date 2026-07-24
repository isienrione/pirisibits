import { REBUILD_HERO } from '../rebuildCopy.js'
import { LANDING_COLOSSEUM_NOW } from '../landingVisualAssets.js'

/**
 * Rebuild hero — clarity-first copy + Threshold seam still.
 * @param {{ mode: { id: string }, host?: { label?: string } | null, onPrimary?: () => void, onSecondary?: () => void, supportLine?: string }} props
 */
export default function RebuildHero({ mode, host, onPrimary, onSecondary, supportLine }) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const copy = REBUILD_HERO[modeId] ?? REBUILD_HERO.organic
  const support = supportLine || copy.support

  return (
    <section id="hero" className="cw-rb-hero" aria-labelledby="rebuild-hero-heading">
      <div className="cw-rb-wrap cw-rb-hero__layout">
        <div className="cw-rb-hero__copy">
          {host?.label ? (
            <p className="cw-rb-hero__host">Prepared for {host.label}</p>
          ) : null}

          <p className="cw-rb-eyebrow">{copy.eyebrow}</p>

          <h1 id="rebuild-hero-heading" className="cw-rb-hero__headline">
            {copy.headline}
          </h1>

          <p className="cw-rb-hero__support">{support}</p>

          <p className="cw-rb-hero__definition">{copy.definition}</p>

          <div className="cw-rb-actions">
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--primary"
              onClick={onPrimary}
            >
              {copy.primaryCta}
            </button>
            <button
              type="button"
              className="cw-rb-btn cw-rb-btn--secondary"
              onClick={onSecondary}
            >
              {copy.secondaryCta}
            </button>
          </div>

          <p className="cw-rb-hero__reassurance">{copy.reassurance}</p>
        </div>

        <figure className="cw-rb-hero__visual">
          <img
            src={LANDING_COLOSSEUM_NOW}
            alt="Colosseum today — Threshold Then vs Now seam"
            width={960}
            height={1280}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <span className="cw-rb-hero__seam" aria-hidden="true" />
        </figure>
      </div>
    </section>
  )
}
