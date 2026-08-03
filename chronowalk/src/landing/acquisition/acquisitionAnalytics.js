/**
 * Acquisition-page analytics (PostHog via track + optional gtag mirror).
 * Distinct from homepage landingAnalytics once-flags.
 */

import { isAnalyticsReady, track } from '../../lib/track.js'
import { ensureGtagStub } from '../../lib/googleAds.js'

/** Session-level dedupe for page views (avoids Strict Mode double-fire). */
const viewedPages = new Set()

/** @internal */
export function resetAcquisitionAnalyticsForTests() {
  viewedPages.clear()
}

function viewKey(landingPageType) {
  if (typeof window === 'undefined') return landingPageType
  return `${landingPageType}:${window.location.pathname}${window.location.search}`
}

function pageProps(landingPageType, extra = {}) {
  const path =
    typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : undefined
  return {
    source: 'acquisition',
    landing_page_type: landingPageType,
    path,
    ...extra,
  }
}

/** Mirror custom events to gtag when present (Google Ads / linked GA). */
function mirrorGtag(eventName, props) {
  if (typeof window === 'undefined') return
  try {
    const gtag = ensureGtagStub()
    gtag('event', eventName, {
      landing_page_type: props.landing_page_type,
      path: props.path,
      ...Object.fromEntries(
        Object.entries(props).filter(
          ([key, value]) =>
            key !== 'landing_page_type' &&
            key !== 'path' &&
            (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
        ),
      ),
    })
  } catch {
    /* gtag must never break UX */
  }
}

function emit(eventName, landingPageType, extra = {}) {
  if (!isAnalyticsReady()) return false
  const props = pageProps(landingPageType, extra)
  track(eventName, props)
  mirrorGtag(eventName, props)
  return true
}

export function trackAcquisitionPageView(landingPageType) {
  const key = viewKey(landingPageType)
  if (viewedPages.has(key)) return false
  if (!isAnalyticsReady()) return false
  viewedPages.add(key)
  const eventName = `${landingPageType}_page_view`
  return emit(eventName, landingPageType)
}

export function trackFreePantheonStartClicked(section = 'hero') {
  return emit('free_pantheon_start_clicked', 'free_pantheon', { section })
}

export function trackFreePantheonFullTourClicked(section = 'upgrade') {
  return emit('free_pantheon_full_tour_clicked', 'free_pantheon', { section })
}

export function trackFreePantheonDemoInteracted(via = 'then_now') {
  return emit('free_pantheon_demo_interacted', 'free_pantheon', { via })
}

export function trackAncientRomeThenNowStarted(via = 'hold') {
  return emit('ancient_rome_then_now_started', 'ancient_rome', { via })
}

export function trackAncientRomeRouteClicked(tierId, section = 'choice') {
  return emit('ancient_rome_route_clicked', 'ancient_rome', {
    section,
    product_id: tierId,
    tier_id: tierId,
  })
}

export function trackAncientRomeFullTourClicked(section = 'hero') {
  return emit('ancient_rome_full_tour_clicked', 'ancient_rome', {
    section,
    product_id: 'rome-complete',
    tier_id: 'rome-complete',
  })
}

export function trackAncientRomeCheckoutStarted(tierId) {
  return emit('ancient_rome_checkout_started', 'ancient_rome', {
    product_id: tierId,
    tier_id: tierId,
  })
}

export function trackHowItWorksDemoStarted() {
  return emit('how_it_works_demo_started', 'how_it_works')
}

export function trackHowItWorksFreeClicked(section = 'hero') {
  return emit('how_it_works_free_clicked', 'how_it_works', { section })
}

export function trackHowItWorksPaidClicked(section = 'final') {
  return emit('how_it_works_paid_clicked', 'how_it_works', {
    section,
    product_id: 'rome-complete',
    tier_id: 'rome-complete',
  })
}
