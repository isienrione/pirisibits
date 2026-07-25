import { REBUILD_HERO } from '../rebuildCopy.js'
import ThresholdStage from './ThresholdStage.jsx'

/**
 * Product-led hero — copy + Threshold demonstration in one viewport.
 * @param {{ mode: { id: string }, host?: { label?: string } | null, onPrimary?: () => void, onSecondary?: () => void, supportLine?: string }} props
 */
export default function RebuildHero({ mode, host, onPrimary, onSecondary, supportLine }) {
  const modeId = mode?.id === 'geo' || mode?.id === 'qr' ? mode.id : 'organic'
  const copy = REBUILD_HERO[modeId] ?? REBUILD_HERO.organic
  const support = supportLine || copy.support
  const lines = copy.headlineLines?.length ? copy.headlineLines : [copy.headline]

  return (
    <section id="hero" className="cw-rb-hero" aria-labelledby="rebuild-hero-heading">
      <div className="cw-rb-wrap cw-rb-hero__inner">
        <div className="cw-rb-hero__copy">
          {host?.label ? (
            <p className="cw-rb-hero__host">Recommended by {host.label}</p>
          ) : null}

          <p className="cw-rb-eyebrow">{copy.eyebrow}</p>

          <h1 id="rebuild-hero-heading" className="cw-rb-hero__headline">
            {lines.map((line) => (
              <span key={line} className="cw-rb-hero__line">
                {line}
              </span>
            ))}
          </h1>

          <p className="cw-rb-hero__support">{support}</p>
          <p className="cw-rb-hero__proof">{copy.definition}</p>

          <div className="cw-rb-hero__cta">
            <button
              id="hero-primary-cta"
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

          {copy.reassurance ? (
            <p className="cw-rb-hero__reassurance">{copy.reassurance}</p>
          ) : null}
        </div>

        <div className="cw-rb-hero__demo" aria-label="Then versus Now demonstration">
          <ThresholdStage
            hint={copy.thresholdHint}
            showTap={false}
            showProgress
            track={false}
            className="cw-rb-hero__thstage"
          />
        </div>
      </div>
    </section>
  )
}
