/**
 * Local-only native guest session (`cw_guest_v1`).
 *
 * Distinguishes first-run, onboarding-completed guest, and (separately)
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

function emptySession() {
  return {
    version: GUEST_SESSION_VERSION,
    id: randomGuestId(),
    createdAt: new Date().toISOString(),
    onboardingCompleted: false,
    onboardingCompletedAt: null,
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

export function hasGuestSession() {
  return Boolean(readGuestSession())
}

export function hasCompletedGuestOnboarding() {
  return readGuestSession()?.onboardingCompleted === true
}

/**
 * Welcome primary CTA: persist guest identity and mark native entry complete
 * so the next cold start skips /welcome. Does not grant paid Rome access.
 * @returns {{ session: object, nextPath: '/setup' }}
 */
export function startNativeGuestExploration() {
  const session = markGuestOnboardingComplete()
  return { session, nextPath: '/setup' }
}

export function clearGuestSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(GUEST_SESSION_KEY)
  } catch {
    /* ignore */
  }
}
