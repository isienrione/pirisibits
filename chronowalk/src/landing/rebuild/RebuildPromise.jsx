import { LANDING_EDITORIAL } from '../landingVisualAssets.js'
import { REBUILD_PROMISE } from '../rebuildCopy.js'

/** Section 2 — emotion + close architectural detail. */
export default function RebuildPromise() {
  const copy = REBUILD_PROMISE

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-promise cw-rb-surface--light"
      aria-labelledby="promise-heading"
    >
      <div className="cw-rb-wrap cw-rb-wrap--narrow">
        <figure className="cw-rb-photo cw-rb-photo--detail cw-rb-promise__media">
          <img
            src={LANDING_EDITORIAL.archDetail}
            alt=""
            width={960}
            height={1280}
            loading="eager"
            decoding="async"
          />
        </figure>
        <h2 id="promise-heading" className="cw-rb-title cw-rb-promise__title">
          {copy.headline}
        </h2>
        {copy.body ? <p className="cw-rb-lead cw-rb-promise__body">{copy.body}</p> : null}
      </div>
    </section>
  )
}
