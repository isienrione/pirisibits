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
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('hides reviews by default until real quotes ship', () => {
    expect(getLandingReviewsVisible()).toBe(false)
  })

  it('persists the reviews toggle in localStorage', () => {
    setLandingReviewsVisible(false)
    expect(window.localStorage.getItem(LANDING_REVIEWS_KEY)).toBe('0')
    expect(getLandingReviewsVisible()).toBe(false)
    setLandingReviewsVisible(true)
    expect(getLandingReviewsVisible()).toBe(true)
  })

  it('honors ?landing_reviews=1 and sticky-writes storage', () => {
    window.history.replaceState({}, '', '/?landing_reviews=1&landing_dev=1')
    syncLandingReviewFlagsFromUrl()
    expect(getLandingReviewsVisible()).toBe(true)
    expect(getLandingDevToolsVisible()).toBe(true)
    expect(window.localStorage.getItem(LANDING_DEV_KEY)).toBe('1')
  })
})
