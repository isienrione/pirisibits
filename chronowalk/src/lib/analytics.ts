/**
 * ChronoWalk product analytics — sole `posthog.capture` call site.
 * Landing funnel + shared base props (attribution, scroll, device).
 */
import posthog from 'posthog-js'
import { getAbVariantCents } from './config.js'
import { peekLandingExpHero, ensureLandingExpHero } from '../landing/landingExperiments.js'
import {
  attributionToProps,
  captureAttribution,
  getAttribution,
  type AttributionRecord,
  __resetAttributionForTests,
} from './attribution.ts'

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

export type EngagementEventName =
  | 'preview_play_click'
  | 'preview_audio_progress'
  | 'faq_open'
  | 'sample_image_interact'

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

let landingStartedAt =
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
let maxScrollPct = 0
let deepestFunnelStep = 'none'
let scrollListenersInstalled = false
let exitListenersInstalled = false
let analyticsReady = false

const onceKeys = new Set<string>()
const previewProgressFired = new Set<number>()
let sampleInteractFired = false

let lastCtaLocation: CtaLocation | null = null

/** @internal */
export function __resetAnalyticsSessionForTests() {
  onceKeys.clear()
  previewProgressFired.clear()
  sampleInteractFired = false
  maxScrollPct = 0
  deepestFunnelStep = 'none'
  scrollListenersInstalled = false
  exitListenersInstalled = false
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

function nowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()
}

function secondsSinceLanding() {
  return Math.max(0, Math.round((nowMs() - landingStartedAt) / 1000))
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
    ...attributionToProps(attr),
    seconds_since_landing: secondsSinceLanding(),
    scroll_depth_pct: maxScrollPct,
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
    posthog.capture(String(event), buildBaseProps(props))
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

export function trackCheckoutOpened(opts: { tier: string; priceEur?: number }): boolean {
  return track('checkout_opened', {
    tier: opts.tier,
    ...(opts.priceEur != null ? { price_eur: opts.priceEur } : {}),
  })
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
}): boolean {
  return track('checkout_completed', {
    tier: opts.tier,
    ...(opts.priceEur != null ? { price_eur: opts.priceEur } : {}),
    ...(opts.transactionId ? { transaction_id: opts.transactionId } : {}),
  })
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

function fireScrollMilestones() {
  const depth = updateScrollDepth()
  for (const pct of SCROLL_MILESTONES) {
    if (depth >= pct && once(`scroll_milestone:${pct}`)) {
      track('scroll_milestone', { pct })
    }
  }
}

function fireExitIntent() {
  if (!once('exit_intent')) return
  updateScrollDepth()
  track('exit_intent', {
    max_scroll_pct: maxScrollPct,
    seconds_on_page: secondsSinceLanding(),
    deepest_funnel_step_reached: deepestFunnelStep,
  })
}

/**
 * Observe element until ≥ threshold visible for dwellMs, then fire once.
 * Fast scrolls past do not count.
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
      if (done) return
      if (entry?.isIntersecting && entry.intersectionRatio >= threshold) {
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
    { threshold: [0, threshold, 1] },
  )

  io.observe(element)
  return () => {
    done = true
    clearTimer()
    io.disconnect()
  }
}

/** Debounced scroll milestones + exit intent. Safe to call multiple times. */
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

  const onHidden = () => {
    if (document.visibilityState === 'hidden') fireExitIntent()
  }
  const onPageHide = () => fireExitIntent()

  if (!scrollListenersInstalled) {
    scrollListenersInstalled = true
    window.addEventListener('scroll', onScroll, { passive: true })
    fireScrollMilestones()
  }

  if (!exitListenersInstalled) {
    exitListenersInstalled = true
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', onPageHide)
  }

  return () => {
    if (scrollTimer != null) clearTimeout(scrollTimer)
    window.removeEventListener('scroll', onScroll)
    document.removeEventListener('visibilitychange', onHidden)
    window.removeEventListener('pagehide', onPageHide)
    scrollListenersInstalled = false
    exitListenersInstalled = false
  }
}
