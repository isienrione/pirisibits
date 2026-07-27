import { LANDING_EDITORIAL } from '../landingVisualAssets.js'
import { REBUILD_STREET } from '../rebuildCopy.js'

/**
 * Photo-led atmosphere beat — street scale + archaeological texture.
 * No explanation; the images carry the editorial rhythm.
 */
export default function RebuildStreetBeat() {
  const copy = REBUILD_STREET

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-street cw-rb-surface--light"
      aria-label={copy.ariaLabel}
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <div className="cw-rb-street__stack">
          <figure className="cw-rb-photo cw-rb-photo--street">
            <img
              src={LANDING_EDITORIAL.street}
              alt=""
              width={1080}
              height={1620}
              loading="lazy"
              decoding="async"
            />
          </figure>
          <figure className="cw-rb-photo cw-rb-photo--texture">
            <img
              src={LANDING_EDITORIAL.archaeology}
              alt=""
              width={1080}
              height={1620}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </div>
      </div>
    </section>
  )
}
