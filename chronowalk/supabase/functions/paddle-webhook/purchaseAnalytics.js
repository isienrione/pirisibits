/**
 * Purchase analytics helpers for paddle-webhook (vitest + Deno).
 * Attribution from Paddle custom_data + PostHog server capture payload.
 */

const ATTRIBUTION_CUSTOM_KEYS = Object.freeze([
  'ph_distinct_id',
  'ph_session_id',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'ttclid',
  'fbclid',
  'ab_variant',
  'cta_location',
  'host',
  'consent_version',
  'product_id',
  'landing_page_url',
  'document_referrer',
])

/**
 * SHA-256 hex digest of a normalized email (trim + lowercase).
 * @param {string} email
 * @returns {Promise<string | null>}
 */
export async function hashEmailSha256(email) {
  const normalized = String(email ?? '').trim().toLowerCase()
  if (!normalized) return null
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Pull attribution fields from Paddle custom_data (string values only).
 * @param {unknown} data transaction payload
 */
export function extractAttributionCustomData(data) {
  const raw = data?.custom_data ?? data?.customData ?? {}
  const custom = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  /** @type {Record<string, string>} */
  const out = {}
  for (const key of ATTRIBUTION_CUSTOM_KEYS) {
    const value = custom[key]
    if (value == null) continue
    const text = String(value).trim()
    if (!text) continue
    out[key] = text
  }
  return out
}

/**
 * Best-effort ISO country from a Paddle transaction payload.
 * @param {unknown} data
 */
export function readTransactionCountry(data) {
  const candidates = [
    data?.address?.country_code,
    data?.address?.countryCode,
    data?.billing_details?.address?.country_code,
    data?.billingDetails?.address?.countryCode,
    data?.customer?.address?.country_code,
    data?.customer?.address?.countryCode,
    data?.details?.totals?.country_code,
  ]
  for (const value of candidates) {
    if (value == null) continue
    const text = String(value).trim().toUpperCase()
    if (text) return text
  }
  return null
}

/**
 * Build PostHog `purchase_confirmed` properties from entitlement + attribution.
 */
export function buildPurchaseConfirmedProperties({
  transactionId,
  tier,
  amountCents,
  currency,
  country,
  emailHash,
  customData,
} = {}) {
  /** @type {Record<string, unknown>} */
  const props = {
    $geoip_disable: true,
    transaction_id: transactionId ?? null,
    tier: tier ?? null,
    amount: amountCents != null && Number.isFinite(Number(amountCents))
      ? Number(amountCents) / 100
      : null,
    amount_cents: amountCents ?? null,
    currency: currency ?? null,
    country: country ?? null,
    email_hash: emailHash ?? null,
  }
  const attribution = customData && typeof customData === 'object' ? customData : {}
  for (const key of ATTRIBUTION_CUSTOM_KEYS) {
    if (attribution[key] != null && attribution[key] !== '') {
      props[key] = attribution[key]
    }
  }
  for (const key of Object.keys(props)) {
    if (props[key] === undefined) delete props[key]
  }
  return props
}

/**
 * POST /capture/ to PostHog (EU by default). Never throws.
 * @returns {Promise<{ ok: boolean, status?: number, skipped?: boolean, reason?: string }>}
 */
export async function capturePosthogPurchaseConfirmed({
  apiKey,
  host = 'https://eu.i.posthog.com',
  distinctId,
  properties,
  fetchImpl = fetch,
} = {}) {
  if (!apiKey) return { ok: false, skipped: true, reason: 'missing_api_key' }
  if (!distinctId) return { ok: false, skipped: true, reason: 'missing_distinct_id' }

  try {
    const base = String(host).replace(/\/$/, '')
    const res = await fetchImpl(`${base}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event: 'purchase_confirmed',
        distinct_id: String(distinctId),
        properties: {
          ...properties,
          $lib: 'chronowalk-paddle-webhook',
        },
      }),
    })
    if (!res.ok) {
      return { ok: false, status: res.status, reason: `http_${res.status}` }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}

export { ATTRIBUTION_CUSTOM_KEYS }
