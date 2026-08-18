import { beforeEach, describe, expect, it } from 'vitest'
import { HERO_STOP_IDS } from '../../i18n/audio/heroStopAudioMap.js'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { clearLocalAccessState } from '../accessSession.js'
import {
  accessibleHeroIds,
  canAccessHero,
  getGrantedScopeIds,
  hasCompleteRomeEntitlement,
  hasUnlockScope,
  mayStartPaidRomeJourney,
  resolveUnlockedJourneyPath,
  UNLOCK_SCOPES,
} from '../contentAccess.js'
import { clearGuestSession, startNativeGuestExploration } from '../guestSession.js'

describe('contentAccess rome-free foundation', () => {
  beforeEach(() => {
    localStorage.clear()
    clearLocalAccessState()
    clearGuestSession()
  })

  it('grants rome-free Pantheon Heroes to a guest without paid entitlement', () => {
    startNativeGuestExploration()

    expect(getGrantedScopeIds()).toEqual([UNLOCK_SCOPES.ROME_FREE])
    expect(hasUnlockScope(UNLOCK_SCOPES.ROME_FREE)).toBe(true)
    expect(canAccessHero('w17')).toBe(true)
    expect(canAccessHero('w23')).toBe(true)
    expect(hasCompleteRomeEntitlement()).toBe(false)
    expect(mayStartPaidRomeJourney()).toBe(false)
    expect(resolveUnlockedJourneyPath()).toBe('/home')
  })

  it('does not grant complete Rome or a representative premium Hero to a guest', () => {
    startNativeGuestExploration()

    expect(canAccessHero('w01')).toBe(false)
    expect(canAccessHero('w04')).toBe(false)
    expect(canAccessHero('w22')).toBe(false)
    expect(accessibleHeroIds()).toEqual(['w17', 'w23'])
    expect(accessibleHeroIds()).not.toEqual([...HERO_STOP_IDS])
    expect(localStorage.getItem('cw_access_entitlement_v1')).toBeNull()
  })

  it('recognizes a paid complete entitlement without changing guest-free membership', () => {
    grantTestAccess({ contentProductId: 'rome-complete', purchasedProductId: 'rome-complete' })

    expect(hasUnlockScope(UNLOCK_SCOPES.ROME_FREE)).toBe(true)
    expect(hasCompleteRomeEntitlement()).toBe(true)
    expect(canAccessHero('w01')).toBe(true)
    expect(canAccessHero('w17')).toBe(true)
    expect(mayStartPaidRomeJourney()).toBe(true)
    expect(resolveUnlockedJourneyPath()).toBe('/journey')
  })

  it('maps rome-essential to ancient Rome, not complete', () => {
    grantTestAccess({ contentProductId: 'rome-essential', purchasedProductId: 'rome-essential' })

    expect(hasUnlockScope(UNLOCK_SCOPES.ROME_ANCIENT)).toBe(true)
    expect(hasCompleteRomeEntitlement()).toBe(false)
    expect(canAccessHero('w01')).toBe(true)
    expect(canAccessHero('w17')).toBe(true)
    expect(canAccessHero('w22')).toBe(false)
  })
})
