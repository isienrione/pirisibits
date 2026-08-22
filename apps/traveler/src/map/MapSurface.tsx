import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RouteItemView } from '@chronowalk/domain'
import { color, space, type } from '../design/tokens'

export function MapSurface({
  items,
  token,
  forceNoToken,
  activeId,
  mysteryRevealed,
  onSelect,
  planning,
}: {
  items: RouteItemView[]
  token: string
  forceNoToken?: boolean
  activeId?: string | null
  mysteryRevealed: boolean
  onSelect?: (item: RouteItemView) => void
  planning?: boolean
}) {
  const points = items.filter((item) => item.coordinate)
  const tokenPresent = Boolean(token) && !forceNoToken

  if (points.length === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.kicker}>Map</Text>
        <Text style={styles.body}>Not enough sourced coordinates to draw a route. No invented line.</Text>
      </View>
    )
  }

  const lats = points.map((item) => item.coordinate!.lat)
  const lngs = points.map((item) => item.coordinate!.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>{tokenPresent ? 'Schematic from sourced geofences' : 'No Mapbox token'}</Text>
      <Text style={styles.body}>
        {tokenPresent
          ? 'Token is present. Native Mapbox is not mounted in this demo build; the same sourced points are shown as a paper plot so the screen never goes blank.'
          : 'Configure EXPO_PUBLIC_MAPBOX_TOKEN to enable Mapbox. The route remains readable as a list and as this paper plot.'}
      </Text>
      {planning ? (
        <Text style={styles.body}>Planning mode — distance from you is not shown.</Text>
      ) : null}
      <View style={styles.plot} accessibilityLabel="Sourced route schematic">
        {points.map((item) => {
          const x =
            maxLng === minLng ? 50 : ((item.coordinate!.lng - minLng) / (maxLng - minLng)) * 100
          const y =
            maxLat === minLat ? 50 : (1 - (item.coordinate!.lat - minLat) / (maxLat - minLat)) * 100
          const mystery = item.mystery.isMystery && !mysteryRevealed
          const size = item.treatment === 'hero' ? 18 : item.treatment === 'discovery' ? 12 : 8
          return (
            <Pressable
              key={item.id}
              onPress={() => onSelect?.(item)}
              accessibilityLabel={mystery ? item.spoilerSafeTitle : item.title}
              style={[
                styles.dot,
                {
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  backgroundColor: mystery
                    ? color.muted
                    : item.id === activeId
                      ? color.ember
                      : item.treatment === 'hero'
                        ? color.actArena
                        : color.ink900,
                },
              ]}
            />
          )
        })}
      </View>
      <Text style={styles.meta}>Precision: geofence centers from the Rome manifest. Not turn-by-turn.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    gap: space.s,
    paddingVertical: space.m,
  },
  plot: {
    height: 220,
    backgroundColor: color.warmWhite,
    borderColor: color.ink800,
    borderWidth: 1,
  },
  dot: {
    position: 'absolute',
    borderRadius: 0,
  },
  kicker: {
    fontFamily: type.condensedFallback,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: color.emberDeep,
    fontSize: 12,
  },
  body: {
    fontFamily: type.uiFallback,
    fontSize: 15,
    color: color.ink900,
    lineHeight: 22,
  },
  meta: {
    fontFamily: type.uiFallback,
    fontSize: 12,
    color: color.ink800,
  },
})
