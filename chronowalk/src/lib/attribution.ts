/**
 * First-touch marketing attribution.
 *
 * Captures UTM / click ids from the URL query string once per 30 days into
 * localStorage (`cw_attribution`), then registers them on PostHog so every
 * subsequent event carries the same props.
 *
 * Must run before landing hash navigation — some landing controls call
 * `history.replaceState(null, '', '#tier')`, which drops the query string.
 */
import posthog from 'posthog-js'

export const ATTRIBUTION_STORAGE_KEY = 'cw_attribution'
/** First-touch window: do not overwrite an existing record within 30 days. */
export const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000

const QUERY_KEYS = [
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
] as const

export type AttributionQueryKey = (typeof QUERY_KEYS)[number]

export type AttributionRecord = {
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  gclid: string | null
  gbraid: string | null
  wbraid: string | null
  msclkid: string | null
  ttclid: string | null
  fbclid: string | null
  landing_page_url: string | null
  document_referrer: string | null
  captured_at: number
}

function emptyAttribution(capturedAt = Date.now()): AttributionRecord {
  return {
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
    captured_at: capturedAt,
  }
}

function readParam(params: URLSearchParams, key: AttributionQueryKey): string | null {
  const raw = params.get(key)
  if (raw == null) return null
  const text = String(raw).trim()
  return text || null
}

function readStoredAttribution(): AttributionRecord | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AttributionRecord>
    if (!parsed || typeof parsed !== 'object') return null
    const capturedAt = Number(parsed.captured_at)
    if (!Number.isFinite(capturedAt) || capturedAt <= 0) return null

    const record = emptyAttribution(capturedAt)
    for (const key of QUERY_KEYS) {
      const value = parsed[key]
      record[key] = value == null || value === '' ? null : String(value)
    }
    record.landing_page_url =
      parsed.landing_page_url == null || parsed.landing_page_url === ''
        ? null
        : String(parsed.landing_page_url)
    record.document_referrer =
      parsed.document_referrer == null || parsed.document_referrer === ''
        ? null
        : String(parsed.document_referrer)
    return record
  } catch {
    return null
  }
}

function writeStoredAttribution(record: AttributionRecord): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Private mode / quota — in-memory callers still get the returned record.
  }
}

function isFresh(record: AttributionRecord, now = Date.now()): boolean {
  return now - record.captured_at < ATTRIBUTION_TTL_MS
}

function readAttributionFromEnvironment(now = Date.now()): AttributionRecord {
  const record = emptyAttribution(now)
  if (typeof window === 'undefined') return record

  try {
    const params = new URLSearchParams(window.location.search)
    for (const key of QUERY_KEYS) {
      record[key] = readParam(params, key)
    }
  } catch {
    /* ignore */
  }

  try {
    // Prefer the full href (path + query + hash) at first paint, before
    // landing hash replaceState can strip the query string.
    record.landing_page_url = window.location.href || null
  } catch {
    record.landing_page_url = null
  }

  try {
    record.document_referrer =
      typeof document !== 'undefined' && document.referrer
        ? String(document.referrer)
        : null
  } catch {
    record.document_referrer = null
  }

  return record
}

/** Props safe to spread into PostHog register / capture / Paddle customData. */
export function attributionToProps(
  record: AttributionRecord | null | undefined,
): Record<string, string | number> {
  if (!record) return {}
  /** @type {Record<string, string | number>} */
  const props: Record<string, string | number> = {}
  for (const key of QUERY_KEYS) {
    const value = record[key]
    if (value) props[key] = value
  }
  if (record.landing_page_url) props.landing_page_url = record.landing_page_url
  if (record.document_referrer) props.document_referrer = record.document_referrer
  if (Number.isFinite(record.captured_at)) props.attribution_captured_at = record.captured_at
  return props
}

/**
 * Register first-touch attribution as PostHog super-properties so every
 * subsequent `capture` includes them.
 */
export function registerAttributionWithPosthog(
  record: AttributionRecord | null = getAttribution(),
): void {
  if (!record || typeof window === 'undefined') return
  try {
    const props = attributionToProps(record)
    if (Object.keys(props).length === 0) return
    if (typeof posthog.register === 'function') {
      posthog.register(props)
    }
  } catch {
    /* PostHog may be blocked */
  }
}

/** Return the stored first-touch attribution record, or null if none. */
export function getAttribution(): AttributionRecord | null {
  return readStoredAttribution()
}

/**
 * On first page load of a session (and whenever called): read UTM/click ids
 * from the URL, persist with first-touch semantics (30-day TTL), and register
 * on PostHog.
 *
 * @returns The active attribution record (existing first-touch or newly captured).
 */
export function captureAttribution(now = Date.now()): AttributionRecord {
  const existing = readStoredAttribution()
  if (existing && isFresh(existing, now)) {
    registerAttributionWithPosthog(existing)
    return existing
  }

  const next = readAttributionFromEnvironment(now)
  writeStoredAttribution(next)
  registerAttributionWithPosthog(next)
  return next
}

/** @internal */
export function __resetAttributionForTests(): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}
