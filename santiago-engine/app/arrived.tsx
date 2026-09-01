import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChronoActionButton } from '@/src/components/ChronoActionButton';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { WALK_STOPS } from '@/src/data/catalog';
import { LocalImages } from '@/src/data/localImages';
import { poiImage } from '@/src/data/pois';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';
import { fillParent } from '@/src/theme/layout';

export default function ArrivedScreen() {
  const { currentStopIndex, currentPoi, tourStops } = useWalk();
  const stop = currentPoi;
  const total = tourStops.length || WALK_STOPS.length;
  const hero = stop ? poiImage(stop) : LocalImages.morande;

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={`Parada ${currentStopIndex + 1} de ${total}`} onBack={() => router.back()} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={styles.tag}>
            <Text style={styles.tagTxt}>LLEGADA</Text>
          </View>
          <Text style={styles.h1}>{(stop?.title ?? 'La parada').toUpperCase()}</Text>
          <Text style={styles.sub}>{stop?.subtitle ?? ''}</Text>

          <View style={styles.hero}>
            <Image source={hero} style={styles.heroImg} resizeMode="cover" />
            <View style={styles.heroWash} />
            <View style={styles.stamp}>
              <Text style={styles.stampTxt}>TÓMATE UN{'\n'}MOMENTO</Text>
            </View>
          </View>

          <ChronoActionButton title="COMENZAR EXPERIENCIA" onPress={() => router.push('/walk/stop')} />
          <Pressable>
            <Text style={styles.min}>NECESITO UN MINUTO</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: ChronoTokens.colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  tagTxt: {
    color: '#fff',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 13,
    letterSpacing: 1.4,
  },
  h1: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 48,
    lineHeight: 46,
    color: ChronoTokens.colors.inkBlack,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    color: ChronoTokens.colors.inkMuted,
    fontSize: 16,
    marginBottom: 14,
    marginTop: 4,
  },
  hero: {
    height: 220,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: '#D8C9B0',
  },
  heroImg: { width: '100%', height: '100%' },
  heroWash: {
    ...fillParent,
    backgroundColor: 'rgba(92, 58, 28, 0.2)',
  },
  stamp: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 108,
    height: 108,
    backgroundColor: ChronoTokens.colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
    padding: 8,
  },
  stampTxt: {
    color: '#FFF',
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 14,
    letterSpacing: 0.8,
    textAlign: 'center',
    lineHeight: 16,
  },
  min: {
    textAlign: 'center',
    marginTop: 14,
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1,
    color: ChronoTokens.colors.inkBlack,
  },
});
