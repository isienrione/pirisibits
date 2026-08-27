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
import { useChrome } from './chrome'
import { color, space, type } from './tokens'

export function Screen({
  children,
  tone = 'daylight',
  flush = false,
}: {
  children: ReactNode
  tone?: 'daylight' | 'immersion'
  flush?: boolean
}) {
  const insets = useSafeAreaInsets()
  const chrome = useChrome()
  const bg = tone === 'immersion' ? color.obsidian : color.bone
  const top = flush ? 0 : Math.max(insets.top, 12)
  const bottom = flush ? 0 : Math.max(insets.bottom, chrome.shell ? 8 : 16)
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: bg,
          paddingTop: top,
          paddingBottom: bottom,
          paddingHorizontal: flush ? 0 : space.edge,
          gap: flush ? 0 : space.m,
        },
      ]}
    >
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
  inverted = false,
}: {
  label: string
  onPress: () => void
  quiet?: boolean
  disabled?: boolean
  inverted?: boolean
}) {
  const quietStyle = inverted ? styles.quietInverted : styles.quiet
  const quietText = inverted ? styles.quietInvertedText : styles.quietText
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        quiet ? quietStyle : styles.primary,
        pressed && { opacity: 0.88 },
        disabled && { opacity: 0.38 },
      ]}
    >
      <Text style={quiet ? quietText : styles.primaryText}>{label}</Text>
    </Pressable>
  )
}

export function QuietAction({
  label,
  onPress,
  inverted = false,
}: {
  label: string
  onPress: () => void
  inverted?: boolean
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.link}>
      <Text style={[styles.linkText, inverted && { color: color.warmWhite }]}>{label}</Text>
    </Pressable>
  )
}

export function PaperRule({ inverted = false }: { inverted?: boolean }) {
  const density = useDensity()
  if (density === 0) return null
  return <View style={[styles.rule, inverted && { backgroundColor: color.hairlineOnDark }]} />
}

export function RouteLine({ tall = false }: { tall?: boolean }) {
  const density = useDensity()
  if (density === 0) return null
  return <View style={[styles.routeLine, tall && { height: 56 }]} />
}

export function PhotoPlaceholder({ label }: { label: string }) {
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
      style={[styles.title, { color: inverted ? color.warmWhite : color.ink900 }, style]}
    >
      {children}
    </Text>
  )
}

export function Body({
  children,
  inverted = false,
  style,
}: {
  children: ReactNode
  inverted?: boolean
  style?: StyleProp<TextStyle>
}) {
  return (
    <Text style={[styles.body, { color: inverted ? color.warmWhite : color.ink800 }, style]}>
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
    gap: space.m,
  },
  label: {
    fontFamily: type.condensed,
    fontSize: 13,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: type.display,
    fontSize: 32,
    lineHeight: 38,
  },
  body: {
    fontFamily: type.ui,
    fontSize: 16,
    lineHeight: 24,
  },
  meta: {
    fontFamily: type.ui,
    fontSize: 13,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  primary: {
    minHeight: 52,
    backgroundColor: color.ember,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
    borderRadius: 2,
  },
  primaryText: {
    color: color.inkOnFill,
    fontFamily: type.uiSemi,
    fontSize: 16,
  },
  quiet: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
  },
  quietText: {
    color: color.ink900,
    fontFamily: type.uiMedium,
    fontSize: 16,
  },
  quietInverted: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.l,
  },
  quietInvertedText: {
    color: color.warmWhite,
    fontFamily: type.uiMedium,
    fontSize: 16,
  },
  link: {
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: type.ui,
    fontSize: 15,
    color: color.emberDeep,
  },
  rule: {
    height: 1,
    backgroundColor: color.hairline,
    marginVertical: 4,
  },
  routeLine: {
    width: 1.5,
    height: 22,
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
    fontFamily: type.ui,
    fontSize: 13,
  },
  metric: {
    gap: 4,
  },
  metricKicker: {
    color: color.muted,
    fontFamily: type.condensed,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  metricValue: {
    color: color.warmWhite,
    fontFamily: type.display,
    fontSize: 36,
    lineHeight: 40,
  },
  metricUnit: {
    fontSize: 16,
    color: color.muted,
    fontFamily: type.ui,
  },
  cluster: {
    gap: space.m,
    flex: 1,
  },
})
