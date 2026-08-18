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
 *
 * Native boot must NOT trust `onboardingCompleted === true` alone.
 * Current required Context fields + onboarding flow version decide whether
 * the guest may skip /context.
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
import {
  completeOnboardingPayload,
  isTravelContextComplete,
  ONBOARDING_FLOW_VERSION,
  travelContextCompleteness,
} from './travelContext/completeness.js'

export const GUEST_SESSION_KEY = 'cw_guest_v1'
export const GUEST_SESSION_VERSION = TRAVEL_CONTEXT_VERSION
export { ONBOARDING_FLOW_VERSION }

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
    onboardingFlowVersion: 0,
    contextSchemaVersion: TRAVEL_CONTEXT_VERSION,
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
  const context = normalizeContext(parsed.context)
  const completeness = travelContextCompleteness(context)
  const storedFlow = Number(parsed.onboardingFlowVersion)
  return {
    version: GUEST_SESSION_VERSION,
    id,
    createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    onboardingCompleted: completeness.complete,
    onboardingCompletedAt:
      typeof parsed.onboardingCompletedAt === 'string' ? parsed.onboardingCompletedAt : null,
    onboardingFlowVersion: Number.isFinite(storedFlow) ? storedFlow : 0,
    contextSchemaVersion: TRAVEL_CONTEXT_VERSION,
    contextCompleteness: completeness.contextCompleteness,
    context,
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
  if (isTravelContextComplete(current.context)) {
    const next = {
      ...current,
      onboardingCompleted: true,
      onboardingCompletedAt: current.onboardingCompletedAt || new Date().toISOString(),
      onboardingFlowVersion: ONBOARDING_FLOW_VERSION,
    }
    writeGuestSession(next)
    return next
  }
  const next = {
    ...current,
    onboardingCompleted: false,
    onboardingCompletedAt: current.onboardingCompletedAt,
  }
  writeGuestSession(next)
  return next
}

/**
 * Persist the Travel Context Profile.
 * Marks native onboarding done only when the current required fields are complete.
 */
export function completeNativeContext(partial = {}) {
  const current = ensureGuestSession()
  const merged = applyContextPatch(current.context, {
    ...partial,
    completedAt: new Date().toISOString(),
  })
  const complete = isTravelContextComplete(merged)
  const next = {
    ...current,
    version: GUEST_SESSION_VERSION,
    onboardingCompleted: complete,
    onboardingCompletedAt: complete
      ? current.onboardingCompletedAt || merged.completedAt
      : current.onboardingCompletedAt,
    onboardingFlowVersion: complete ? ONBOARDING_FLOW_VERSION : current.onboardingFlowVersion || 0,
    contextSchemaVersion: TRAVEL_CONTEXT_VERSION,
    contextCompleteness: travelContextCompleteness(merged).contextCompleteness,
    context: merged,
  }
  writeGuestSession(next)
  return next
}

/** Test / QA helper: persist a currently complete onboarding profile. */
export function completeCurrentNativeOnboarding(overrides = {}) {
  return completeNativeContext(completeOnboardingPayload(overrides))
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
  const complete = isTravelContextComplete(merged)
  const next = {
    ...current,
    onboardingCompleted: complete,
    onboardingFlowVersion: complete ? ONBOARDING_FLOW_VERSION : current.onboardingFlowVersion || 0,
    contextCompleteness: travelContextCompleteness(merged).contextCompleteness,
    context: merged,
  }
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

/**
 * Current onboarding is complete only when required Context fields exist.
 * A stale `onboardingCompleted` flag from cw_guest_v1 is not sufficient.
 */
export function hasCompletedGuestOnboarding() {
  const session = readGuestSession()
  if (!session) return false
  return isTravelContextComplete(session.context)
}

export function guestNeedsCurrentContext() {
  return hasGuestSession() && !hasCompletedGuestOnboarding()
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

/** DEV / physical QA: wipe Context so first-run onboarding runs again. */
export function resetGuestOnboarding() {
  const current = readGuestSession()
  if (!current) return null
  const next = {
    ...current,
    onboardingCompleted: false,
    onboardingCompletedAt: null,
    onboardingFlowVersion: 0,
    contextSchemaVersion: TRAVEL_CONTEXT_VERSION,
    contextCompleteness: 0,
    context: emptyTravelContext(),
  }
  writeGuestSession(next)
  return next
}

/** DEV / physical QA: keep guest id, clear traveler/trip/session Context. */
export function resetTravelContext() {
  return resetGuestOnboarding()
}
