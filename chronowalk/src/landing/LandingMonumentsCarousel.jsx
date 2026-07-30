import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { LANDING_CONTENT } from './landingData.js'
import { getLandingRouteJourney } from './landingMonuments.js'
import {
  observeLandingSectionOnce,
  trackLandingRouteExpand,
  trackLandingRouteView,
} from './landingAnalytics.js'

/**
 * Act II · continuous Rome route (not a monument catalog).
 * Desktop: horizontal editorial timeline · Mobile: vertical route spine.
 * Preview shows landmark milestones; expand reveals every stop by chapter.
 */
export default function LandingMonumentsCarousel() {
  const section = LANDING_CONTENT.monuments
  const { stops, chapters, previewStops, previewSegments, totalStops } = getLandingRouteJourney()
  const [expanded, setExpanded] = useState(false)
  const listId = useId()
  const stopRefs = useRef([])
  const sectionRef = useRef(null)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  const visibleStops = expanded
    ? chapters.flatMap((chapter) => chapter.stops)
    : previewStops

  function focusStop(index) {
    const node = stopRefs.current[index]
    if (node) node.focus()
  }

  function handleStopKeyDown(event, index) {
    const last = visibleStops.length - 1
    if (last < 0) return

    let next = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = Math.min(index + 1, last)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = Math.max(index - 1, 0)
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = last
    }

    if (next === null || next === index) return
    event.preventDefault()

    stopRefs.current.forEach((el, i) => {
      if (el) el.tabIndex = i === next ? 0 : -1
    })
    focusStop(next)
  }

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className={`cw-v2-section cw-v2-monuments${expanded ? ' cw-v2-monuments--expanded' : ''}`}
      aria-labelledby={`${section.id}-heading`}
    >
      <div className="cw-v2-wrap">
        <header className="cw-v2-section__header">
          <p className="cw-v2-eyebrow">{section.eyebrow}</p>
          <h2 id={`${section.id}-heading`} className="cw-v2-section__title cw-v2-monuments__title-block">
            {section.headline}
          </h2>
          {section.subheadline ? (
            <p className="cw-v2-section__lead">{section.subheadline}</p>
          ) : null}
        </header>

        <div className="cw-v2-monuments__journey">
          {expanded ? (
            <div
              id={listId}
              className="cw-v2-monuments__chapters"
              role="list"
              aria-label={section.fullAriaLabel}
            >
              {chapters.map((chapter) => (
                <div key={chapter.id} className="cw-v2-monuments__chapter" role="listitem">
                  <h3 className="cw-v2-monuments__chapter-label">{chapter.label}</h3>
                  <ol className="cw-v2-monuments__track" aria-label={chapter.label}>
                    {chapter.stops.map((stop) => {
                      const index = visibleStops.findIndex((item) => item.id === stop.id)
                      return (
                        <RouteStop
                          key={stop.id}
                          stop={stop}
                          index={index}
                          refCallback={(el) => {
                            stopRefs.current[index] = el
                          }}
                          onKeyDown={handleStopKeyDown}
                          showPhoto={stop.featured}
                        />
                      )
                    })}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <ol
              id={listId}
              className="cw-v2-monuments__track cw-v2-monuments__track--preview"
              aria-label={section.previewAriaLabel}
            >
              {previewSegments.map(({ stop, skippedAfter }, index) => (
                <Fragment key={stop.id}>
                  <RouteStop
                    stop={stop}
                    index={index}
                    refCallback={(el) => {
                      stopRefs.current[index] = el
                    }}
                    onKeyDown={handleStopKeyDown}
                    showPhoto
                  />
                  {skippedAfter > 0 ? (
                    <li
                      className="cw-v2-monuments__skip"
                      aria-hidden="true"
                      title={`${skippedAfter} more stop${skippedAfter === 1 ? '' : 's'} on the full route`}
                    >
                      <span className="cw-v2-monuments__skip-track">
                        {Array.from({ length: skippedAfter }, (_, dotIndex) => (
                          <span key={dotIndex} className="cw-v2-monuments__skip-dot" />
                        ))}
                      </span>
                    </li>
                  ) : null}
                </Fragment>
              ))}
            </ol>
          )}

          {/* Ordered trail keeps every stop name in the DOM for SEO / continuity. */}
          <p className="cw-v2-monuments__trail">
            <span className="cw-v2-monuments__trail-route">{section.routeName}</span>
            <span className="cw-v2-monuments__trail-sep" aria-hidden="true">
              ·
            </span>
            <span className="cw-v2-monuments__trail-count">{totalStops} stops</span>
            <span className="cw-v2-monuments__trail-sep" aria-hidden="true">
              ·
            </span>
            {stops.map((stop, index) => (
              <span key={stop.id} className="cw-v2-monuments__trail-stop">
                {index > 0 ? (
                  <span className="cw-v2-monuments__trail-dot" aria-hidden="true">
                    {' '}
                    ·{' '}
                  </span>
                ) : null}
                {stop.title}
              </span>
            ))}
          </p>

          <div className="cw-v2-monuments__disclose">
            <button
              type="button"
              className="cw-v2-monuments__toggle"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => {
                stopRefs.current = []
                setExpanded((value) => {
                  const next = !value
                  trackLandingRouteExpand({ expanded: next })
                  return next
                })
              }}
            >
              {expanded ? section.collapseLabel : section.expandLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function RouteStop({ stop, index, refCallback, onKeyDown, showPhoto }) {
  return (
    <li
      className={`cw-v2-monuments__stop${showPhoto ? ' cw-v2-monuments__stop--landmark' : ''}`}
    >
      <div
        className="cw-v2-monuments__stop-hit"
        ref={refCallback}
        tabIndex={index === 0 ? 0 : -1}
        aria-label={`Stop ${stop.index}: ${stop.title}`}
        onKeyDown={(event) => onKeyDown(event, index)}
      >
        <span className="cw-v2-monuments__node" aria-hidden="true">
          <span className="cw-v2-monuments__node-index">{stop.index}</span>
        </span>
        {showPhoto ? (
          <span className="cw-v2-monuments__photo-wrap">
            <img
              src={stop.photo}
              alt=""
              width={160}
              height={160}
              className="cw-v2-monuments__photo"
              loading="lazy"
              decoding="async"
            />
          </span>
        ) : null}
        <span className="cw-v2-monuments__stop-title">{stop.title}</span>
      </div>
    </li>
  )
}
