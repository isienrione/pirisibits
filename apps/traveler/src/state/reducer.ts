import { createInitialState, type TravelerAction, type TravelerState } from './types'

export function travelerReducer(state: TravelerState, action: TravelerAction): TravelerState {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.state, hydrated: true, demoBanner: true }
    case 'patchOnboarding':
      return { ...state, onboarding: { ...state.onboarding, ...action.patch } }
    case 'setScreen':
      return { ...state, screen: action.screen }
    case 'openOverlay':
      return { ...state, returnScreen: state.screen, screen: action.screen }
    case 'closeOverlay':
      return { ...state, screen: state.returnScreen ?? 'B01', returnScreen: null }
    case 'setProfile':
      return { ...state, profile: action.profile, session: action.session }
    case 'setRoute':
      return {
        ...state,
        route: action.route,
        cursor: action.cursor ?? 0,
        experience: {
          arrivedItemId: null,
          confirmedArrival: false,
          narrationStarted: false,
          mysteryRevealed: false,
          completedIds: state.experience.completedIds,
        },
      }
    case 'setCursor':
      return {
        ...state,
        cursor: action.cursor,
        experience: {
          ...state.experience,
          arrivedItemId: null,
          confirmedArrival: false,
          narrationStarted: false,
        },
      }
    case 'setDelta':
      return { ...state, lastDelta: action.delta }
    case 'arrive':
      return {
        ...state,
        experience: {
          ...state.experience,
          arrivedItemId: action.itemId,
          confirmedArrival: false,
          narrationStarted: false,
        },
      }
    case 'confirmArrival':
      return {
        ...state,
        experience: { ...state.experience, confirmedArrival: true },
      }
    case 'beginExperience':
      if (!state.experience.confirmedArrival) return state
      return {
        ...state,
        experience: { ...state.experience, narrationStarted: true },
      }
    case 'revealMystery':
      return { ...state, experience: { ...state.experience, mysteryRevealed: true } }
    case 'completeExperience':
      return {
        ...state,
        experience: {
          ...state.experience,
          completedIds: state.experience.completedIds.includes(action.itemId)
            ? state.experience.completedIds
            : [...state.experience.completedIds, action.itemId],
          narrationStarted: false,
          confirmedArrival: false,
          arrivedItemId: null,
        },
      }
    case 'save':
      return {
        ...state,
        savedIds: state.savedIds.includes(action.itemId)
          ? state.savedIds
          : [...state.savedIds, action.itemId],
      }
    case 'setLocation':
      return { ...state, location: action.location }
    case 'setSim':
      return { ...state, sim: action.sim }
    case 'setReduceMotion':
      return { ...state, reduceMotion: action.value }
    case 'setDensity':
      return { ...state, density: action.density }
    default:
      return state
  }
}

export { createInitialState }
