import { Redirect, Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ChronoTokens } from '@/src/theme/tokens';
import { useChronoStore } from '@/src/store/useChronoStore';

function TabIcon({ label, focused, glyph }: { label: string; focused: boolean; glyph: string }) {
  const color = focused ? ChronoTokens.colors.accentRed : ChronoTokens.colors.inkBlack;
  return (
    <View style={styles.item}>
      <Text style={[styles.glyph, { color }]}>{glyph}</Text>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const hasCompletedOnboarding = useChronoStore((s) => s.onboardingComplete);
  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding/interests" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.bar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon label="Inicio" focused={focused} glyph="⌂" />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ focused }) => <TabIcon label="Catálogo" focused={focused} glyph="▣" />,
        }}
      />
      <Tabs.Screen
        name="tours"
        options={{
          title: 'Tours',
          tabBarIcon: ({ focused }) => <TabIcon label="Tours" focused={focused} glyph="✦" />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ focused }) => <TabIcon label="Mapa" focused={focused} glyph="⌖" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon label="Perfil" focused={focused} glyph="⚙" />,
        }}
      />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="route" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: ChronoTokens.colors.paperBase,
    borderTopColor: ChronoTokens.colors.borderSoft,
    height: 72,
    paddingTop: 8,
  },
  item: { alignItems: 'center', minWidth: 58 },
  glyph: { fontSize: 18, marginBottom: 2 },
  label: { fontFamily: ChronoTokens.fonts.body, fontSize: 10 },
});
