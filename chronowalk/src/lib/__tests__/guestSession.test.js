import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearGuestSession,
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

  it('Start exploring initializes guest state and points at existing Context/setup', () => {
    const { session, nextPath } = startNativeGuestExploration()

    expect(nextPath).toBe('/setup')
    expect(session.onboardingCompleted).toBe(true)
    expect(hasCompletedGuestOnboarding()).toBe(true)
    expect(hasValidLocalAccess()).toBe(false)
  })

  it('markGuestOnboardingComplete is idempotent on the same id', () => {
    const created = ensureGuestSession()
    const done = markGuestOnboardingComplete()
    const again = markGuestOnboardingComplete()

    expect(done.id).toBe(created.id)
    expect(again.id).toBe(created.id)
    expect(again.onboardingCompleted).toBe(true)
  })
})
