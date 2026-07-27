import { getModernPosterUrl } from '../../content/modernPhotoRegistry.js'
import { REBUILD_JOURNEY } from '../rebuildCopy.js'

/**
 * Flexible journey — one idea: start anywhere, return anytime.
 * No timeline. No progress mock UI.
 */
export default function RebuildJourney() {
  const copy = REBUILD_JOURNEY
  const photo = getModernPosterUrl('appian-way')

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-journey cw-rb-surface--light"
      aria-labelledby="journey-heading"
    >
      <div id="route-proof" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div id="adaptive-walk" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        {photo ? (
          <figure className="cw-rb-journey__media">
            <img src={photo} alt="" width={800} height={480} loading="lazy" decoding="async" />
          </figure>
        ) : null}
        <h2 id="journey-heading" className="cw-rb-title">
          {copy.headline}
        </h2>
        <p className="cw-rb-lead">{copy.body}</p>
      </div>
    </section>
  )
}
