import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearGuestSession,
  completeNativeContext,
  completeCurrentNativeOnboarding,
  ensureGuestSession,
  GUEST_SESSION_KEY,
  hasCompletedGuestOnboarding,
  hasGuestSession,
  markGuestOnboardingComplete,
  readGuestSession,
  startNativeGuestExploration,
} from '../guestSession.js'
import { hasValidLocalAccess } from '../accessSession.js'

describe('guestSession', () => {
  beforeEach(() => {
    localStorage.clear()
    clearGuestSession()
  })

  it('does not exist until Start exploring initializes it', () => {
    expect(hasGuestSession()).toBe(false)
    expect(hasCompletedGuestOnboarding()).toBe(false)
    expect(readGuestSession()).toBeNull()
  })

  it('creates a stable local guest id without a credential or entitlement', () => {
    const first = ensureGuestSession()
    const second = ensureGuestSession()

    expect(first.id).toMatch(/^cw_guest_/)
    expect(second.id).toBe(first.id)
    expect(first.onboardingCompleted).toBe(false)
    expect(hasValidLocalAccess()).toBe(false)
    expect(localStorage.getItem('cw_device_credential_v1')).toBeNull()
    expect(localStorage.getItem('cw_access_entitlement_v1')).toBeNull()
    expect(JSON.parse(localStorage.getItem(GUEST_SESSION_KEY)).id).toBe(first.id)
  })

  it('Start exploring initializes guest state and points at Context V0', () => {
    const { session, nextPath } = startNativeGuestExploration()

    expect(nextPath).toBe('/context')
    expect(session.onboardingCompleted).toBe(false)
    expect(hasCompletedGuestOnboarding()).toBe(false)
    expect(hasValidLocalAccess()).toBe(false)
  })

  it('markGuestOnboardingComplete is idempotent on the same id', () => {
    const created = completeCurrentNativeOnboarding()
    const done = markGuestOnboardingComplete()
    const again = markGuestOnboardingComplete()

    expect(done.id).toBe(created.id)
    expect(again.id).toBe(created.id)
    expect(again.onboardingCompleted).toBe(true)
    expect(hasCompletedGuestOnboarding()).toBe(true)
  })

  it('completeNativeContext persists interests and time without treating a partial profile as done', () => {
    ensureGuestSession()
    const next = completeNativeContext({
      interestIds: ['architecture', 'sacred'],
      timeBudgetId: '30min',
      locationStatus: 'denied',
    })

    expect(next.onboardingCompleted).toBe(false)
    expect(next.context.interestIds).toEqual(['architecture', 'sacred'])
    expect(next.context.timeBudgetId).toBe('30min')
    expect(next.context.locationStatus).toBe('denied')
    expect(next.context.traveler.positiveInterestIds).toEqual(['architecture', 'sacred'])
    expect(next.context.session.availableTimeNow).toBe('30min')
    expect(hasCompletedGuestOnboarding()).toBe(false)
  })

  it('upgrades a stored v1 context blob on read', () => {
    ensureGuestSession()
    const raw = JSON.parse(localStorage.getItem(GUEST_SESSION_KEY))
    raw.version = 1
    raw.context = {
      interestIds: ['art'],
      surpriseMe: false,
      timeBudgetId: '2h',
      locationStatus: 'granted',
      lastPosition: { lat: 41.9, lng: 12.48, accuracy: 12, timestamp: 1 },
      completedAt: '2026-08-01T00:00:00.000Z',
    }
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(raw))

    const session = readGuestSession()
    expect(session.context.traveler.positiveInterestIds).toEqual(['art'])
    expect(session.context.session.availableTimeNow).toBe('2h')
    expect(session.context.session.location.lat).toBe(41.9)
    expect(session.context.trip.anchors).toEqual([])
  })

  it('keeps tripHorizon and availableTimeNow as different fields', () => {
    ensureGuestSession()
    const next = completeNativeContext({
      traveler: { positiveInterestIds: ['history'] },
      trip: { cityId: 'rome', tripHorizon: 'week-plus' },
      session: { availableTimeNow: '30min' },
    })
    expect(next.context.trip.tripHorizon).toBe('week-plus')
    expect(next.context.session.availableTimeNow).toBe('30min')
    expect(next.context.timeBudgetId).toBe('30min')
  })

  it('does not treat a pre-Travel-Context guest flag as current onboarding', () => {
    ensureGuestSession()
    const raw = JSON.parse(localStorage.getItem(GUEST_SESSION_KEY))
    raw.onboardingCompleted = true
    raw.onboardingFlowVersion = 1
    raw.context = {
      interestIds: ['art'],
      timeBudgetId: '2h',
      locationStatus: 'granted',
      lastPosition: { lat: 41.9, lng: 12.48 },
    }
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(raw))

    expect(hasGuestSession()).toBe(true)
    expect(hasCompletedGuestOnboarding()).toBe(false)
    expect(readGuestSession().onboardingCompleted).toBe(false)
  })

  it('marks current onboarding complete only with required Context fields', () => {
    const next = completeCurrentNativeOnboarding({
      traveler: { positiveInterestIds: ['architecture-design', 'art'] },
      session: { availableTimeNow: '1h', locationStatus: 'skipped' },
    })
    expect(next.onboardingCompleted).toBe(true)
    expect(next.onboardingFlowVersion).toBe(3)
    expect(hasCompletedGuestOnboarding()).toBe(true)
  })
})
