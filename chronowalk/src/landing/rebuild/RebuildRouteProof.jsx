import { useId, useState } from 'react'
import { REBUILD_ROUTE } from '../rebuildCopy.js'
import { getCompleteStopTitles, getFeaturedRouteStops } from '../landingProduct.js'
import { trackLandingRouteExpand } from '../landingAnalytics.js'

/**
 * Route proof — five featured stops + expandable full list.
 */
export default function RebuildRouteProof() {
  const copy = REBUILD_ROUTE
  const featured = getFeaturedRouteStops()
  const allTitles = getCompleteStopTitles()
  const [expanded, setExpanded] = useState(false)
  const listId = useId()

  function toggle() {
    setExpanded((current) => {
      const next = !current
      trackLandingRouteExpand({ expanded: next })
      return next
    })
  }

  return (
    <section
      id="route-proof"
      className="cw-rb-section cw-rb-route cw-rb-surface--light"
      aria-labelledby="route-proof-heading"
    >
      <div className="cw-rb-wrap">
        <header>
          <h2 id="route-proof-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.subhead}</p>
          <p className="cw-rb-route__stops-label">{copy.stopsLabel}</p>
        </header>

        <ol className="cw-rb-route__featured" aria-label="Featured stops">
          {featured.map((stop) => (
            <li key={stop.id} className="cw-rb-route__stop">
              <div className="cw-rb-route__stop-media">
                {stop.photo ? (
                  <img src={stop.photo} alt="" loading="lazy" decoding="async" />
                ) : null}
              </div>
              <h3 className="cw-rb-route__stop-title">{stop.title}</h3>
            </li>
          ))}
        </ol>

        <div className="cw-rb-route__all">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--ghost"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={toggle}
          >
            {expanded ? copy.collapseLabel : copy.expandLabel}
          </button>

          {expanded ? (
            <ul id={listId} className="cw-rb-route__all-list">
              {allTitles.map((title) => (
                <li key={title}>{title}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}
