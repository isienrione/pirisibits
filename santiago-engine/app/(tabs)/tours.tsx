import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { HandwrittenNote } from '@/src/components/HandwrittenNote';
import { CURATED_TOURS } from '@/src/data/curatedTours';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function ToursScreen() {
  const { applyCuratedStops } = useWalk();

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark compact />
        <Text style={styles.h1}>Tours de autor</Text>
        <HandwrittenNote style={{ marginBottom: 12 }}>itinerarios fijos · estilo OTA</HandwrittenNote>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          {CURATED_TOURS.map((tour) => (
            <View key={tour.id} style={styles.card}>
              <Text style={styles.kicker}>{tour.kicker} · {tour.durationLabel}</Text>
              <Text style={styles.title}>{tour.title.toUpperCase()}</Text>
              <Text style={styles.sub}>{tour.subtitle}</Text>
              <Text style={styles.count}>{tour.stopIds.length} paradas</Text>
              <Pressable
                onPress={() => {
                  applyCuratedStops(tour.stopIds, tour.title);
                  router.push('/(tabs)');
                }}
                style={styles.cta}
              >
                <Text style={styles.ctaTxt}>CAMINAR ESTA RUTA →</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 40, lineHeight: 40, marginTop: 10 },
  card: {
    borderWidth: 1.5,
    borderColor: ChronoTokens.colors.inkBlack,
    backgroundColor: ChronoTokens.colors.surfaceWhite,
    padding: 14,
    marginBottom: 12,
  },
  kicker: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    letterSpacing: 1.2,
    fontSize: 12,
    color: ChronoTokens.colors.accentRed,
  },
  title: {
    fontFamily: ChronoTokens.fonts.titleHeavy,
    fontSize: 24,
    lineHeight: 26,
    marginTop: 6,
  },
  sub: {
    fontFamily: ChronoTokens.fonts.body,
    fontSize: 14,
    color: ChronoTokens.colors.inkMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  count: { fontFamily: ChronoTokens.fonts.bodyMedium, fontSize: 12, marginTop: 8 },
  cta: {
    marginTop: 12,
    backgroundColor: ChronoTokens.colors.inkBlack,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTxt: { color: '#fff', fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.2, fontSize: 16 },
});
