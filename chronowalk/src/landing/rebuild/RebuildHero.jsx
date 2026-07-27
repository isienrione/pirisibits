import { REBUILD_HERO } from '../rebuildCopy.js'
import RebuildProductPhone from './RebuildProductPhone.jsx'

/**
 * Product-first hero. Phone is the excitement; chrome stays quiet.
 * Act I CTA — curiosity.
 * @param {{
 *   mode?: { id?: string }
 *   host?: { label?: string } | null
 *   onPrimary?: () => void
 *   onSecondary?: () => void
 *   supportLine?: string
 *   onPlayingChange?: (playing: boolean) => void
 * }} props
 */
export default function RebuildHero({
  mode,
  host,
  onPrimary,
  onSecondary,
  supportLine,
  onPlayingChange,
}) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const copy = REBUILD_HERO[modeId] ?? REBUILD_HERO.organic
  const support = supportLine || copy.support
  const lines = copy.headlineLines?.length ? copy.headlineLines : [copy.headline]

  return (
    <section id="hero" className="cw-rb-hero" aria-labelledby="rebuild-hero-heading">
      <div className="cw-rb-wrap cw-rb-hero__inner">
        {host?.label ? (
          <p className="cw-rb-hero__host">Recommended by {host.label}</p>
        ) : null}

        <RebuildProductPhone className="cw-rb-hero__phone" onPlayingChange={onPlayingChange} />

        <div className="cw-rb-hero__copy">
          <h1 id="rebuild-hero-heading" className="cw-rb-hero__headline">
            {lines.map((line) => (
              <span key={line} className="cw-rb-hero__line">
                {line}
              </span>
            ))}
          </h1>
          {support ? <p className="cw-rb-hero__support">{support}</p> : null}
        </div>

        <div className="cw-rb-hero__cta">
          <button
            id="hero-primary-cta"
            type="button"
            className="cw-rb-btn cw-rb-btn--curiosity cw-rb-btn--block"
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
      </div>
    </section>
  )
}
