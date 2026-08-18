/**
 * Local-only native guest session (`cw_guest_v1`).
 *
 * Distinguishes first-run, Context-completed guest, and (separately)
 * entitled travelers. This is not a Supabase user, not a device credential,
 * and not an entitlement. The stable `id` is reserved so a future ChronoWalk
 * account can attach this guest's local journey state.
 */

export const GUEST_SESSION_KEY = 'cw_guest_v1'
export const GUEST_SESSION_VERSION = 1

function randomGuestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cw_guest_${crypto.randomUUID()}`
  }
  return `cw_guest_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function emptyContext() {
  return {
    interestIds: [],
    surpriseMe: false,
    timeBudgetId: null,
    locationStatus: null,
    lastPosition: null,
    completedAt: null,
  }
}

function emptySession() {
  return {
    version: GUEST_SESSION_VERSION,
    id: randomGuestId(),
    createdAt: new Date().toISOString(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    context: emptyContext(),
  }
}

function normalizePosition(value) {
  if (!value || typeof value !== 'object') return null
  const lat = Number(value.lat)
  const lng = Number(value.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return {
    lat,
    lng,
    accuracy: Number.isFinite(Number(value.accuracy)) ? Number(value.accuracy) : null,
    timestamp: Number(value.timestamp) || Date.now(),
  }
}

function normalizeContext(raw) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const interestIds = Array.isArray(source.interestIds)
    ? source.interestIds.filter((id) => typeof id === 'string' && id.length > 0).slice(0, 3)
    : []
  return {
    interestIds,
    surpriseMe: source.surpriseMe === true,
    timeBudgetId: typeof source.timeBudgetId === 'string' ? source.timeBudgetId : null,
    locationStatus: typeof source.locationStatus === 'string' ? source.locationStatus : null,
    lastPosition: normalizePosition(source.lastPosition),
    completedAt: typeof source.completedAt === 'string' ? source.completedAt : null,
  }
}

function normalizeSession(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  const id = typeof parsed.id === 'string' && parsed.id.startsWith('cw_guest_') ? parsed.id : null
  if (!id) return null
  return {
    version: Number(parsed.version) || GUEST_SESSION_VERSION,
    id,
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    onboardingCompleted: parsed.onboardingCompleted === true,
    onboardingCompletedAt:
      typeof parsed.onboardingCompletedAt === 'string' ? parsed.onboardingCompletedAt : null,
    context: normalizeContext(parsed.context),
  }
}

export function readGuestSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(GUEST_SESSION_KEY)
    if (!raw) return null
    return normalizeSession(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeGuestSession(session) {
  if (typeof window === 'undefined' || !session) return
  try {
    window.localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session))
  } catch {
    /* quota / private mode */
  }
}

/** Create a guest blob if missing. Idempotent. Never writes entitlements. */
export function ensureGuestSession() {
  const existing = readGuestSession()
  if (existing) return existing
  const next = emptySession()
  writeGuestSession(next)
  return next
}

export function markGuestOnboardingComplete() {
  const current = ensureGuestSession()
  if (current.onboardingCompleted) return current
  const next = {
    ...current,
    onboardingCompleted: true,
    onboardingCompletedAt: new Date().toISOString(),
  }
  writeGuestSession(next)
  return next
}

/**
 * Persist Context V0 (interests, time, location) and mark native onboarding done.
 * Discover Home is reachable only after this.
 */
export function completeNativeContext(partial = {}) {
  const current = ensureGuestSession()
  const merged = {
    ...current.context,
    ...partial,
    interestIds: Array.isArray(partial.interestIds)
      ? partial.interestIds.filter((id) => typeof id === 'string').slice(0, 3)
      : current.context.interestIds,
    lastPosition:
      partial.lastPosition !== undefined
        ? normalizePosition(partial.lastPosition)
        : current.context.lastPosition,
    completedAt: new Date().toISOString(),
  }
  const next = {
    ...current,
    onboardingCompleted: true,
    onboardingCompletedAt: current.onboardingCompletedAt || merged.completedAt,
    context: merged,
  }
  writeGuestSession(next)
  return next
}

export function writeGuestLocation(position, locationStatus) {
  const current = ensureGuestSession()
  const next = {
    ...current,
    context: {
      ...current.context,
      locationStatus: locationStatus ?? current.context.locationStatus,
      lastPosition: position !== undefined ? normalizePosition(position) : current.context.lastPosition,
    },
  }
  writeGuestSession(next)
  return next
}

export function readGuestContext() {
  return readGuestSession()?.context ?? emptyContext()
}

export function hasGuestSession() {
  return Boolean(readGuestSession())
}

export function hasCompletedGuestOnboarding() {
  return readGuestSession()?.onboardingCompleted === true
}

/**
 * Welcome primary CTA: persist guest identity and send them into Context V0.
 * Does not grant paid Rome access and does not skip Context.
 * @returns {{ session: object, nextPath: '/context' }}
 */
export function startNativeGuestExploration() {
  const session = ensureGuestSession()
  return { session, nextPath: '/context' }
}

export function clearGuestSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(GUEST_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
