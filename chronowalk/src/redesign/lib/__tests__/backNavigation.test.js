import { describe, expect, it, vi, beforeEach } from 'vitest'
import { grantAccess, revokeAccess } from '../../../lib/config.js'
import { JOURNEY_STATES } from '../../../state/journey.js'
import {
  hasInScreenBack,
  homePath,
  resolveBackNavigation,
  shouldShowGlobalBack,
} from '../backNavigation.js'

describe('backNavigation', () => {
  beforeEach(() => {
    revokeAccess()
  })

  describe('homePath', () => {
    it('returns /tour when access is granted', () => {
      grantAccess()
      expect(homePath()).toBe('/tour')
    })

    it('returns /landing without access', () => {
      expect(homePath()).toBe('/landing')
    })
  })

  describe('hasInScreenBack', () => {
    it('hides global back on drill-down and flow screens', () => {
      expect(hasInScreenBack({ pathname: '/journal/w01', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/credits', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/letter', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/preview', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/begin', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/setup', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/access', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/access/confirmed', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/no-ticket', journeyState: null })).toBe(true)
      expect(hasInScreenBack({ pathname: '/map', journeyState: null })).toBe(true)
      expect(
        hasInScreenBack({ pathname: '/journey', journeyState: JOURNEY_STATES.STORY }),
      ).toBe(true)
    })

    it('allows global back on companion tabs', () => {
      expect(hasInScreenBack({ pathname: '/stops', journeyState: null })).toBe(false)
      expect(hasInScreenBack({ pathname: '/journal', journeyState: null })).toBe(false)
    })
  })

  describe('shouldShowGlobalBack', () => {
    it('hides on landing and threshold', () => {
      expect(shouldShowGlobalBack({ pathname: '/', journeyState: null })).toBe(false)
      expect(shouldShowGlobalBack({ pathname: '/landing', journeyState: null })).toBe(false)
      expect(
        shouldShowGlobalBack({ pathname: '/journey', journeyState: JOURNEY_STATES.THRESHOLD }),
      ).toBe(false)
    })

    it('shows on tour hub', () => {
      expect(shouldShowGlobalBack({ pathname: '/tour', journeyState: null })).toBe(true)
    })
  })

  describe('resolveBackNavigation', () => {
    it('returns contextual labels for companion screens', () => {
      const stops = resolveBackNavigation({ pathname: '/stops', journeyState: null })
      expect(stops.label).toBe('My Tour')

      const map = resolveBackNavigation({ pathname: '/map', journeyState: null })
      expect(map.label).toBe('Back to walk')
    })

    it('returns walk back for paused journey overlays', () => {
      const paused = resolveBackNavigation({
        pathname: '/journey',
        journeyState: JOURNEY_STATES.PAUSED,
      })
      expect(paused.label).toBe('Back to walk')

      const transition = vi.fn()
      paused.run(vi.fn(), transition)
      expect(transition).toHaveBeenCalledWith(JOURNEY_STATES.WALKING)
    })

    it('returns setup or home from tour depending on access', () => {
      grantAccess()
      const withAccess = resolveBackNavigation({ pathname: '/tour', journeyState: null })
      expect(withAccess.label).toBe('Setup')

      revokeAccess()
      const withoutAccess = resolveBackNavigation({ pathname: '/tour', journeyState: null })
      expect(withoutAccess.label).toBe('Home')
    })
  })
})
