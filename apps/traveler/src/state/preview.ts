import type { ScreenId, TravelerState } from './types'
import { createInitialState } from './types'
import { demoService } from '../demo/DemoTravelerAppService'

const SCREEN_IDS: ScreenId[] = [
  'A01',
  'A03',
  'A05',
  'A06',
  'A07',
  'A08',
  'A10',
  'K01',
  'B01',
  'B03',
  'B04',
  'B05',
  'B06',
  'C01',
  'C03',
  'C04',
  'C05',
  'C06',
  'C07',
  'D01',
  'D02',
  'D05',
  'D07',
  'D08',
  'D09',
  'D12',
  'E01',
  'E03',
  'E04',
  'F01',
  'F03',
  'G01',
  'I01',
  'J01',
  'J03',
  'K02',
  'K05',
  'L01',
  'Diagnostics',
  'Gallery',
]

export function readPreviewScreen(): ScreenId | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('screen') ?? params.get('preview')
  if (!raw) return null
  return SCREEN_IDS.includes(raw as ScreenId) ? (raw as ScreenId) : null
}

export function isPreviewSession() {
  return readPreviewScreen() != null
}

export function buildPreviewState(screen: ScreenId): Partial<TravelerState> {
  const profile = {
    interests: ['antiquity' as const],
    explorationStyle: 'mixed' as const,
    mobility: 'walking' as const,
    timeBudgetMin: 120 as const,
  }
  const session = {
    cityId: 'rome' as const,
    locationMode: 'planning' as const,
    permission: 'skipped' as const,
    startedAtIso: '2026-08-22T00:00:00.000Z',
  }
  let route = demoService.composeProposal(profile, session)
  let cursor = 0
  let lastDelta = null as TravelerState['lastDelta']
  const experience: TravelerState['experience'] = {
    arrivedItemId: null,
    confirmedArrival: false,
    narrationStarted: false,
    mysteryRevealed: false,
    completedIds: [],
  }

  const indexOf = (pred: (item: (typeof route.items)[number]) => boolean) => {
    const index = route.items.findIndex(pred)
    return index >= 0 ? index : 0
  }

  let onboarding: TravelerState['onboarding'] = {
    ...profile,
    locationChoice: 'skipped',
  }

  switch (screen) {
    case 'A03':
      onboarding = { interests: ['antiquity'] }
      break
    case 'B01':
    case 'B03':
    case 'B04':
    case 'B05':
    case 'B06':
    case 'C04':
    case 'C05':
    case 'C06':
    case 'C07':
    case 'F01':
    case 'F03':
    case 'G01':
    case 'I01':
      break
    case 'C01':
    case 'C03':
    case 'K05':
    case 'J03':
      cursor = indexOf((item) => item.kind === 'experience')
      break
    case 'D01':
    case 'D02':
    case 'D12':
      cursor = indexOf((item) => item.treatment === 'hero')
      experience.arrivedItemId = route.items[cursor]?.id ?? null
      experience.confirmedArrival = true
      experience.narrationStarted = screen !== 'D01'
      break
    case 'D05':
      cursor = indexOf((item) => item.treatment === 'discovery')
      experience.confirmedArrival = true
      experience.narrationStarted = true
      break
    case 'D07':
      cursor = indexOf((item) => item.treatment === 'mystery')
      break
    case 'D08':
      cursor = indexOf((item) => item.treatment === 'mystery')
      experience.mysteryRevealed = true
      experience.confirmedArrival = true
      experience.narrationStarted = true
      break
    case 'D09':
      cursor = indexOf((item) => item.treatment === 'hero')
      experience.confirmedArrival = true
      experience.narrationStarted = true
      break
    case 'E01':
    case 'E04':
      cursor = indexOf((item) => item.treatment === 'hero')
      experience.completedIds = [route.items[cursor]?.id].filter(Boolean) as string[]
      break
    case 'E03':
    case 'K02': {
      const adapted = demoService.adaptRoute(route, { type: 'choose', optionId: 'skip-to-largo' }, 0)
      route = adapted.route
      lastDelta = adapted.delta
      break
    }
    case 'J01':
      break
    default:
      break
  }

  const state = createInitialState()
  return {
    ...state,
    onboarding,
    profile,
    session,
    route,
    cursor,
    lastDelta,
    experience,
    savedIds: screen === 'G01' ? ['w01'] : [],
    screen,
    hydrated: true,
    location: screen === 'J03' ? { status: 'weak', lat: null, lng: null, accuracyM: 80 } : { status: 'planning' },
    sim: screen === 'J03' ? 'gps-weak' : screen === 'J01' ? 'offline' : 'off',
  }
}
