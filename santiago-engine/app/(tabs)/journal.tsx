import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/src/components/Chrome';
import { ChronoScreen } from '@/src/components/ChronoScreen';
import { getPoiById, poiImage } from '@/src/data/pois';
import { useWalk } from '@/src/store/WalkContext';
import { ChronoTokens } from '@/src/theme/tokens';

export default function JournalTab() {
  const { userJournal, activeTour } = useWalk();
  const places = userJournal.placesVisited
    .map((id) => getPoiById(id))
    .filter(Boolean);
  const km = userJournal.totalDistanceKm || activeTour?.distanceKm || 0;
  const minutes = userJournal.totalMinutes || activeTour?.totalMinutes || 0;
  const note = userJournal.personalNotes[userJournal.date];

  return (
    <ChronoScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <BrandMark compact />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <Text style={styles.k}>MI DIARIO</Text>
          <Text style={styles.h1}>{userJournal.headline}</Text>
          <Text style={styles.date}>{userJournal.date}</Text>

          <View style={styles.stats}>
            {[
              [String(places.length || activeTour?.completedStops.length || 0), 'lugares'],
              [km.toFixed(1).replace('.', ','), 'km'],
              [`${minutes}`, 'min'],
              [String(userJournal.steps || Math.round(km * 1350)), 'pasos'],
            ].map(([n, l]) => (
              <View key={l} style={styles.stat}>
                <Text style={styles.statN}>{n}</Text>
                <Text style={styles.statL}>{l}</Text>
              </View>
            ))}
          </View>

          {places.length ? (
            places.map((p) =>
              p ? (
                <View key={p.id} style={styles.row}>
                  <Image source={poiImage(p)} style={styles.thumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.place}>{p.title}</Text>
                    <Text style={styles.sub}>{p.neighborhood}</Text>
                  </View>
                </View>
              ) : null,
            )
          ) : (
            <Text style={styles.empty}>Todavía no cierras un día de caminata. Las paradas completadas aparecerán aquí.</Text>
          )}

          {note ? (
            <View style={styles.note}>
              <Text style={styles.noteK}>NOTA DEL DÍA</Text>
              <Text style={styles.noteB}>{note}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => router.push('/end-of-day')}>
            <Text style={styles.link}>VER CIERRE DEL DÍA →</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ChronoScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 20 },
  k: { fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.6, color: ChronoTokens.colors.accentPurple, marginTop: 12 },
  h1: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 36, lineHeight: 36, marginTop: 6 },
  date: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, marginBottom: 14 },
  stats: { flexDirection: 'row', borderWidth: 1.4, borderColor: '#121212', marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statN: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 20 },
  statL: { fontFamily: ChronoTokens.fonts.body, fontSize: 10, letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderWidth: 1, borderColor: '#121212' },
  place: { fontFamily: ChronoTokens.fonts.titleHeavy, fontSize: 18 },
  sub: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, fontSize: 12 },
  empty: { fontFamily: ChronoTokens.fonts.body, color: ChronoTokens.colors.inkMuted, lineHeight: 20 },
  note: { backgroundColor: ChronoTokens.colors.surfaceWhite, padding: 12, marginTop: 8, borderWidth: 1, borderColor: ChronoTokens.colors.borderSoft },
  noteK: { fontFamily: ChronoTokens.fonts.titleHeavy, color: ChronoTokens.colors.accentRed, letterSpacing: 1.2, marginBottom: 4 },
  noteB: { fontFamily: ChronoTokens.fonts.handwritten, fontSize: 22 },
  link: { marginTop: 16, fontFamily: ChronoTokens.fonts.titleHeavy, letterSpacing: 1.2 },
});
