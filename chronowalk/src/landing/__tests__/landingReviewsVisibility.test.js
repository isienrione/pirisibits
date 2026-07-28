import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import {
  LANDING_REVIEWS_KEY,
  LANDING_DEV_KEY,
  getLandingReviewsVisible,
  setLandingReviewsVisible,
  getLandingDevToolsVisible,
  syncLandingReviewFlagsFromUrl,
} from '../landingReviewsVisibility.js'

describe('landingReviewsVisibility', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/landing')
  })

  afterEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('hides reviews by default', () => {
    expect(getLandingReviewsVisible()).toBe(false)
  })

  it('persists the reviews toggle in localStorage', () => {
    setLandingReviewsVisible(true)
    expect(window.localStorage.getItem(LANDING_REVIEWS_KEY)).toBe('1')
    expect(getLandingReviewsVisible()).toBe(true)
    setLandingReviewsVisible(false)
    expect(getLandingReviewsVisible()).toBe(false)
  })

  it('honors ?landing_reviews=1 and sticky-writes storage', () => {
    window.history.replaceState({}, '', '/landing?landing_reviews=1&landing_dev=1')
    syncLandingReviewFlagsFromUrl()
    expect(getLandingReviewsVisible()).toBe(true)
    expect(getLandingDevToolsVisible()).toBe(true)
    expect(window.localStorage.getItem(LANDING_DEV_KEY)).toBe('1')
  })
})
