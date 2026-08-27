import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Body, EditorialLabel, Meta, PrimaryAction, Screen, Title } from '../design/primitives'
import { color, space, type } from '../design/tokens'
import { useTraveler } from '../state/TravelerContext'
import { SCREEN_REGISTRY, type ScreenStatus } from './screenInventory'

export function DevScreenGallery() {
  const { dispatch } = useTraveler()
  const [group, setGroup] = useState<string>('all')
  const [density, setDensity] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')
  const rows = useMemo(
    () =>
      SCREEN_REGISTRY.filter((entry) => {
        if (group !== 'all' && entry.group !== group) return false
        if (density !== 'all' && String(entry.density) !== density) return false
        if (status !== 'all' && entry.status !== status) return false
        return true
      }),
    [density, group, status],
  )

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: space.s, paddingBottom: space.xl }}>
        <EditorialLabel>DEV</EditorialLabel>
        <Title>Screen gallery</Title>
        <Body>Not the traveler flow. Status is honest.</Body>
        <View style={styles.row}>
          {['all', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'dev'].map((value) => (
            <Chip key={value} label={value} on={group === value} onPress={() => setGroup(value)} />
          ))}
        </View>
        <View style={styles.row}>
          {['all', '0', '1', '2', '3'].map((value) => (
            <Chip key={value} label={`D${value}`} on={density === value} onPress={() => setDensity(value)} />
          ))}
        </View>
        <View style={styles.row}>
          {(['all', 'functional', 'visual-draft', 'not-started'] as const).map((value) => (
            <Chip key={value} label={value} on={status === value} onPress={() => setStatus(value)} />
          ))}
        </View>
        {rows.map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => dispatch({ type: 'openOverlay', screen: entry.id })}
            style={styles.item}
          >
            <Text style={styles.id}>{entry.id}</Text>
            <Text style={styles.title}>{entry.title}</Text>
            <Meta>
              D{entry.density} · {statusLabel(entry.status)}
            </Meta>
          </Pressable>
        ))}
        <PrimaryAction quiet label="Back to settings" onPress={() => dispatch({ type: 'setScreen', screen: 'I01' })} />
      </ScrollView>
    </Screen>
  )
}

function statusLabel(status: ScreenStatus) {
  if (status === 'functional') return 'functional'
  if (status === 'visual-draft') return 'visual-draft — not finished'
  return 'not-started — contract only'
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: color.ink800, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: color.ember },
  chipText: { fontFamily: type.ui, fontSize: 12, color: color.ink900 },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.ink800 },
  id: { fontFamily: type.condensed, letterSpacing: 1.4, color: color.emberDeep },
  title: { fontFamily: type.display, fontSize: 22, color: color.ink900 },
})
