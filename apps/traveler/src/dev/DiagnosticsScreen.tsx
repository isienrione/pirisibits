import { useEffect, useState } from 'react'
import { AppState, StyleSheet, Text } from 'react-native'
import { Body, EditorialLabel, Meta, PrimaryAction, Screen, Title } from '../design/primitives'
import { MapSurface } from '../map/MapSurface'
import { useTraveler } from '../state/TravelerContext'
import { type } from '../design/tokens'

export function DiagnosticsScreen() {
  const { dispatch, state } = useTraveler()
  const [lifecycle, setLifecycle] = useState(AppState.currentState)
  const [audio, setAudio] = useState('idle')

  useEffect(() => {
    const sub = AppState.addEventListener('change', setLifecycle)
    return () => sub.remove()
  }, [])

  return (
    <Screen>
      <EditorialLabel>DEV · Diagnostics</EditorialLabel>
      <Title>Probe, not product.</Title>
      <Body>Lifecycle: {String(lifecycle)}</Body>
      <Text style={styles.mono}>audio: {audio}</Text>
      <PrimaryAction
        label="Mark audio probed"
        onPress={() => setAudio(audio === 'idle' ? 'probed' : 'idle')}
      />
      <MapSurface
        items={state.route?.items ?? []}
        token={process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? ''}
        forceNoToken={state.sim === 'no-token'}
        mysteryRevealed={state.experience.mysteryRevealed}
      />
      <Meta>Entry to the product is Welcome, not this screen.</Meta>
      <PrimaryAction quiet label="Back to settings" onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  mono: { fontFamily: type.ui, fontSize: 14 },
})
