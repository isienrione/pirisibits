import { LANDING_FORUM_NOW } from '../landingVisualAssets.js'
import { REBUILD_PROMISE } from '../rebuildCopy.js'

/**
 * Screen 2 — one idea: product promise. Large image + short headline + one sentence.
 */
export default function RebuildPromise() {
  const copy = REBUILD_PROMISE

  return (
    <section
      id={copy.id}
      className="cw-rb-section cw-rb-promise cw-rb-surface--dark"
      aria-labelledby="promise-heading"
    >
      <div className="cw-rb-wrap">
        <figure className="cw-rb-promise__media">
          <img
            src={LANDING_FORUM_NOW}
            alt=""
            width={1200}
            height={900}
            loading="eager"
            decoding="async"
          />
        </figure>
        <h2 id="promise-heading" className="cw-rb-title cw-rb-promise__title">
          {copy.headline}
        </h2>
        <p className="cw-rb-promise__body">{copy.body}</p>
      </div>
    </section>
  )
}
