import { useEffect, useRef } from 'react'
import { LANDING_CONTENT } from '../landingData.js'
import { observeLandingSectionOnce, trackLandingRouteView } from '../landingAnalytics.js'
import LandingProductSequentialDemo from './LandingProductSequentialDemo.jsx'

/**
 * Landing “How does ChronoWalk work?” section.
 * Sequential phone + copy chapters (same pattern as /how-it-works) — normal scroll, no sticky scrub.
 */
export default function LandingProductDemo({
  section = LANDING_CONTENT['product-demo'],
}) {
  const sectionRef = useRef(null)

  useEffect(() => observeLandingSectionOnce(sectionRef.current, () => trackLandingRouteView()), [])

  return (
    <section
      ref={sectionRef}
      id={section.id}
      className="cw-v4-demo"
      aria-labelledby="cw-v4-demo-heading"
    >
      <div className="cw-v4-demo__intro">
        <p className="cw-v4-eyebrow">{section.eyebrow}</p>
        <h2 id="cw-v4-demo-heading" className="cw-v4-demo__title">
          {section.headline}
        </h2>
        {section.subheadline ? <p className="cw-v4-demo__lead">{section.subheadline}</p> : null}
      </div>

      <div className="cw-v4-wrap">
        <LandingProductSequentialDemo
          section={section}
          testId="landing-product-sequential-demo"
        />
      </div>
    </section>
  )
}
