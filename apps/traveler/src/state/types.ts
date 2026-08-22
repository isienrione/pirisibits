import type {
  ComposedRoute,
  LocationSignal,
  RouteDelta,
  SessionContext,
  TimeBudgetMin,
  TravelerProfile,
} from '@chronowalk/domain'
import type { EditorialDensity } from '../design/tokens'

export type ScreenId =
  | 'A01'
  | 'A03'
  | 'A05'
  | 'A06'
  | 'A07'
  | 'A08'
  | 'A10'
  | 'K01'
  | 'B01'
  | 'B03'
  | 'B04'
  | 'B05'
  | 'B06'
  | 'C01'
  | 'C03'
  | 'C04'
  | 'C05'
  | 'C06'
  | 'C07'
  | 'D01'
  | 'D02'
  | 'D05'
  | 'D07'
  | 'D08'
  | 'D09'
  | 'D12'
  | 'E01'
  | 'E03'
  | 'E04'
  | 'F01'
  | 'F03'
  | 'G01'
  | 'I01'
  | 'J01'
  | 'J03'
  | 'K02'
  | 'K05'
  | 'L01'
  | 'Diagnostics'
  | 'Gallery'

export type OnboardingDraft = Partial<TravelerProfile> & {
  locationChoice?: SessionContext['permission']
}

export type ExperienceRuntimeState = {
  arrivedItemId: string | null
  confirmedArrival: boolean
  narrationStarted: boolean
  mysteryRevealed: boolean
  completedIds: string[]
}

export type SystemSim = 'off' | 'gps-weak' | 'permission-denied' | 'no-token' | 'planning' | 'offline'

export type TravelerState = {
  onboarding: OnboardingDraft
  profile: TravelerProfile | null
  session: SessionContext
  route: ComposedRoute | null
  cursor: number
  lastDelta: RouteDelta | null
  experience: ExperienceRuntimeState
  savedIds: string[]
  screen: ScreenId
  returnScreen: ScreenId | null
  density: EditorialDensity
  reduceMotion: boolean
  location: LocationSignal
  sim: SystemSim
  hydrated: boolean
  demoBanner: true
}

export type TravelerAction =
  | { type: 'hydrate'; state: Partial<TravelerState> }
  | { type: 'patchOnboarding'; patch: OnboardingDraft }
  | { type: 'setScreen'; screen: ScreenId }
  | { type: 'openOverlay'; screen: ScreenId }
  | { type: 'closeOverlay' }
  | { type: 'setProfile'; profile: TravelerProfile; session: SessionContext }
  | { type: 'setRoute'; route: ComposedRoute; cursor?: number }
  | { type: 'setCursor'; cursor: number }
  | { type: 'setDelta'; delta: RouteDelta | null }
  | { type: 'arrive'; itemId: string }
  | { type: 'confirmArrival' }
  | { type: 'beginExperience' }
  | { type: 'revealMystery' }
  | { type: 'completeExperience'; itemId: string }
  | { type: 'save'; itemId: string }
  | { type: 'setLocation'; location: LocationSignal }
  | { type: 'setSim'; sim: SystemSim }
  | { type: 'setReduceMotion'; value: boolean }
  | { type: 'setDensity'; density: EditorialDensity }

export const SCHEMA_VERSION = 1

export function createInitialState(): TravelerState {
  return {
    onboarding: {},
    profile: null,
    session: {
      cityId: 'rome',
      locationMode: 'planning',
      permission: 'unknown',
      startedAtIso: new Date().toISOString(),
    },
    route: null,
    cursor: 0,
    lastDelta: null,
    experience: {
      arrivedItemId: null,
      confirmedArrival: false,
      narrationStarted: false,
      mysteryRevealed: false,
      completedIds: [],
    },
    savedIds: [],
    screen: 'A01',
    returnScreen: null,
    density: 2,
    reduceMotion: false,
    location: { status: 'planning' },
    sim: 'off',
    hydrated: false,
    demoBanner: true,
  }
}
