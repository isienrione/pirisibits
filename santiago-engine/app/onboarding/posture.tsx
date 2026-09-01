import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { OnboardingProgress } from '@/src/components/OnboardingProgress';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { DISCOVERY_POSTURES, RHYTHM_POSTURE, type DiscoveryPostureId } from '@/src/data/algorithm';
import { LocalImages } from '@/src/data/localImages';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';

const IMAGES: Record<DiscoveryPostureId, typeof LocalImages.lastarria> = {
  D1: LocalImages.lastarria,
  D2: LocalImages.centro,
  D3: LocalImages.mapaDibujado,
};

export default function PostureScreen() {
  const { rhythm, setDiscoveryPosture } = useWalk();
  const selected = RHYTHM_POSTURE[rhythm];

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <OnboardingProgress step={3} />
        <Image source={LocalImages.swatchMustard} style={styles.torn} resizeMode="contain" />
        <Text style={styles.h1}>¿Cómo prefieres descubrir?</Text>
        <HandwrittenNote style={styles.note}>postura D_z</HandwrittenNote>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          {(Object.keys(DISCOVERY_POSTURES) as DiscoveryPostureId[]).map((id) => {
            const item = DISCOVERY_POSTURES[id];
            const on = selected === id;
            return (
              <Pressable key={id} onPress={() => setDiscoveryPosture(id)} style={[styles.card, on && styles.cardOn]}>
                <Image source={IMAGES[id]} style={styles.img} />
                <View style={styles.wash} />
                <View style={styles.cardText}>
                  <Text style={styles.kicker}>{item.kicker} · {item.title.toUpperCase()}</Text>
                  <Text style={styles.cardSub}>{item.subtitle}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <ChronoActionButton title="Siguiente" onPress={() => router.push('/onboarding/time')} />
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  torn: { position: 'absolute', right: -16, top: 4, width: 120, height: 80 },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 40,
    lineHeight: 40,
    color: ChronoTokens.colors.inkBlack,
    width: '88%',
  },
  note: { alignSelf: 'flex-end', marginBottom: 12 },
  card: {
    height: 148,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
  },
  cardOn: { borderColor: ChronoTokens.colors.accentRed, borderWidth: 2.5 },
  img: { width: '100%', height: '100%' },
  wash: { ...fillParent, backgroundColor: 'rgba(92, 58, 28, 0.22)' },
  cardText: {
    position: 'absolute',
    left: 10,
    right: 46,
    bottom: 10,
    backgroundColor: ChronoTokens.colors.paperBase,
    borderWidth: 1.2,
    borderColor: ChronoTokens.colors.inkBlack,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  kicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 20,
    color: ChronoTokens.colors.inkBlack,
  },
  cardSub: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 12,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 2,
  },
  radio: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.paperBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    backgroundColor: ChronoTokens.colors.accentRed,
    borderColor: ChronoTokens.colors.accentRed,
  },
  check: { color: '#fff', fontWeight: '700' },
});
