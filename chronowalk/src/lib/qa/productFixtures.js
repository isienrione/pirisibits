import { completeCurrentNativeOnboarding, clearGuestSession } from '../guestSession.js'
import { canAccessContentId } from '../contentAccess.js'
import { composeAndSave, startRoute, clearRouteState, revealMystery, completeCurrentItem } from '../route/index.js'
import { grantTestAccess } from '../../test/grantTestAccess.js'
import { clearLocalAccessState } from '../accessSession.js'

export const PANTHEON = { lat: 41.89885, lng: 12.47687 }
export const NYC = { lat: 40.758, lng: -73.985 }

const FIXTURES = {
  inRomeFreeGuest: {
    lastPosition: PANTHEON,
    traveler: {
      positiveInterestIds: ['architecture-design', 'hidden-places'],
      explorationStyle: 'mix',
      iconicVsHidden: 'mix',
      depthVsBreadth: 'mix',
      walkingTolerance: 'moderate',
      transportModes: ['walk'],
      urbanComfort: 'lively',
    },
    trip: { tripHorizon: 'today' },
    session: {
      availableTimeNow: '2h',
      locationStatus: 'granted',
      location: PANTHEON,
    },
  },
  remotePlanner: {
    lastPosition: NYC,
    traveler: {
      positiveInterestIds: ['history', 'art'],
      explorationStyle: 'mix',
      iconicVsHidden: 'mix',
      depthVsBreadth: 'mix',
      walkingTolerance: 'moderate',
      transportModes: ['walk'],
      urbanComfort: 'visitor-areas',
    },
    trip: { tripHorizon: '4-7d' },
    session: {
      availableTimeNow: 'halfday',
      locationStatus: 'skipped',
      location: NYC,
    },
  },
  entitledRome: {
    lastPosition: PANTHEON,
    traveler: {
      positiveInterestIds: ['history', 'art', 'architecture-design'],
      explorationStyle: 'mix',
      iconicVsHidden: 'mix',
      depthVsBreadth: 'mix',
      walkingTolerance: 'moderate',
      transportModes: ['walk'],
      urbanComfort: 'lively',
    },
    trip: { tripHorizon: '4-7d' },
    session: {
      availableTimeNow: 'halfday',
      locationStatus: 'granted',
      location: PANTHEON,
    },
    entitle: true,
    start: true,
  },
}

export function applyProductFixture(id) {
  clearGuestSession()
  clearRouteState()
  if (id !== 'entitledRome') {
    try {
      clearLocalAccessState()
    } catch {
      /* ignore */
    }
  }
  const spec = FIXTURES[id] || FIXTURES.inRomeFreeGuest
  if (spec.entitle) grantTestAccess({ contentProductId: 'rome-complete', purchasedProductId: 'rome-complete' })
  const guest = completeCurrentNativeOnboarding({
    lastPosition: spec.lastPosition,
    traveler: spec.traveler,
    trip: spec.trip,
    session: spec.session,
  })
  const proposed = composeAndSave({
    context: guest.context,
    position: spec.lastPosition,
    canAccess: canAccessContentId,
  })
  let active = null
  if (spec.start || id === 'mysteryUnrevealed' || id === 'mysteryRevealed') {
    active = startRoute(proposed)
  }
  if (id === 'mysteryUnrevealed' || id === 'mysteryRevealed') {
    const mystery = proposed.items.find((item) => item.isMysteryDiscovery)
    if (mystery && id === 'mysteryRevealed') revealMystery(mystery.routeItemId, { early: true })
  }
  return { guest, proposed, active }
}

export function installProductFixtureApi() {
  if (typeof window === 'undefined') return
  window.__cwApplyProductFixture = applyProductFixture
  window.__cwCompleteCurrentItem = completeCurrentItem
}
