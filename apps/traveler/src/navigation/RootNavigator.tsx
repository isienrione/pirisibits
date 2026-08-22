import type { ComponentType } from 'react'
import { StatusBar } from 'expo-status-bar'
import { AppShell } from '../design/chrome'
import { DensityProvider } from '../design/DensityProvider'
import { DiagnosticsScreen } from '../dev/DiagnosticsScreen'
import { DevScreenGallery } from '../registry/DevScreenGallery'
import { SCREEN_REGISTRY } from '../registry/screenInventory'
import {
  ActiveListScreen,
  ActiveMapScreen,
  AdjustPlanScreen,
  ArrivalScreen,
  CityMapScreen,
  ComposingScreen,
  ContractScreen,
  DetailHuntScreen,
  DiscoveryScreen,
  ExperienceCompleteScreen,
  ForkScreen,
  GpsWeakScreen,
  HeroCoverScreen,
  HeroRuntimeScreen,
  HomeActiveScreen,
  HomeProposalScreen,
  InterestsScreen,
  LocationPermissionScreen,
  MapDetailSheetScreen,
  MobilityScreen,
  MysteryRevealedScreen,
  MysterySealedScreen,
  OfflineScreen,
  ReadyScreen,
  RecomposedScreen,
  RecomposingScreen,
  ResumeScreen,
  RevealScreen,
  RouteControlScreen,
  RouteScoreScreen,
  SavedScreen,
  SeekingLocationScreen,
  SettingsScreen,
  SkipScreen,
  StyleScreen,
  TimeScreen,
  WalkInstrumentScreen,
  WelcomeScreen,
  WhyThisScreen,
} from '../screens/flow'
import { useTraveler } from '../state/TravelerContext'
import type { ScreenId } from '../state/types'

const FUNCTIONAL: Partial<Record<ScreenId, ComponentType>> = {
  A01: WelcomeScreen,
  A03: InterestsScreen,
  A05: StyleScreen,
  A06: MobilityScreen,
  A07: TimeScreen,
  A08: LocationPermissionScreen,
  A10: ReadyScreen,
  K01: ComposingScreen,
  B01: HomeProposalScreen,
  B03: HomeActiveScreen,
  B04: RouteScoreScreen,
  B05: WhyThisScreen,
  B06: AdjustPlanScreen,
  C01: WalkInstrumentScreen,
  C03: ArrivalScreen,
  C04: RouteControlScreen,
  C05: ActiveListScreen,
  C06: ActiveMapScreen,
  C07: ResumeScreen,
  D01: HeroCoverScreen,
  D02: HeroRuntimeScreen,
  D05: DiscoveryScreen,
  D07: MysterySealedScreen,
  D08: MysteryRevealedScreen,
  D09: RevealScreen,
  D12: ExperienceCompleteScreen,
  E01: ForkScreen,
  E03: RecomposedScreen,
  E04: SkipScreen,
  F01: CityMapScreen,
  F03: MapDetailSheetScreen,
  G01: SavedScreen,
  I01: SettingsScreen,
  J01: OfflineScreen,
  J03: GpsWeakScreen,
  K02: RecomposingScreen,
  K05: SeekingLocationScreen,
  L01: DetailHuntScreen,
  Diagnostics: DiagnosticsScreen,
  Gallery: DevScreenGallery,
}

const SHELL_SCREENS = new Set<ScreenId>(['B01', 'B03', 'B04', 'B05', 'B06', 'F01', 'F03', 'G01', 'I01'])
const IMMERSION_SCREENS = new Set<ScreenId>(['A01', 'K01', 'C01', 'C06', 'D01', 'D02', 'D07', 'D09', 'J03', 'K05'])

export function RootNavigator() {
  const { state, dispatch } = useTraveler()
  const entry = SCREEN_REGISTRY.find((item) => item.id === state.screen)
  const ScreenImpl = FUNCTIONAL[state.screen] ?? (() => <ContractScreen id={state.screen} />)
  const framed = (
    <DensityProvider value={entry?.density ?? 2}>
      <StatusBar style={IMMERSION_SCREENS.has(state.screen) ? 'light' : 'dark'} />
      <ScreenImpl />
    </DensityProvider>
  )
  if (!SHELL_SCREENS.has(state.screen)) return framed
  return (
    <AppShell screen={state.screen} onTab={(screen) => dispatch({ type: 'setScreen', screen })}>
      {framed}
    </AppShell>
  )
}
