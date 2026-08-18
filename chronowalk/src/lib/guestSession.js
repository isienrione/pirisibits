/**
 * Local-only native guest session (`cw_guest_v1`).
 *
 * Distinguishes first-run, Context-completed guest, and (separately)
 * entitled travelers. This is not a Supabase user, not a device credential,
 * and not an entitlement. The stable `id` is reserved so a future ChronoWalk
 * account can attach this guest's local journey state.
 *
 * Context is a Travel Context Profile (traveler / trip / session / history).
 * Flat V0 mirrors (interestIds, timeBudgetId, …) stay on the blob for
 * Discover and existing tests.
 */

import {
  appendHistoryEvent,
  applyContextPatch,
  emptyTravelContext,
  inferTimeOfDay,
  normalizePosition,
  normalizeTravelContext,
  TRAVEL_CONTEXT_VERSION,
} from './travelContext/schema.js'

export const GUEST_SESSION_KEY = 'cw_guest_v1'
export const GUEST_SESSION_VERSION = TRAVEL_CONTEXT_VERSION

function randomGuestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cw_guest_${crypto.randomUUID()}`
  }
  return `cw_guest_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function emptyContext() {
  return emptyTravelContext()
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

function normalizeContext(raw) {
  return normalizeTravelContext(raw)
}

function normalizeSession(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  const id = typeof parsed.id === 'string' && parsed.id.startsWith('cw_guest_') ? parsed.id : null
  if (!id) return null
  return {
    version: GUEST_SESSION_VERSION,
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
 * Persist the Travel Context Profile and mark native onboarding done.
 * Accepts nested `{ traveler, trip, session, history }` and/or flat V0
 * `{ interestIds, timeBudgetId, surpriseMe, locationStatus, lastPosition }`.
 */
export function completeNativeContext(partial = {}) {
  const current = ensureGuestSession()
  const merged = applyContextPatch(current.context, {
    ...partial,
    completedAt: new Date().toISOString(),
  })
  const next = {
    ...current,
    version: GUEST_SESSION_VERSION,
    onboardingCompleted: true,
    onboardingCompletedAt: current.onboardingCompletedAt || merged.completedAt,
    context: merged,
  }
  writeGuestSession(next)
  return next
}

export function writeGuestLocation(position, locationStatus) {
  return updateSessionContext({
    location: position !== undefined ? normalizePosition(position) : undefined,
    locationStatus,
    timeOfDay: inferTimeOfDay(),
  })
}

export function updateSessionContext(patch = {}) {
  const current = ensureGuestSession()
  const merged = applyContextPatch(current.context, {
    session: {
      ...current.context.session,
      ...patch,
    },
    lastPosition: patch.location !== undefined ? patch.location : current.context.lastPosition,
    locationStatus: patch.locationStatus ?? current.context.locationStatus,
    completedAt: current.context.completedAt,
  })
  const next = { ...current, context: merged }
  writeGuestSession(next)
  return next
}

export function recordExperienceSignal(type, experienceId) {
  const current = ensureGuestSession()
  const history = appendHistoryEvent(current.context.history, type, experienceId)
  const merged = applyContextPatch(current.context, {
    history,
    completedAt: current.context.completedAt,
  })
  const next = { ...current, context: merged }
  writeGuestSession(next)
  return next
}

export function recordCompletedExperience(experienceId) {
  return recordExperienceSignal('completed', experienceId)
}

export function recordSavedExperience(experienceId) {
  return recordExperienceSignal('saved', experienceId)
}

export function recordDismissedExperience(experienceId) {
  return recordExperienceSignal('dismissed', experienceId)
}

export function recordLikedExperience(experienceId) {
  return recordExperienceSignal('liked', experienceId)
}

export function removeSavedExperience(experienceId) {
  const current = ensureGuestSession()
  const saved = (current.context.history?.savedExperienceIds || []).filter((id) => id !== experienceId)
  const merged = applyContextPatch(current.context, {
    history: {
      ...current.context.history,
      savedExperienceIds: saved,
    },
    completedAt: current.context.completedAt,
  })
  const next = { ...current, context: merged }
  writeGuestSession(next)
  return next
}

export function isExperienceSaved(experienceId) {
  return Boolean(readGuestContext()?.history?.savedExperienceIds?.includes(experienceId))
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
 * Welcome primary CTA: persist guest identity and send them into Context.
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
