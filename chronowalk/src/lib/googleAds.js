/**
 * Google Ads (gtag) — Consent Mode v2 + purchase / checkout_opened conversions.
 *
 * Base tag loads async and is NOT gated by the marketing banner. Ads cookies
 * stay denied until marketing consent; analytics_storage is granted by default
 * (product measurement / modeled conversions).
 *
 * Env (from Google Ads UI → Goals → Conversions → Tag setup):
 *   VITE_GOOGLE_ADS_ID                  AW-XXXXXXXXX
 *   VITE_GOOGLE_ADS_PURCHASE_LABEL      label for primary Purchase conversion
 *   VITE_GOOGLE_ADS_CHECKOUT_OPENED_LABEL  label for secondary checkout_opened
 */

const CONSENT_DEFAULT = Object.freeze({
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted',
  wait_for_update: 500,
})

let scriptRequested = false
let configured = false

function readAdsId() {
  return String(import.meta.env.VITE_GOOGLE_ADS_ID ?? '').trim()
}

function readPurchaseLabel() {
  return String(import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL ?? '').trim()
}

function readCheckoutOpenedLabel() {
  return String(import.meta.env.VITE_GOOGLE_ADS_CHECKOUT_OPENED_LABEL ?? '').trim()
}

function sendTo(label) {
  const id = readAdsId()
  if (!id || !label) return null
  return `${id}/${label}`
}

/** Ensure dataLayer + gtag stub exist (safe before the remote script loads). */
export function ensureGtagStub() {
  if (typeof window === 'undefined') return () => {}
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments)
    }
  }
  return window.gtag
}

/**
 * Consent Mode v2 defaults — call once before/with the base tag.
 * analytics_storage granted; ad_* denied until marketing consent.
 */
export function applyGoogleAdsConsentDefault() {
  if (typeof window === 'undefined') return
  const gtag = ensureGtagStub()
  gtag('consent', 'default', { ...CONSENT_DEFAULT })
}

/**
 * Update Consent Mode after the marketing banner choice.
 * @param {boolean} marketingAccepted
 */
export function updateGoogleAdsConsent(marketingAccepted) {
  if (typeof window === 'undefined') return
  const gtag = ensureGtagStub()
  const ads = marketingAccepted ? 'granted' : 'denied'
  gtag('consent', 'update', {
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
    analytics_storage: 'granted',
  })
}

/**
 * Load gtag.js async and config the Google Ads conversion ID.
 * No-ops when VITE_GOOGLE_ADS_ID is unset (local/dev).
 */
export function initGoogleAds({ marketingConsent = null } = {}) {
  if (typeof window === 'undefined') return false
  const adsId = readAdsId()
  if (!adsId) return false

  applyGoogleAdsConsentDefault()
  if (marketingConsent === 'accepted') {
    updateGoogleAdsConsent(true)
  } else if (marketingConsent === 'declined') {
    updateGoogleAdsConsent(false)
  }

  const gtag = ensureGtagStub()

  if (!scriptRequested) {
    scriptRequested = true
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`
    document.head.appendChild(script)
  }

  if (!configured) {
    configured = true
    gtag('js', new Date())
    gtag('config', adsId, {
      allow_enhanced_conversions: true,
    })
  }

  return true
}

/**
 * SHA-256 hex of normalized email (trim + lowercase) for Enhanced Conversions.
 * @param {string | null | undefined} email
 * @returns {Promise<string | null>}
 */
export async function hashEmailForGoogleAds(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized || typeof crypto === 'undefined' || !crypto.subtle) return null
  try {
    const bytes = new TextEncoder().encode(normalized)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}

/**
 * Secondary micro-conversion: checkout overlay opened (optimize before purchases).
 * Configure this conversion in Google Ads as Secondary / observation.
 */
export function trackGoogleAdsCheckoutOpened({ tier, value, currency = 'EUR' } = {}) {
  if (typeof window === 'undefined') return false
  const target = sendTo(readCheckoutOpenedLabel())
  if (!target) return false

  initGoogleAds()
  const gtag = ensureGtagStub()
  /** @type {Record<string, unknown>} */
  const payload = {
    send_to: target,
    currency: currency || 'EUR',
  }
  if (value != null && Number.isFinite(Number(value))) {
    payload.value = Number(value)
  }
  if (tier) payload.tier = tier
  gtag('event', 'conversion', payload)
  return true
}

/**
 * Primary purchase conversion + Enhanced Conversions (hashed email).
 */
export async function trackGoogleAdsPurchaseConversion({
  value,
  currency = 'EUR',
  transactionId,
  email,
  tier,
} = {}) {
  if (typeof window === 'undefined') return false
  const target = sendTo(readPurchaseLabel())
  if (!target) return false

  initGoogleAds()
  const gtag = ensureGtagStub()

  const emailHash = await hashEmailForGoogleAds(email)
  if (emailHash) {
    gtag('set', 'user_data', {
      sha256_email_address: emailHash,
    })
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    send_to: target,
    currency: currency || 'EUR',
  }
  if (value != null && Number.isFinite(Number(value))) {
    payload.value = Number(value)
  }
  if (transactionId) payload.transaction_id = String(transactionId)
  if (tier) payload.tier = tier

  gtag('event', 'conversion', payload)
  return true
}

/** @internal */
export function __resetGoogleAdsForTests() {
  scriptRequested = false
  configured = false
  if (typeof window !== 'undefined') {
    delete window.gtag
    window.dataLayer = []
  }
}
