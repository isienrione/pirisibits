import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'
import type { RouteItemView } from '@chronowalk/domain'
import { color, space, type } from '../design/tokens'
import { copy } from '../copy'
import { places } from '../media/places'

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
        <Text style={styles.body}>{copy.map.empty}</Text>
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
      <Text style={styles.body}>{tokenPresent ? copy.map.sketch : copy.map.noToken}</Text>
      {planning ? <Text style={styles.meta}>{copy.map.planning}</Text> : null}
      <ImageBackground source={places.forum} style={styles.plot} imageStyle={styles.plotImage} accessibilityLabel={copy.map.title}>
        <View style={styles.plotDim} />
        {points.map((item) => {
          const x = maxLng === minLng ? 50 : ((item.coordinate!.lng - minLng) / (maxLng - minLng)) * 100
          const y = maxLat === minLat ? 50 : (1 - (item.coordinate!.lat - minLat) / (maxLat - minLat)) * 100
          const mystery = item.mystery.isMystery && !mysteryRevealed
          const size = item.treatment === 'hero' ? 16 : item.treatment === 'discovery' ? 11 : 8
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
                        : color.warmWhite,
                },
              ]}
            />
          )
        })}
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    gap: space.s,
    paddingVertical: space.s,
    flex: 1,
  },
  plot: {
    height: 280,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  plotImage: {
    resizeMode: 'cover',
    opacity: 0.85,
  },
  plotDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,19,15,0.28)',
  },
  dot: {
    position: 'absolute',
    borderRadius: 0,
  },
  body: {
    fontFamily: type.ui,
    fontSize: 15,
    color: color.ink900,
    lineHeight: 22,
  },
  meta: {
    fontFamily: type.ui,
    fontSize: 13,
    color: color.ink800,
  },
})
