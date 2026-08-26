import 'react-native-gesture-handler';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { WalkProvider } from '@/src/store/WalkContext';
import { useChronoStore } from '@/src/store/useChronoStore';
import { ChronoTokens } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const hasCompletedOnboarding = useChronoStore((s) => s.onboardingComplete);
  const segments = useSegments();

  useEffect(() => {
    const root = segments[0];
    const inOnboarding = root === 'onboarding';
    const onWelcome = !root;
    if (!hasCompletedOnboarding && !inOnboarding && !onWelcome) {
      router.replace('/onboarding/interests');
    }
  }, [hasCompletedOnboarding, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: ChronoTokens.colors.paperBase },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="place" />
      <Stack.Screen name="proposal" />
      <Stack.Screen name="why-route" />
      <Stack.Screen name="adjust-route" />
      <Stack.Screen name="walk" />
      <Stack.Screen name="wrong-route" />
      <Stack.Screen name="arrived" />
      <Stack.Screen name="route-control" />
      <Stack.Screen name="resume-paused" />
      <Stack.Screen name="experience" />
      <Stack.Screen name="audio" />
      <Stack.Screen name="audio-now" />
      <Stack.Screen name="audio-transcript" />
      <Stack.Screen name="discovery" />
      <Stack.Screen name="then-now" />
      <Stack.Screen name="micro" />
      <Stack.Screen name="mystery" />
      <Stack.Screen name="mystery-resolved" />
      <Stack.Screen name="end-of-day" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BebasNeue_400Regular,
    Caveat_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: ChronoTokens.colors.paperBase }}>
      <WalkProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </WalkProvider>
    </GestureHandlerRootView>
  );
}
