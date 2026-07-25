import { useId, useState } from 'react'
import { REBUILD_ROUTE } from '../rebuildCopy.js'
import { getCompleteStopTitles, getFeaturedRouteStops, LANDING_PRODUCT } from '../landingProduct.js'
import { trackLandingRouteExpand } from '../landingAnalytics.js'

/**
 * Route + flexibility proof — horizontal landmark strip + behaviors + disclosure.
 */
export default function RebuildRouteFlex() {
  const copy = REBUILD_ROUTE
  const featured = getFeaturedRouteStops()
  const allTitles = getCompleteStopTitles()
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  const stopCount = LANDING_PRODUCT.eterna?.stopCount ?? 21

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
      className="cw-rb-section cw-rb-route cw-rb-surface--dark"
      aria-labelledby="route-proof-heading"
    >
      <div id="adaptive-walk" className="cw-rb-sr-only" tabIndex={-1} aria-hidden="true" />
      <div className="cw-rb-wrap">
        <header>
          <h2 id="route-proof-heading" className="cw-rb-title">
            {copy.headline}
          </h2>
          <p className="cw-rb-lead">{copy.subhead}</p>
        </header>

        <div className="cw-rb-route__scroller" role="list" aria-label="Featured landmarks">
          {featured.map((stop, index) => (
            <article key={stop.id} className="cw-rb-route__card" role="listitem">
              <figure className="cw-rb-route__card-media">
                {stop.photo ? (
                  <img
                    src={stop.photo}
                    alt=""
                    width={280}
                    height={200}
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </figure>
              <p className="cw-rb-route__card-label">
                {copy.featuredLabels?.[stop.id] ?? `Stop ${index + 1}`}
              </p>
              <h3 className="cw-rb-route__card-title">{stop.title}</h3>
            </article>
          ))}
        </div>

        <ul className="cw-rb-route__behaviors" aria-label="How the walk adapts">
          {copy.behaviors.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="cw-rb-route__all">
          <button
            type="button"
            className="cw-rb-btn cw-rb-btn--ghost"
            aria-expanded={expanded}
            aria-controls={listId}
            onClick={toggle}
          >
            {expanded ? copy.collapseLabel : `See all ${stopCount} stops`}
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
