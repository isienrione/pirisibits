/**
 * ChronoWalk product analytics — sole `posthog.capture` call site.
 * Landing funnel + shared base props (attribution, scroll, device).
 */
import posthog from 'posthog-js'
import { getAbVariantCents } from './config.js'
import { peekLandingExpHero, ensureLandingExpHero } from '../landing/landingExperiments.js'
import { resolveLandingIntent } from '../landing/landingIntent.js'
import {
  attributionToProps,
  captureAttribution,
  getAttribution,
  type AttributionRecord,
  __resetAttributionForTests,
} from './attribution.ts'
import {
  trackGoogleAdsCheckoutOpened,
  trackGoogleAdsPurchaseConversion,
} from './googleAds.js'
import { recordDebugEvent } from './debugEventLog.js'

export type CtaLocation =
  | 'hero'
  | 'route_card'
  | 'pricing'
  | 'sticky_bar'
  | 'footer'
  | 'guarantee'
  | 'preview'

export type FunnelEventName =
  | 'pricing_view'
  | 'tier_card_view'
  | 'tier_card_click'
  | 'cta_click'
  | 'checkout_opened'
  | 'checkout_closed'
  | 'checkout_completed'
  | 'checkout_error'
  | 'checkout_payment_failed'
  | 'checkout_open_failed'
  | 'checkout_customer_created'
  | 'checkout_items_updated'
  | 'paddle_script_failed'

export type AudioDiagnosticEventName =
  | 'audio_play_attempt'
  | 'audio_play_blocked'
  | 'audio_interrupted'
  | 'audio_background_drop'
  | 'wake_lock_acquired'
  | 'wake_lock_failed'
  | 'wake_lock_released_unexpectedly'
  | 'audio_completed'

export type EngagementEventName =
  | 'preview_play_click'
  | 'preview_audio_progress'
  | 'faq_open'
  | 'sample_image_interact'
  | 'engaged_heartbeat'
  | 'deep_engagement'
  | 'bounced_fast'
  | AudioDiagnosticEventName

export type ExitEventName = 'scroll_milestone' | 'exit_intent'

/** Typed funnel / engagement / exit events. Legacy string events still accepted. */
export type AnalyticsEventName =
  | FunnelEventName
  | EngagementEventName
  | ExitEventName
  | (string & {})

export type AnalyticsProps = {
  route_slug?: string
  tier?: string
  price_eur?: number
  cta_location?: CtaLocation
  transaction_id?: string
  error_message?: string
  seconds_in_checkout?: number
  pct?: number
  question_text?: string
  stop_name?: string
  max_scroll_pct?: number
  seconds_on_page?: number
  deepest_funnel_step_reached?: string
  longest_dwell_section?: string
  stop_id?: string
  error_name?: string
  event_type?: string
  current_time_s?: number
  expected_time_s?: number
  actual_time_s?: number
  gap_s?: number
  duration_listened_s?: number
  pct_complete?: number
  [key: string]: unknown
}

const FUNNEL_RANK: Record<string, number> = {
  none: 0,
  landing: 1,
  pricing_view: 2,
  tier_card_view: 3,
  tier_card_click: 4,
  cta_click: 4,
  checkout_opened: 5,
  checkout_completed: 6,
}

const SCROLL_MILESTONES = [25, 50, 75, 90, 100] as const
const PREVIEW_PROGRESS_MARKS = [25, 50, 75, 100] as const
/** Engaged-time heartbeats (visible tab only). */
const HEARTBEAT_MARKS = [10, 30, 60, 120, 300] as const
const DEEP_ENGAGEMENT_SECONDS = 60
const DEEP_ENGAGEMENT_SCROLL_PCT = 50
const BOUNCE_MAX_SECONDS = 15
const BOUNCE_MAX_SCROLL_PCT = 25

/** Primary landing section ids (+ acts) for dwell tracking. */
const LANDING_SECTION_IDS = [
  'top',
  'how-it-works',
  'monuments',
  'who-its-for',
  'pricing',
  'shared-experience',
  'get-app',
  'faq',
  'trust',
  'act-open',
  'act-walk',
  'act-choose',
] as const

let landingStartedAt =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
let maxScrollPct = 0
let deepestFunnelStep = 'none'
let scrollListenersInstalled = false
let exitListenersInstalled = false
let engagementListenersInstalled = false
let analyticsReady = false

/** Accumulated ms while the tab was visible (excludes hidden intervals). */
let engagedMsAccumulated = 0
/** Date.now() when the current visible interval started; null when paused/hidden. */
let engagedVisibleSince: number | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let sectionObserver: IntersectionObserver | null = null
const sectionDwellMs = new Map<string, number>()
const sectionVisibleSince = new Map<string, number>()
const sectionIntersecting = new Set<string>()

const onceKeys = new Set<string>()
const previewProgressFired = new Set<number>()
let sampleInteractFired = false

let lastCtaLocation: CtaLocation | null = null

function stopHeartbeatTicker() {
  if (heartbeatTimer != null) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

function disconnectSectionObserver() {
  if (sectionObserver) {
    sectionObserver.disconnect()
    sectionObserver = null
  }
  sectionDwellMs.clear()
  sectionVisibleSince.clear()
  sectionIntersecting.clear()
}

/** @internal */
export function __resetAnalyticsSessionForTests() {
  onceKeys.clear()
  previewProgressFired.clear()
  sampleInteractFired = false
  maxScrollPct = 0
  deepestFunnelStep = 'none'
  scrollListenersInstalled = false
  exitListenersInstalled = false
  engagementListenersInstalled = false
  engagedMsAccumulated = 0
  engagedVisibleSince = null
  stopHeartbeatTicker()
  disconnectSectionObserver()
  lastCtaLocation = null
  landingStartedAt =
    typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now()
  __resetAttributionForTests()
}

export function markAnalyticsReady(ready = true) {
  analyticsReady = ready
}

export function isProductAnalyticsReady() {
  return analyticsReady
}

/** Live engagement figures for the hidden DebugPanel. */
export function getEngagementDebugSnapshot() {
  return {
    scroll_depth_pct: Math.round(maxScrollPct),
    max_scroll_pct: Math.round(maxScrollPct),
    seconds_on_page: secondsSinceLanding(),
    engaged_seconds: getEngagedSeconds(),
    deepest_funnel_step: deepestFunnelStep,
    analytics_ready: analyticsReady,
  }
}

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function secondsSinceLanding() {
  return Math.max(0, Math.round((nowMs() - landingStartedAt) / 1000))
}

function wallClockNow() {
  return Date.now()
}

/** Seconds the tab has been visible (heartbeats / bounce / deep engagement). */
function getEngagedSeconds() {
  let total = engagedMsAccumulated
  if (engagedVisibleSince != null) {
    total += wallClockNow() - engagedVisibleSince
  }
  return Math.max(0, Math.round(total / 1000))
}

function pauseSectionDwell() {
  const now = wallClockNow()
  for (const [id, since] of sectionVisibleSince) {
    sectionDwellMs.set(id, (sectionDwellMs.get(id) || 0) + (now - since))
  }
  sectionVisibleSince.clear()
}

function resumeSectionDwell() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  const now = wallClockNow()
  for (const id of sectionIntersecting) {
    if (!sectionVisibleSince.has(id)) {
      sectionVisibleSince.set(id, now)
    }
  }
}

function getLongestDwellSection(): string | null {
  const now = wallClockNow()
  let best: string | null = null
  let bestMs = 0
  const ids = new Set<string>([...sectionDwellMs.keys(), ...sectionVisibleSince.keys()])
  for (const id of ids) {
    let ms = sectionDwellMs.get(id) || 0
    const since = sectionVisibleSince.get(id)
    if (since != null) ms += now - since
    if (ms > bestMs) {
      bestMs = ms
      best = id
    }
  }
  return best
}

function maybeDeepEngagement() {
  const seconds = getEngagedSeconds()
  updateScrollDepth()
  if (
    seconds >= DEEP_ENGAGEMENT_SECONDS &&
    maxScrollPct >= DEEP_ENGAGEMENT_SCROLL_PCT &&
    once('deep_engagement')
  ) {
    track('deep_engagement', {
      seconds_on_page: seconds,
      max_scroll_pct: Math.round(maxScrollPct),
    })
  }
}

function tickEngagementHeartbeat() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  const seconds = getEngagedSeconds()
  updateScrollDepth()
  const maxScroll = Math.round(maxScrollPct)

  for (const mark of HEARTBEAT_MARKS) {
    if (seconds >= mark && once(`engaged_heartbeat:${mark}`)) {
      track('engaged_heartbeat', {
        seconds_on_page: mark,
        max_scroll_pct: maxScroll,
      })
    }
  }
  maybeDeepEngagement()
}

function startHeartbeatTicker() {
  if (heartbeatTimer != null) return
  heartbeatTimer = setInterval(tickEngagementHeartbeat, 1000)
  tickEngagementHeartbeat()
}

function pauseEngagedClock() {
  if (engagedVisibleSince != null) {
    engagedMsAccumulated += wallClockNow() - engagedVisibleSince
    engagedVisibleSince = null
  }
  stopHeartbeatTicker()
  pauseSectionDwell()
}

function resumeEngagedClock() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
  if (engagedVisibleSince != null) return
  engagedVisibleSince = wallClockNow()
  resumeSectionDwell()
  startHeartbeatTicker()
}

function installSectionDwellObserver() {
  if (typeof document === 'undefined' || typeof IntersectionObserver !== 'function') return
  if (sectionObserver) return

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const now = wallClockNow()
      const tabVisible = document.visibilityState !== 'hidden'
      for (const entry of entries) {
        const el = entry.target as HTMLElement
        const id = el.id || el.getAttribute('data-analytics-section') || ''
        if (!id) continue
        if (entry.isIntersecting) {
          sectionIntersecting.add(id)
          if (tabVisible && !sectionVisibleSince.has(id)) {
            sectionVisibleSince.set(id, now)
          }
        } else {
          sectionIntersecting.delete(id)
          const since = sectionVisibleSince.get(id)
          if (since != null) {
            sectionDwellMs.set(id, (sectionDwellMs.get(id) || 0) + (now - since))
            sectionVisibleSince.delete(id)
          }
        }
      }
    },
    { threshold: [0, 0.25, 0.5] },
  )

  const observed = new Set<Element>()
  for (const id of LANDING_SECTION_IDS) {
    const el = document.getElementById(id)
    if (el && !observed.has(el)) {
      sectionObserver.observe(el)
      observed.add(el)
    }
  }
  document.querySelectorAll('[data-analytics-section]').forEach((el) => {
    if (!observed.has(el)) {
      sectionObserver!.observe(el)
      observed.add(el)
    }
  })
}

function readScrollDepthPct() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0
  const doc = document.documentElement
  const body = document.body
  const scrollTop = window.scrollY || doc.scrollTop || body?.scrollTop || 0
  const viewport = window.innerHeight || doc.clientHeight || 0
  const height = Math.max(doc.scrollHeight, body?.scrollHeight || 0, viewport)
  const traversable = Math.max(1, height - viewport)
  return Math.min(100, Math.max(0, Math.round(((scrollTop + viewport * 0.01) / traversable) * 100)))
}

function updateScrollDepth() {
  const pct = readScrollDepthPct()
  if (pct > maxScrollPct) maxScrollPct = pct
  return maxScrollPct
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches)
  } catch {
    return false
  }
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function markFunnelStep(step: string) {
  const next = FUNNEL_RANK[step] ?? 0
  const current = FUNNEL_RANK[deepestFunnelStep] ?? 0
  if (next > current) deepestFunnelStep = step
}

export function centsToPriceEur(cents: number | null | undefined): number | undefined {
  if (cents == null || !Number.isFinite(cents)) return undefined
  return Math.round(Number(cents)) / 100
}

function buildBaseProps(extra: AnalyticsProps = {}): Record<string, unknown> {
  captureAttribution()
  updateScrollDepth()
  const exp =
    peekLandingExpHero() ??
    (typeof window !== 'undefined' && typeof ensureLandingExpHero === 'function'
      ? ensureLandingExpHero()
      : null)
  const attr = getAttribution()
  const props: Record<string, unknown> = {
    ab_variant: getAbVariantCents(),
    landing_exp_hero: exp,
    landing_intent: resolveLandingIntent(),
    ...attributionToProps(attr),
    seconds_since_landing: secondsSinceLanding(),
    scroll_depth_pct: Math.round(maxScrollPct),
    max_scroll_pct: Math.round(maxScrollPct),
    is_pwa: isStandalonePwa(),
    is_ios: isIosDevice(),
    ...extra,
  }
  // Drop undefined so PostHog stays tidy; keep null attribution keys.
  for (const key of Object.keys(props)) {
    if (props[key] === undefined) delete props[key]
  }
  return props
}

/**
 * Typed capture helper. Never call `posthog.capture` outside this module.
 * Returns false when PostHog is not ready or capture throws.
 */
export function track(event: AnalyticsEventName, props: AnalyticsProps = {}): boolean {
  if (!analyticsReady || typeof window === 'undefined') return false
  try {
    if (event in FUNNEL_RANK) markFunnelStep(String(event))
    const payload = buildBaseProps(props)
    posthog.capture(String(event), payload)
    try {
      recordDebugEvent(String(event), payload)
    } catch {
      /* debug log must never break capture */
    }
    // Playwright / DebugPanel: mirror into window.__cwPhEvents when present.
    try {
      const sink = (window as Window & { __cwPhEvents?: unknown }).__cwPhEvents
      if (Array.isArray(sink)) {
        sink.push({
          event: String(event),
          properties: payload,
          ts: Date.now(),
        })
      }
    } catch {
      /* ignore */
    }
    return true
  } catch {
    return false
  }
}

function once(key: string): boolean {
  if (onceKeys.has(key)) return false
  onceKeys.add(key)
  return true
}

/** Pricing section 50% visible for 1s (once per load). */
export function trackPricingView(): boolean {
  if (!once('pricing_view')) return false
  return track('pricing_view')
}

/** Tier card 50% visible for 1s (once per tier per load). */
export function trackTierCardView(tier: string): boolean {
  if (!tier || !once(`tier_card_view:${tier}`)) return false
  return track('tier_card_view', { tier })
}

export function trackTierCardClick(tier: string, priceEur?: number): boolean {
  return track('tier_card_click', {
    tier,
    ...(priceEur != null ? { price_eur: priceEur } : {}),
  })
}

export function trackCtaClick(opts: {
  tier?: string
  priceEur?: number
  ctaLocation: CtaLocation
}): boolean {
  lastCtaLocation = opts.ctaLocation
  return track('cta_click', {
    cta_location: opts.ctaLocation,
    ...(opts.tier ? { tier: opts.tier } : {}),
    ...(opts.priceEur != null ? { price_eur: opts.priceEur } : {}),
  })
}

/** Last buy/start CTA placement — forwarded into Paddle customData. */
export function getLastCtaLocation(): CtaLocation | null {
  return lastCtaLocation
}

/** UTM / click-id attribution — first-touch via {@link getAttribution}. */
export function getCapturedAttribution(): AttributionRecord {
  captureAttribution()
  return getAttribution() ?? {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    gclid: null,
    gbraid: null,
    wbraid: null,
    msclkid: null,
    ttclid: null,
    fbclid: null,
    landing_page_url: null,
    document_referrer: null,
    captured_at: 0,
  }
}

/**
 * PostHog identity for Paddle customData (never throws).
 * Uses posthog.get_distinct_id / get_session_id when available.
 */
export function getPostHogCheckoutIdentity(): {
  ph_distinct_id: string | null
  ph_session_id: string | null
} {
  try {
    const distinct =
      typeof posthog.get_distinct_id === 'function' ? posthog.get_distinct_id() : null
    const session =
      typeof posthog.get_session_id === 'function' ? posthog.get_session_id() : null
    return {
      ph_distinct_id: distinct != null && String(distinct) ? String(distinct) : null,
      ph_session_id: session != null && String(session) ? String(session) : null,
    }
  } catch {
    return { ph_distinct_id: null, ph_session_id: null }
  }
}

export function trackCheckoutOpened(opts: {
  tier: string
  priceEur?: number
  promotion?: string
  base_price_eur?: number
  discount_amount_eur?: number
  effective_price_eur?: number
  [key: string]: unknown
}): boolean {
  const {
    tier,
    priceEur,
    promotion,
    base_price_eur: basePriceEur,
    discount_amount_eur: discountAmountEur,
    effective_price_eur: effectivePriceEur,
    ...rest
  } = opts
  const ok = track('checkout_opened', {
    tier,
    ...(priceEur != null ? { price_eur: priceEur } : {}),
    ...(promotion ? { promotion } : {}),
    ...(basePriceEur != null ? { base_price_eur: basePriceEur } : {}),
    ...(discountAmountEur != null ? { discount_amount_eur: discountAmountEur } : {}),
    ...(effectivePriceEur != null ? { effective_price_eur: effectivePriceEur } : {}),
    ...rest,
  })
  // Secondary Google Ads micro-conversion (observation / optimize early).
  // Prefer explicit effective promotional value when present.
  try {
    trackGoogleAdsCheckoutOpened({
      tier,
      value: effectivePriceEur ?? priceEur,
      currency: 'EUR',
    })
  } catch {
    /* never block checkout analytics */
  }
  return ok
}

export function trackCheckoutClosed(opts: { tier: string; secondsInCheckout: number }): boolean {
  return track('checkout_closed', {
    tier: opts.tier,
    seconds_in_checkout: Math.max(0, Math.round(opts.secondsInCheckout)),
  })
}

export function trackCheckoutCompleted(opts: {
  tier: string
  priceEur?: number
  transactionId?: string
  currency?: string
  email?: string | null
  promotion?: string
  base_price_eur?: number
  discount_amount_eur?: number
  effective_price_eur?: number
  [key: string]: unknown
}): boolean {
  const {
    tier,
    priceEur,
    transactionId,
    currency,
    email,
    promotion,
    base_price_eur: basePriceEur,
    discount_amount_eur: discountAmountEur,
    effective_price_eur: effectivePriceEur,
    ...rest
  } = opts
  const ok = track('checkout_completed', {
    tier,
    ...(priceEur != null ? { price_eur: priceEur } : {}),
    ...(transactionId ? { transaction_id: transactionId } : {}),
    ...(promotion ? { promotion } : {}),
    ...(basePriceEur != null ? { base_price_eur: basePriceEur } : {}),
    ...(discountAmountEur != null ? { discount_amount_eur: discountAmountEur } : {}),
    ...(effectivePriceEur != null ? { effective_price_eur: effectivePriceEur } : {}),
    ...rest,
  })
  // Primary Google Ads purchase conversion + enhanced conversions (hashed email).
  // Prefer effective promotional value so Ads is not told the base list price.
  void trackGoogleAdsPurchaseConversion({
    value: effectivePriceEur ?? priceEur,
    currency: currency || 'EUR',
    transactionId,
    email,
    tier,
  }).catch(() => {})
  return ok
}

export function trackCheckoutError(opts: { tier?: string; errorMessage: string }): boolean {
  return track('checkout_error', {
    error_message: opts.errorMessage,
    ...(opts.tier ? { tier: opts.tier } : {}),
  })
}

export function trackCheckoutPaymentFailed(opts: {
  tier?: string
  errorMessage?: string
}): boolean {
  return track('checkout_payment_failed', {
    ...(opts.tier ? { tier: opts.tier } : {}),
    ...(opts.errorMessage ? { error_message: opts.errorMessage } : {}),
  })
}

export function trackCheckoutOpenFailed(opts: {
  tier?: string
  errorMessage: string
}): boolean {
  return track('checkout_open_failed', {
    error_message: opts.errorMessage,
    ...(opts.tier ? { tier: opts.tier } : {}),
  })
}

export function trackCheckoutCustomerCreated(opts: { tier?: string } = {}): boolean {
  return track('checkout_customer_created', {
    ...(opts.tier ? { tier: opts.tier } : {}),
  })
}

export function trackCheckoutItemsUpdated(opts: { tier?: string } = {}): boolean {
  return track('checkout_items_updated', {
    ...(opts.tier ? { tier: opts.tier } : {}),
  })
}

export function trackPaddleScriptFailed(opts: { reason: string } = { reason: 'unknown' }): boolean {
  if (!once(`paddle_script_failed:${opts.reason}`)) return false
  return track('paddle_script_failed', { error_message: opts.reason })
}

export function trackPreviewPlayClick(routeSlug = 'pantheon'): boolean {
  return track('preview_play_click', { route_slug: routeSlug })
}

export function trackPreviewAudioProgress(pct: number, routeSlug = 'pantheon'): boolean {
  const mark = PREVIEW_PROGRESS_MARKS.find((m) => m === pct)
  if (mark == null || previewProgressFired.has(mark)) return false
  previewProgressFired.add(mark)
  return track('preview_audio_progress', { pct: mark, route_slug: routeSlug })
}

/** Call from timeupdate with currentTime/duration; fires 25/50/75/100 once each. */
export function notePreviewAudioTime(currentTime: number, duration: number, routeSlug = 'pantheon') {
  if (!duration || duration <= 0) return
  const ratio = currentTime / duration
  for (const mark of PREVIEW_PROGRESS_MARKS) {
    if (ratio * 100 >= mark) trackPreviewAudioProgress(mark, routeSlug)
  }
}

export function trackFaqOpen(questionText: string): boolean {
  return track('faq_open', { question_text: questionText })
}

export function trackSampleImageInteract(stopName: string): boolean {
  if (sampleInteractFired) return false
  sampleInteractFired = true
  return track('sample_image_interact', { stop_name: stopName })
}

export function trackAudioPlayAttempt(opts: {
  stopId: string
  routeSlug?: string | null
}): boolean {
  return track('audio_play_attempt', {
    stop_id: opts.stopId,
    ...(opts.routeSlug ? { route_slug: opts.routeSlug } : {}),
    is_pwa: isStandalonePwa(),
    is_ios: isIosDevice(),
  })
}

export function trackAudioPlayBlocked(opts: {
  stopId?: string | null
  errorName?: string | null
}): boolean {
  return track('audio_play_blocked', {
    ...(opts.stopId ? { stop_id: opts.stopId } : {}),
    ...(opts.errorName ? { error_name: opts.errorName } : {}),
  })
}

export function trackAudioInterrupted(opts: {
  stopId?: string | null
  eventType: string
  currentTimeS?: number
}): boolean {
  return track('audio_interrupted', {
    ...(opts.stopId ? { stop_id: opts.stopId } : {}),
    event_type: opts.eventType,
    ...(opts.currentTimeS != null
      ? { current_time_s: Math.round(opts.currentTimeS * 10) / 10 }
      : {}),
  })
}

export function trackAudioBackgroundDrop(opts: {
  stopId?: string | null
  expectedTimeS: number
  actualTimeS: number
  gapS: number
}): boolean {
  return track('audio_background_drop', {
    ...(opts.stopId ? { stop_id: opts.stopId } : {}),
    expected_time_s: Math.round(opts.expectedTimeS * 10) / 10,
    actual_time_s: Math.round(opts.actualTimeS * 10) / 10,
    gap_s: Math.round(opts.gapS * 10) / 10,
  })
}

export function trackWakeLockAcquired(): boolean {
  return track('wake_lock_acquired')
}

export function trackWakeLockFailed(opts: { errorName?: string | null } = {}): boolean {
  return track('wake_lock_failed', {
    ...(opts.errorName ? { error_name: opts.errorName } : {}),
  })
}

export function trackWakeLockReleasedUnexpectedly(): boolean {
  return track('wake_lock_released_unexpectedly')
}

export function trackAudioCompleted(opts: {
  stopId?: string | null
  durationListenedS: number
  pctComplete: number
}): boolean {
  return track('audio_completed', {
    ...(opts.stopId ? { stop_id: opts.stopId } : {}),
    duration_listened_s: Math.round(opts.durationListenedS),
    pct_complete: Math.max(0, Math.min(100, Math.round(opts.pctComplete))),
  })
}

function fireScrollMilestones() {
  const depth = updateScrollDepth()
  for (const pct of SCROLL_MILESTONES) {
    if (depth >= pct && once(`scroll_milestone:${pct}`)) {
      track('scroll_milestone', { pct })
    }
  }
  maybeDeepEngagement()
}

function fireExitIntent() {
  if (!once('exit_intent')) return
  updateScrollDepth()
  const longest = getLongestDwellSection()
  track('exit_intent', {
    max_scroll_pct: Math.round(maxScrollPct),
    seconds_on_page: secondsSinceLanding(),
    deepest_funnel_step_reached: deepestFunnelStep,
    ...(longest ? { longest_dwell_section: longest } : {}),
  })
}

function fireBouncedFast() {
  const seconds = getEngagedSeconds()
  updateScrollDepth()
  if (seconds >= BOUNCE_MAX_SECONDS || maxScrollPct >= BOUNCE_MAX_SCROLL_PCT) return
  if (!once('bounced_fast')) return
  track('bounced_fast', {
    seconds_on_page: seconds,
    max_scroll_pct: Math.round(maxScrollPct),
  })
}

/**
 * True when enough of the element is on screen to count as a dwell.
 * Tall sections (pricing) often cannot reach intersectionRatio ≥ 0.5 on mobile
 * because the element is taller than the viewport — also accept filling
 * `threshold` of the viewport height.
 */
function isDwellVisible(
  entry: IntersectionObserverEntry,
  threshold: number,
): boolean {
  if (!entry?.isIntersecting) return false
  if (entry.intersectionRatio >= threshold) return true
  const viewportH =
    entry.rootBounds?.height ||
    (typeof window !== 'undefined' ? window.innerHeight : 0)
  if (viewportH <= 0) return false
  return entry.intersectionRect.height / viewportH >= threshold
}

/**
 * Observe element until ≥ threshold visible for dwellMs, then fire once.
 * Fast scrolls past do not count.
 * For elements taller than the viewport, “visible” means filling ≥ threshold
 * of the viewport (not ≥ threshold of the element’s own height).
 */
export function observeDwellOnce(
  element: Element | null | undefined,
  onVisible: () => void,
  { threshold = 0.5, dwellMs = 1000 }: { threshold?: number; dwellMs?: number } = {},
): () => void {
  if (!element || typeof IntersectionObserver !== 'function') return () => {}

  let done = false
  let timer: ReturnType<typeof setTimeout> | null = null

  const clearTimer = () => {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  }

  const io = new IntersectionObserver(
    ([entry]) => {
      if (done || !entry) return
      if (isDwellVisible(entry, threshold)) {
        if (timer != null) return
        timer = setTimeout(() => {
          if (done) return
          done = true
          clearTimer()
          io.disconnect()
          onVisible()
        }, dwellMs)
      } else {
        clearTimer()
      }
    },
    { threshold: [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1] },
  )

  io.observe(element)
  return () => {
    done = true
    clearTimer()
    io.disconnect()
  }
}


export function trackJsError(opts: {
  message: string
  source?: string | null
  lineno?: number | null
  stackHead?: string | null
}): boolean {
  return track('js_error', {
    message: opts.message,
    ...(opts.source ? { source: opts.source } : {}),
    ...(opts.lineno != null ? { lineno: opts.lineno } : {}),
    ...(opts.stackHead ? { stack_head: opts.stackHead } : {}),
  })
}

export function trackReactErrorBoundary(opts: {
  componentStackHead?: string | null
  errorMessage?: string | null
}): boolean {
  return track('react_error_boundary', {
    ...(opts.componentStackHead ? { component_stack_head: opts.componentStackHead } : {}),
    ...(opts.errorMessage ? { error_message: opts.errorMessage } : {}),
  })
}

export function trackAssetLoadFailed(opts: {
  assetUrl?: string | null
  assetType: 'image' | 'audio' | 'map' | string
}): boolean {
  return track('asset_load_failed', {
    asset_type: opts.assetType,
    ...(opts.assetUrl ? { asset_url: opts.assetUrl } : {}),
  })
}

export function trackMapboxInitFailed(opts: {
  reason: string
  detail?: string | null
}): boolean {
  if (!once(`mapbox_init_failed:${opts.reason}`)) return false
  return track('asset_load_failed', {
    asset_type: 'map',
    asset_url: 'mapbox-gl',
    error_message: opts.reason,
    ...(opts.detail ? { detail: opts.detail } : {}),
  })
}

export function trackSlowPage(opts: { lcpMs: number }): boolean {
  if (!once('slow_page')) return false
  return track('slow_page', { lcp_ms: Math.round(opts.lcpMs) })
}

/** Debounced scroll milestones + exit intent + engagement depth. Safe to call multiple times. */
export function installLandingPageListeners(): () => void {
  if (typeof window === 'undefined') return () => {}

  captureAttribution()
  markFunnelStep('landing')

  let scrollTimer: ReturnType<typeof setTimeout> | null = null
  const onScroll = () => {
    if (scrollTimer != null) clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      scrollTimer = null
      fireScrollMilestones()
    }, 150)
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      pauseEngagedClock()
      fireExitIntent()
    } else {
      resumeEngagedClock()
    }
  }

  const onPageHide = () => {
    pauseEngagedClock()
    fireBouncedFast()
    fireExitIntent()
  }

  if (!scrollListenersInstalled) {
    scrollListenersInstalled = true
    window.addEventListener('scroll', onScroll, { passive: true })
    fireScrollMilestones()
  }

  if (!exitListenersInstalled) {
    exitListenersInstalled = true
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', onPageHide)
  }

  if (!engagementListenersInstalled) {
    engagementListenersInstalled = true
    installSectionDwellObserver()
    resumeEngagedClock()
  }

  return () => {
    if (scrollTimer != null) clearTimeout(scrollTimer)
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
    pauseEngagedClock()
    disconnectSectionObserver()
    scrollListenersInstalled = false
    exitListenersInstalled = false
    engagementListenersInstalled = false
  }
}
