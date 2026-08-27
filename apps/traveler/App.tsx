import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { RootNavigator } from './src/navigation/RootNavigator'
import { useForegroundLocation } from './src/location/useForegroundLocation'
import { createMemoryStore, nativeStore } from './src/state/store'
import { TravelerProvider, useTraveler } from './src/state/TravelerContext'
import { color } from './src/design/tokens'
import { useTravelerFonts } from './src/design/fonts'

const WALK_SCREENS = new Set(['C01', 'C03', 'C06', 'K05', 'J03'])

function LocationBridge() {
  const { state, dispatch } = useTraveler()
  const enabled =
    state.session.permission === 'granted' && WALK_SCREENS.has(state.screen) && state.sim !== 'planning'
  useForegroundLocation({
    enabled,
    sim: state.sim,
    locationApi: Location,
    onSignal: (location) => dispatch({ type: 'setLocation', location }),
  })
  useEffect(() => {
    if (state.sim === 'offline' && state.screen !== 'J01') {
      dispatch({ type: 'setScreen', screen: 'J01' })
    }
    if (state.location.status === 'weak' && state.screen === 'C01') {
      dispatch({ type: 'setScreen', screen: 'J03' })
    }
    if (state.location.status === 'granted-awaiting-fix' && state.screen === 'C01') {
      dispatch({ type: 'setScreen', screen: 'K05' })
    }
  }, [dispatch, state.location.status, state.screen, state.sim])
  return null
}

function Boot() {
  const { state } = useTraveler()
  if (!state.hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bone, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.ember} />
      </View>
    )
  }
  return (
    <>
      <LocationBridge />
      <RootNavigator />
    </>
  )
}

export default function App() {
  const store = useMemo(() => nativeStore() ?? createMemoryStore(), [])
  const { loaded, error } = useTravelerFonts()
  if (!loaded && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bone, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.ember} />
      </View>
    )
  }
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TravelerProvider store={store}>
        <Boot />
      </TravelerProvider>
    </SafeAreaProvider>
  )
}
