import { createContext, useContext, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { copy } from '../copy'
import type { ScreenId } from '../state/types'
import { color, layout, space, type } from './tokens'

const ChromeContext = createContext({ shell: false })

export function useChrome() {
  return useContext(ChromeContext)
}

type TabId = 'home' | 'map' | 'saved' | 'settings'

function tabForScreen(screen: ScreenId): TabId | null {
  if (['B01', 'B03', 'B04', 'B05', 'B06'].includes(screen)) return 'home'
  if (['F01', 'F03', 'C06'].includes(screen)) return 'map'
  if (screen === 'G01') return 'saved'
  if (['I01', 'Gallery', 'Diagnostics'].includes(screen)) return 'settings'
  return null
}

export function AppShell({
  screen,
  onTab,
  children,
}: {
  screen: ScreenId
  onTab: (screen: ScreenId) => void
  children: ReactNode
}) {
  const insets = useSafeAreaInsets()
  const active = tabForScreen(screen) ?? 'home'
  return (
    <ChromeContext.Provider value={{ shell: true }}>
      <View style={styles.root}>
        <View style={styles.body}>{children}</View>
        <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <Tab
            label={copy.nav.home}
            on={active === 'home'}
            onPress={() => onTab(screen === 'B03' ? 'B03' : 'B01')}
          />
          <Tab label={copy.nav.map} on={active === 'map'} onPress={() => onTab('F01')} />
          <Tab label={copy.nav.saved} on={active === 'saved'} onPress={() => onTab('G01')} />
          <Tab
            label={copy.nav.settings}
            on={active === 'settings'}
            onPress={() => onTab('I01')}
          />
        </View>
      </View>
    </ChromeContext.Provider>
  )
}

function Tab({
  label,
  on,
  onPress,
}: {
  label: string
  on: boolean
  onPress: () => void
}) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={onPress} style={styles.tab}>
      <View style={[styles.tick, on && styles.tickOn]} />
      <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bone },
  body: { flex: 1 },
  bar: {
    minHeight: layout.tabBar,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.hairline,
    backgroundColor: color.bone,
    paddingTop: 8,
    paddingHorizontal: space.s,
  },
  tab: { flex: 1, alignItems: 'center', gap: 6, paddingTop: 4 },
  tick: { width: 16, height: 2, backgroundColor: 'transparent' },
  tickOn: { backgroundColor: color.ember },
  tabLabel: {
    fontFamily: type.uiMedium,
    fontSize: 12,
    color: color.ink800,
  },
  tabLabelOn: { color: color.ink900 },
})
