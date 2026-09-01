import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { LocalImages } from '@/src/data/localImages';
import { useWalk } from '@/src/store/WalkContext';

export default function WelcomeScreen() {
  const { hasCompletedOnboarding, hasHydrated } = useWalk();

  useEffect(() => {
    if (!hasHydrated) return;
    if (hasCompletedOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasHydrated, hasCompletedOnboarding]);
  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.lang}>
            <Text style={styles.langTxt}>ES</Text>
          </View>
          <Pressable hitSlop={12} style={styles.menuBtn}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

        <View style={styles.heroText}>
          <Text style={styles.title}>CHRONO</Text>
          <Text style={styles.title}>WALK</Text>
          <Text style={styles.city}>SANTIAGO</Text>
          <Text style={styles.tagline}>La ciudad se revela cuando la caminas.</Text>
        </View>

        <View style={styles.collage} pointerEvents="none">
          <Image source={LocalImages.andes} style={styles.andes} resizeMode="cover" />
          <Image source={LocalImages.mapaDibujado} style={styles.map} resizeMode="cover" />
          <Image source={LocalImages.stampRedSun} style={styles.sun} resizeMode="contain" />
          <Image source={LocalImages.cathedral} style={styles.tower} resizeMode="contain" />
          <Image source={LocalImages.swatchTeal} style={styles.teal} resizeMode="contain" />
          <Image source={LocalImages.swatchMustard} style={styles.mustard} resizeMode="contain" />
          <Image source={LocalImages.walker} style={styles.walker} resizeMode="contain" />
        </View>

        <View style={styles.spacer} />

        <View style={styles.ctaWrap}>
          <Pressable
            onPress={() => router.replace('/onboarding/interests')}
            style={styles.cta}
          >
            <Text style={styles.ctaTxt}>COMENZAR →</Text>
          </Pressable>
          <View style={styles.stampDot} />
        </View>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 4,
  },
  lang: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTxt: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    color: '#121212',
  },
  menuBtn: {
    width: 28,
    height: 20,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  menuLine: {
    height: 1.6,
    backgroundColor: '#121212',
    borderRadius: 1,
  },
  heroText: {
    paddingHorizontal: 20,
    marginTop: 16,
    zIndex: 4,
  },
  title: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 64,
    color: '#121212',
    letterSpacing: 1.5,
    lineHeight: 58,
  },
  city: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    color: '#E54B2D',
    letterSpacing: 4,
    marginTop: 6,
  },
  tagline: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#121212',
    maxWidth: 240,
    marginTop: 8,
    lineHeight: 22,
  },
  collage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '32%',
    bottom: 78,
  },
  andes: {
    position: 'absolute',
    left: -36,
    top: 20,
    width: '80%',
    height: 220,
    opacity: 0.88,
    zIndex: 1,
  },
  map: {
    position: 'absolute',
    left: -24,
    right: 40,
    bottom: 18,
    height: 128,
    opacity: 0.78,
    zIndex: 2,
    transform: [{ rotate: '-3deg' }],
  },
  sun: {
    position: 'absolute',
    right: 28,
    top: 6,
    width: 130,
    height: 130,
    zIndex: 2,
  },
  tower: {
    position: 'absolute',
    right: -18,
    top: -12,
    width: 188,
    height: 340,
    zIndex: 3,
  },
  teal: {
    position: 'absolute',
    right: -36,
    bottom: 28,
    width: 210,
    height: 140,
    zIndex: 4,
    transform: [{ rotate: '8deg' }],
  },
  mustard: {
    position: 'absolute',
    right: 18,
    bottom: -8,
    width: 150,
    height: 100,
    zIndex: 4,
    transform: [{ rotate: '-12deg' }],
  },
  walker: {
    position: 'absolute',
    left: -4,
    bottom: 8,
    width: 230,
    height: 390,
    zIndex: 6,
  },
  spacer: {
    flex: 1,
  },
  ctaWrap: {
    marginHorizontal: 20,
    marginBottom: 30,
    zIndex: 8,
  },
  cta: {
    backgroundColor: '#121212',
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTxt: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 22,
    color: '#FFF',
    letterSpacing: 2,
  },
  stampDot: {
    position: 'absolute',
    right: 12,
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E54B2D',
  },
});
