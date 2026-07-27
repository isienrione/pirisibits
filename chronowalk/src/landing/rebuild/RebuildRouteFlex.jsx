import { useId, useState } from 'react'
import { getModernPosterUrl } from '../../content/modernPhotoRegistry.js'
import { REBUILD_ROUTE } from '../rebuildCopy.js'
import { getCompleteStopTitles, LANDING_PRODUCT } from '../landingProduct.js'
import { trackLandingRouteExpand } from '../landingAnalytics.js'

const STORY_MEDIA = {
  start: 'colosseum',
  lunch: 'forum-via-sacra',
  shopping: 'fontana-di-trevi',
  resume: 'pantheon',
  finish: 'appian-way',
}

/**
 * Route flexibility — visual day story (no horizontal discovery required).
 */
export default function RebuildRouteFlex() {
  const copy = REBUILD_ROUTE
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

        <ol className="cw-rb-route__story" aria-label="A flexible Rome day">
          {copy.story.map((step, index) => {
            const stopId = STORY_MEDIA[step.id]
            const photo = stopId ? getModernPosterUrl(stopId) : null
            return (
              <li key={step.id} className="cw-rb-route__story-step">
                {index > 0 ? (
                  <span className="cw-rb-route__story-arrow" aria-hidden="true">
                    ↓
                  </span>
                ) : null}
                <div className="cw-rb-route__story-card">
                  {photo ? (
                    <figure className="cw-rb-route__story-media">
                      <img
                        src={photo}
                        alt=""
                        width={160}
                        height={120}
                        loading="lazy"
                        decoding="async"
                      />
                    </figure>
                  ) : null}
                  <div>
                    <p className="cw-rb-route__story-label">{step.label}</p>
                    <p className="cw-rb-route__story-detail">{step.detail}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

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
