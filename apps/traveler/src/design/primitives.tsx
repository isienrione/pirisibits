import type { ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDensity } from './DensityProvider'
import { color, space, type } from './tokens'

export function Screen({
  children,
  tone = 'daylight',
  density,
}: {
  children: ReactNode
  tone?: 'daylight' | 'immersion'
  density?: 0 | 1 | 2 | 3
}) {
  const insets = useSafeAreaInsets()
  const bg = tone === 'immersion' ? color.obsidian : color.bone
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: bg,
          paddingTop: Math.max(insets.top, space.l),
          paddingBottom: Math.max(insets.bottom, space.l),
        },
      ]}
    >
      {density != null ? (
        <Text style={[styles.meta, { color: tone === 'immersion' ? color.muted : color.ink800 }]}>
          D{density}
        </Text>
      ) : null}
      {children}
    </View>
  )
}

export function EditorialLabel({
  children,
  inverted = false,
}: {
  children: ReactNode
  inverted?: boolean
}) {
  return (
    <Text style={[styles.label, { color: inverted ? color.ember : color.emberDeep }]}>{children}</Text>
  )
}

export function PrimaryAction({
  label,
  onPress,
  quiet = false,
  disabled = false,
}: {
  label: string
  onPress: () => void
  quiet?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        quiet ? styles.quiet : styles.primary,
        pressed && { opacity: 0.86 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={quiet ? styles.quietText : styles.primaryText}>{label}</Text>
    </Pressable>
  )
}

export function PaperRule() {
  const density = useDensity()
  if (density === 0) return null
  return <View style={styles.rule} />
}

export function RouteLine({
  tall = false,
}: {
  tall?: boolean
}) {
  const density = useDensity()
  if (density === 0) return null
  return <View style={[styles.routeLine, tall && { height: 72 }]} />
}

export function PhotoPlaceholder({
  label,
}: {
  label: string
}) {
  const density = useDensity()
  if (density === 0) return null
  return (
    <View style={styles.photo} accessibilityLabel={label}>
      <Text style={styles.photoText}>{label}</Text>
    </View>
  )
}

export function InstrumentMetric({
  kicker,
  value,
  unit,
}: {
  kicker: string
  value: string
  unit?: string
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricKicker}>{kicker}</Text>
      <Text style={styles.metricValue}>
        {value}
        {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  )
}

export function Title({
  children,
  inverted = false,
  style,
}: {
  children: ReactNode
  inverted?: boolean
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text
      style={[
        styles.title,
        { color: inverted ? color.warmWhite : color.ink900 },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

export function Body({
  children,
  inverted = false,
}: {
  children: ReactNode
  inverted?: boolean
}) {
  return (
    <Text style={[styles.body, { color: inverted ? color.warmWhite : color.ink900 }]}>
      {children}
    </Text>
  )
}

export function Meta({
  children,
  inverted = false,
}: {
  children: ReactNode
  inverted?: boolean
}) {
  return (
    <Text style={[styles.meta, { color: inverted ? color.muted : color.ink800 }]}>{children}</Text>
  )
}

export function Cluster({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={[styles.cluster, style]}>{children}</View>
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space.edge,
    gap: space.m,
  },
  label: {
    fontFamily: type.condensedFallback,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: type.displayFallback,
    fontSize: 34,
    lineHeight: 38,
  },
  body: {
    fontFamily: type.uiFallback,
    fontSize: 17,
    lineHeight: 24,
  },
  meta: {
    fontFamily: type.uiFallback,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  primary: {
    minHeight: 52,
    backgroundColor: color.ember,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
  },
  primaryText: {
    color: color.inkOnFill,
    fontFamily: type.uiFallback,
    fontSize: 16,
    fontWeight: '600',
  },
  quiet: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: color.ink800,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
  },
  quietText: {
    color: color.ink900,
    fontFamily: type.uiFallback,
    fontSize: 16,
  },
  rule: {
    height: 1,
    backgroundColor: color.ink800,
    opacity: 0.35,
    marginVertical: space.s,
  },
  routeLine: {
    width: 2,
    height: 28,
    backgroundColor: color.ember,
    marginLeft: 7,
  },
  photo: {
    height: 160,
    backgroundColor: color.ink800,
    justifyContent: 'flex-end',
    padding: space.m,
  },
  photoText: {
    color: color.bone,
    fontFamily: type.uiFallback,
    fontSize: 13,
  },
  metric: {
    gap: 4,
  },
  metricKicker: {
    color: color.muted,
    fontFamily: type.condensedFallback,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  metricValue: {
    color: color.warmWhite,
    fontFamily: type.displayFallback,
    fontSize: 40,
  },
  metricUnit: {
    fontSize: 16,
    color: color.muted,
  },
  cluster: {
    gap: space.m,
    flex: 1,
  },
})
