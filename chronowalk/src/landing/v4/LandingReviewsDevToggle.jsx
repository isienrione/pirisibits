import { useEffect, useState } from 'react'
import {
  getLandingDevToolsVisible,
  getLandingReviewsVisible,
  setLandingReviewsVisible,
  syncLandingReviewFlagsFromUrl,
} from '../landingReviewsVisibility.js'

/**
 * Floating testing control: show/hide the hero reviews capsule.
 * Visible in Vite DEV, or with ?landing_dev=1 (sticky via localStorage).
 */
export default function LandingReviewsDevToggle() {
  const [toolsVisible, setToolsVisible] = useState(false)
  const [reviewsVisible, setReviewsVisible] = useState(false)

  useEffect(() => {
    syncLandingReviewFlagsFromUrl()
    setToolsVisible(getLandingDevToolsVisible())
    setReviewsVisible(getLandingReviewsVisible())

    const onChange = (event) => {
      if (typeof event?.detail?.visible === 'boolean') {
        setReviewsVisible(event.detail.visible)
      } else {
        setReviewsVisible(getLandingReviewsVisible())
      }
    }
    window.addEventListener('cw-landing-reviews-change', onChange)
    return () => window.removeEventListener('cw-landing-reviews-change', onChange)
  }, [])

  if (!toolsVisible) return null

  return (
    <div className="cw-v4-dev-toggle" role="group" aria-label="Landing testing controls">
      <p className="cw-v4-dev-toggle__label">Testing</p>
      <label className="cw-v4-dev-toggle__row">
        <input
          type="checkbox"
          checked={reviewsVisible}
          onChange={(event) => {
            const next = event.target.checked
            setLandingReviewsVisible(next)
            setReviewsVisible(next)
          }}
        />
        <span>Show hero reviews</span>
      </label>
      <p className="cw-v4-dev-toggle__hint">
        Or use <code>?landing_reviews=1</code> / <code>?landing_dev=1</code>
      </p>
    </div>
  )
}
